export const MAX_RESUME_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_RESUME_EXTRACTED_CHARACTERS = 30_000;
export const MAX_RESUME_PDF_PAGES = 30;
const MAX_DOCX_ENTRIES = 256;
const MAX_DOCX_UNCOMPRESSED_BYTES = 20 * 1024 * 1024;
const MIN_USEFUL_RESUME_CHARACTERS = 80;

export type ResumeDocumentType = "PDF" | "DOCX";

export type ResumeDocumentExtraction = {
  text: string;
  fileType: ResumeDocumentType;
};

function getDocumentType(file: File): ResumeDocumentType {
  const extension = file.name.toLocaleLowerCase().split(".").pop();
  if (extension === "pdf") return "PDF";
  if (extension === "docx") return "DOCX";
  throw new Error("Choose a PDF or DOCX file. Other document formats are not supported.");
}

function normalizeExtractedText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function validateDocxArchive(bytes: Uint8Array): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minOffset = Math.max(0, bytes.length - 65_557);
  let endOffset = -1;
  for (let offset = bytes.length - 22; offset >= minOffset; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }
  if (endOffset < 0) throw new Error("This DOCX file is incomplete or malformed. Paste the text manually.");

  const diskNumber = view.getUint16(endOffset + 4, true);
  const centralDirectoryDisk = view.getUint16(endOffset + 6, true);
  const entriesOnDisk = view.getUint16(endOffset + 8, true);
  const totalEntries = view.getUint16(endOffset + 10, true);
  const centralDirectorySize = view.getUint32(endOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(endOffset + 16, true);
  if (
    diskNumber !== 0 ||
    centralDirectoryDisk !== 0 ||
    entriesOnDisk !== totalEntries ||
    totalEntries === 0xffff ||
    totalEntries > MAX_DOCX_ENTRIES ||
    centralDirectoryOffset + centralDirectorySize > endOffset
  ) {
    throw new Error("This DOCX uses an unsupported or oversized archive layout. Paste the text manually.");
  }

  let offset = centralDirectoryOffset;
  let totalUncompressed = 0;
  const names = new Set<string>();
  const decoder = new TextDecoder();
  for (let entry = 0; entry < totalEntries; entry += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("This DOCX file is malformed. Paste the text manually.");
    }
    const flags = view.getUint16(offset + 8, true);
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const entryEnd = offset + 46 + nameLength + extraLength + commentLength;
    if (entryEnd > endOffset || nameLength === 0 || flags & 1 || ![0, 8].includes(compressionMethod)) {
      throw new Error("This DOCX is encrypted or uses an unsupported archive format. Paste the text manually.");
    }
    if (uncompressedSize === 0xffffffff || compressedSize === 0xffffffff) {
      throw new Error("This DOCX uses an unsupported archive layout. Paste the text manually.");
    }
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_DOCX_UNCOMPRESSED_BYTES) {
      throw new Error("This DOCX expands beyond the safe 20 MB processing limit. Paste the text manually.");
    }
    names.add(decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength)));
    offset = entryEnd;
  }
  if (!names.has("[Content_Types].xml") || !names.has("word/document.xml")) {
    throw new Error("This file is not a valid DOCX document. Paste the text manually.");
  }
  if (offset !== centralDirectoryOffset + centralDirectorySize) {
    throw new Error("This DOCX file is malformed. Paste the text manually.");
  }
}

export async function extractResumeDocument(file: File): Promise<ResumeDocumentExtraction> {
  if (file.size === 0) throw new Error("That file is empty. Choose another file or paste your resume text.");
  if (file.size > MAX_RESUME_FILE_BYTES) {
    throw new Error("Resume files must be 5 MB or smaller. Paste the relevant text instead.");
  }

  const fileType = getDocumentType(file);
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  try {
    if (fileType === "PDF") {
      if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
        throw new Error("This file does not appear to be a valid PDF. Check the file or paste your resume text.");
      }

      const [{ getDocument, GlobalWorkerOptions }, workerUrl] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url").then((module) => module.default),
      ]);
      GlobalWorkerOptions.workerSrc = workerUrl;

      const loadingTask = getDocument({
        data: bytes,
        disableAutoFetch: true,
      });
      const pdf = await loadingTask.promise;

      try {
        if (pdf.numPages > MAX_RESUME_PDF_PAGES) {
          throw new Error(`This PDF has more than ${MAX_RESUME_PDF_PAGES} pages. Paste the relevant resume text instead.`);
        }
        const pages: string[] = [];
        let extractedCharacters = 0;
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          let previousTextY: number | null = null;
          let previousTextEndX: number | null = null;
          let previousTextHasEOL = false;
          const pageText = content.items.map((item) => {
            if (!("str" in item)) return "";
            const textX = item.transform[4];
            const textY = item.transform[5];
            const textSize = Math.hypot(item.transform[0], item.transform[1]);
            const columnGapThreshold = Math.max(12, textSize * 1.5);
            if (item.str.trim() === "" && item.width > columnGapThreshold) {
              previousTextY = textY;
              previousTextEndX = textX + item.width;
              previousTextHasEOL = false;
              return "\n";
            }
            const lastTextY = previousTextY;
            const hasPreviousText = lastTextY !== null;
            const horizontalGap = previousTextEndX === null ? 0 : textX - previousTextEndX;
            const startsNewLine = hasPreviousText && (
              previousTextHasEOL
              || Math.abs(textY - lastTextY) > 2
              || horizontalGap > columnGapThreshold
            );
            previousTextY = textY;
            previousTextEndX = textX + item.width;
            previousTextHasEOL = item.hasEOL;
            return `${!hasPreviousText ? "" : startsNewLine ? "\n" : " "}${item.str}${item.hasEOL ? "\n" : ""}`;
          }).join("");
          extractedCharacters += pageText.length;
          if (extractedCharacters > MAX_RESUME_EXTRACTED_CHARACTERS) {
            throw new Error(`This resume has more than ${MAX_RESUME_EXTRACTED_CHARACTERS.toLocaleString()} readable characters. Paste a shorter version.`);
          }
          pages.push(pageText);
        }
        const text = normalizeExtractedText(pages.join("\n"));
        if (text.length < MIN_USEFUL_RESUME_CHARACTERS) {
          throw new Error("We couldn't find enough selectable text. This may be a scanned PDF; paste the text manually.");
        }
        return { text, fileType };
      } finally {
        await loadingTask.destroy();
      }
    }

    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      throw new Error("This file does not appear to be a valid DOCX document. Check the file or paste your resume text.");
    }
    validateDocxArchive(bytes);
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    if (result.value.length > MAX_RESUME_EXTRACTED_CHARACTERS) {
      throw new Error(`This resume has more than ${MAX_RESUME_EXTRACTED_CHARACTERS.toLocaleString()} readable characters. Paste a shorter version.`);
    }
    const text = normalizeExtractedText(result.value);
    if (text.length < MIN_USEFUL_RESUME_CHARACTERS) {
      throw new Error("We couldn't find enough readable text in this DOCX. Paste the text manually.");
    }
    return { text, fileType };
  } finally {
    if (bytes.byteLength) bytes.fill(0);
  }
}
