import { readFile, writeFile } from "node:fs/promises";

const generatedPath = new URL("../api-zod/src/generated/api.ts", import.meta.url);
let source = await readFile(generatedPath, "utf8");

// Orval emits `instanceof(File)` for multipart binary fields. The generated
// schema is also imported by the Node API server, where the browser File
// constructor is not guaranteed to exist. Validation happens at the upload
// boundary in the server route instead.
source = source.replace(
  '"file": zod.instanceof(File)',
  '"file": zod.custom<unknown>()',
);
source = source.replace(
  "export const ProcessResumeIntelligenceBody =",
  "export const ProcessResumeIntelligenceBodySchema =",
);
source = source.replace(
  "export const AnalyzeCompensationDocumentBody =",
  "export const AnalyzeCompensationDocumentBodySchema =",
);

await writeFile(generatedPath, `${source.trimEnd()}\n`);

const clientSchemasPath = new URL(
  "../api-client-react/src/generated/api.schemas.ts",
  import.meta.url,
);
const clientSchemas = await readFile(clientSchemasPath, "utf8");
await writeFile(clientSchemasPath, `${clientSchemas.trimEnd()}\n`);