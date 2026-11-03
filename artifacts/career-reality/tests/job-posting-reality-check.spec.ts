import { expect, test } from "./fixtures";
import { Buffer } from "node:buffer";

type SyntheticPdfText = { text: string; x: number; y: number };

function syntheticPdf(text: string | SyntheticPdfText[]): Buffer {
  return syntheticPdfPages([text]);
}

function syntheticPdfPages(pages: Array<string | SyntheticPdfText[]>): Buffer {
  const pageStreams = pages.map((page) => {
    const items = typeof page === "string"
      ? page.split(/\r?\n/).map((line, index) => ({ text: line, x: 24, y: 250 - index * 20 }))
      : page;
    return items
      .map(({ text: line, x, y }) => {
        const escapedLine = line.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
        return `BT /F1 12 Tf ${x} ${y} Td (${escapedLine}) Tj ET`;
      })
      .join("\n");
  });
  const fontObjectId = 3 + pages.length;
  const firstContentObjectId = fontObjectId + 1;
  const pageObjectIds = pages.map((_, index) => index + 3);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    ...pages.map((_, index) =>
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 2000 300] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${firstContentObjectId + index} 0 R >>`
    ),
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ...pageStreams.map((stream) =>
      `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
    ),
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((object, index) => {
    const offset = Buffer.byteLength(pdf);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function syntheticDocx(text: string): Buffer {
  const xmlEscape = (value: string) => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
  const files = [
    {
      name: "[Content_Types].xml",
      data: Buffer.from('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
    },
    {
      name: "word/document.xml",
      data: Buffer.from(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${text.split(/\r?\n/).map((line) => `<w:p><w:r><w:t>${xmlEscape(line)}</w:t></w:r></w:p>`).join("")}</w:body></w:document>`),
    },
  ];
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const crc = crc32(file.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, file.data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, name);
    localOffset += local.length + name.length + file.data.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

test("reviews requirements, allows a manual confirmed gap, and does not submit text", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const textRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/(job-posting|resume-intelligence|resume\/)/i.test(request.url())) {
      textRequests.push(request.url());
    }
  });

  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume").fill("Built Python data pipelines for monthly reporting.");
  await page.getByTestId("input-job-check-description").fill("Must have Python data pipelines for finance reporting.");
  await page.getByTestId("button-analyze-job-posting").click();

  const results = page.getByTestId("job-check-results");
  await expect(results).toBeVisible();
  await expect(page.getByTestId("job-check-score")).toContainText("100");
  await expect(page.getByTestId("job-check-verdict")).toHaveText("Go for it");
  await expect(page.getByTestId("job-check-breakdown")).toContainText("Direct");
  await expect(results).toContainText("Resume evidence match");
  await expect(page.getByTestId("job-requirement-0")).toContainText("Built Python data pipelines");
  await expect(page.getByTestId("job-requirement-0")).toContainText("Evidence source: Candidate-authored");
  await expect(page.getByTestId("select-evidence-status-0")).toHaveValue("direct");
  await expect(page.getByTestId("job-check-highlighted").locator("article:visible")).toHaveCount(1);
  await page.getByTestId("select-evidence-status-0").selectOption("confirmed-gap");
  await expect(page.getByTestId("job-requirement-0")).toContainText("Decide whether to build evidence");
  await expect(page.getByTestId("job-check-score")).toContainText("0");
  await expect(page.getByTestId("job-check-verdict")).toHaveText("Skip unless this requirement is negotiable");
  await expect(page.getByTestId("job-check-mandatory-gap")).toBeVisible();
  expect(textRequests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("changes the visible score when a different role and resume are analyzed", async ({ page }) => {
  await page.goto("/job-posting-reality-check");
  const resume = page.getByTestId("input-job-check-resume");
  const posting = page.getByTestId("input-job-check-description");
  const analyze = page.getByTestId("button-analyze-job-posting");
  const score = page.getByTestId("job-check-score");

  await resume.fill("Built SQL queries for finance dashboards and reporting.");
  await posting.fill("Responsibilities\n- Build SQL queries for finance reporting.");
  await analyze.click();
  await expect(score).toContainText("100");

  await resume.fill("Wrote customer support guides and managed help-center updates.");
  await posting.fill("Responsibilities\n- Build Python data pipelines for finance reporting.");
  await analyze.click();
  await expect(score).toContainText("0");
  await expect(page.getByTestId("job-check-verdict")).not.toHaveText("Not enough clear requirements to score");
});

test("politely announces recalculated match results only after evidence status changes", async ({ page }) => {
  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume").fill("Built Python data pipelines for monthly reporting.");
  await page.getByTestId("input-job-check-description").fill("Must have Python experience.");
  await page.getByTestId("button-analyze-job-posting").click();

  const announcement = page.getByTestId("job-check-match-announcement");
  const requirement = page.getByTestId("job-requirement-0");
  await expect(announcement).toHaveAttribute("role", "status");
  await expect(announcement).toHaveAttribute("aria-live", "polite");
  await expect(announcement).toHaveAttribute("aria-atomic", "true");
  await expect(announcement).toHaveText("");

  await requirement.locator("summary").click();
  await page.getByTestId("select-evidence-source-0").selectOption("role-text");
  await expect(announcement).toHaveText("");

  await page.getByTestId("select-evidence-status-0").selectOption("partial");
  await expect(announcement).toHaveText(
    "Match score updated to 50 percent. Recommendation: Apply with a sharper resume.",
  );
  await page.getByTestId("select-evidence-source-0").selectOption("candidate-authored");
  await expect(announcement).toHaveText(
    "Match score updated to 50 percent. Recommendation: Apply with a sharper resume.",
  );
  await page.getByTestId("select-evidence-status-0").selectOption("unresolved");
  await expect(announcement).toHaveText("Match result updated. Not enough clear requirements to score.");
});

test("puts resume and posting text first, with score purpose and optional details clear", async ({ page }) => {
  await page.goto("/job-posting-reality-check");

  await expect(page.getByRole("heading", { name: "Start with your resume and the job description." })).toBeVisible();
  await expect(page.getByLabel("Your resume text")).toBeVisible();
  await expect(page.getByLabel("Job-posting text")).toBeVisible();
  await expect(page.getByTestId("input-job-check-resume")).toHaveAttribute(
    "placeholder",
    "Paste the experience, projects, skills, and qualifications already written in your resume.",
  );
  await expect(page.getByTestId("input-job-check-description")).toHaveAttribute(
    "placeholder",
    "Paste the posting’s responsibilities, required qualifications, and preferred criteria.",
  );
  await expect(page.getByText("Your pasted or locally extracted resume text stays in this browser tab: it is never sent to a server or AI model, and is not saved. Refreshing or closing clears it.")).toBeVisible();
  await expect(page.getByText("Add optional role details")).toBeVisible();
  await expect(page.getByTestId("input-job-check-jobTitle")).toBeHidden();
  await expect(page.getByTestId("input-job-check-company")).toBeHidden();
  await expect(page.getByTestId("input-job-check-location")).toBeHidden();
  await expect(page.getByTestId("input-job-check-employmentType")).toBeHidden();
  await expect(page.getByTestId("button-analyze-job-posting")).toHaveText("Get my match score");
});

test("clears resume text after refresh and after leaving and returning", async ({ page }) => {
  const resume = page.getByTestId("input-job-check-resume");
  const syntheticResume = "SYNTHETIC-RESUME-CLEAR-CHECK-7f2c";

  await page.goto("/job-posting-reality-check");
  await resume.fill(syntheticResume);
  await page.reload();
  await expect(resume).toHaveValue("");
  await expect(page.getByText(syntheticResume)).toHaveCount(0);

  await resume.fill(syntheticResume);
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Tools" }).click();
  await expect(page).toHaveURL(/\/tools\/?$/);
  await page.getByTestId("link-directory-tools--job-posting-reality-check").click();
  await expect(page).toHaveURL(/\/job-posting-reality-check\/?$/);
  await expect(resume).toHaveValue("");
  await expect(page.getByText(syntheticResume)).toHaveCount(0);
});

test("provides named controls, a visible keyboard path, and announced required-field errors", async ({ page }) => {
  await page.goto("/job-posting-reality-check");

  const resume = page.getByRole("textbox", { name: "Your resume text" });
  const posting = page.getByRole("textbox", { name: "Job-posting text" });
  const chooseFile = page.getByRole("button", { name: "Choose PDF or DOCX" });
  await expect(resume).toBeVisible();
  await expect(posting).toBeVisible();
  await expect(page.getByLabel("Choose a PDF or DOCX resume")).toHaveCount(1);
  await expect(page.getByRole("textbox", { name: "Public job-page URL" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /I agree to send this URL/ })).toBeVisible();
  await page.getByText("Add optional role details").click();
  for (const name of ["Role title", "Company", "Location", "Employment type"]) {
    await expect(page.getByRole("textbox", { name })).toBeVisible();
  }

  await resume.focus();
  await page.keyboard.press("Tab");
  await expect(chooseFile).toBeFocused();
  expect(await page.evaluate(() => document.activeElement?.matches(":focus-visible"))).toBe(true);
  await page.keyboard.press("Tab");
  await expect(posting).toBeFocused();

  await page.getByTestId("button-analyze-job-posting").click();
  await expect(resume).toHaveAttribute("aria-invalid", "true");
  await expect(posting).toHaveAttribute("aria-invalid", "true");
  await expect(resume).toBeFocused();
  await expect(page.getByRole("alert").filter({ hasText: "Paste resume text to continue." })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Paste job-description text to continue." })).toBeVisible();

  const describedBy = await resume.getAttribute("aria-describedby");
  expect(describedBy).toContain("form-item-description");
  expect(describedBy).toContain("form-item-message");
});

test("keeps the first view concise and groups remaining requirements in one disclosure", async ({ page }) => {
  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume").fill(
    "Built Python pipelines. Wrote SQL queries. Deployed AWS services. Operated Kubernetes clusters.",
  );
  await page.getByTestId("input-job-check-description").fill(
    "Must have Python experience.\nMust have SQL experience.\nMust have AWS experience.\nMust have Kubernetes experience.",
  );
  await page.getByTestId("button-analyze-job-posting").click();

  await expect(page.getByTestId("job-check-highlighted").locator("article:visible")).toHaveCount(3);
  const allRequirements = page.getByTestId("job-check-all-requirements");
  await expect(allRequirements).toBeVisible();
  await expect(allRequirements).toContainText("Review all extracted requirements");
  await expect(allRequirements.locator("article:visible")).toHaveCount(0);
  await allRequirements.locator("summary").first().click();
  await expect(allRequirements.locator("article:visible")).toHaveCount(1);
});

test("keeps the 40-requirement cutoff clear and usable on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume").fill("Built Python systems and services.");
  await page.getByTestId("input-job-check-description").fill(
    Array.from({ length: 45 }, (_, index) =>
      `Must have Python experience with system ${index + 1}.`
    ).join("\n"),
  );
  await page.getByTestId("button-analyze-job-posting").click();

  const results = page.getByTestId("job-check-results");
  await expect(results).toBeVisible();
  await expect(results.getByRole("status").filter({
    hasText: "Only the first 40 extracted requirements are shown.",
  })).toBeVisible();
  await expect(results).toContainText("from 40 extracted");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const highlighted = page.getByTestId("job-check-highlighted");
  await expect(highlighted.locator("article:visible")).toHaveCount(3);
  const allRequirements = page.getByTestId("job-check-all-requirements");
  const summary = allRequirements.locator("summary").first();
  await expect(summary).toContainText("Review all extracted requirements");
  await expect(summary).toContainText("37 more");
  await expect(allRequirements.locator("article:visible")).toHaveCount(0);

  await summary.click();
  await expect(allRequirements.locator("article:visible")).toHaveCount(37);
  await expect(page.getByTestId("job-requirement-39")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("keeps extraction uncertainty visible on a phone without expanding every requirement", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume").fill(
    "Built Python pipelines, wrote SQL queries, deployed AWS services, and operated Kubernetes clusters.",
  );
  await page.getByTestId("input-job-check-description").fill([
    `You will own monthly finance reporting ${"across cross-functional teams ".repeat(12)}`,
    "Must be a rockstar with a good attitude.",
    "Must have Python experience.",
    "Must have SQL experience.",
    "Must have AWS experience.",
    "Must have Kubernetes experience.",
  ].join("\n"));
  await page.getByTestId("button-analyze-job-posting").click();

  const results = page.getByTestId("job-check-results");
  await expect(results).toBeVisible();
  const warning = results.getByRole("status").filter({
    hasText: "Some long requirement-like wording could not be separated into clear items",
  });
  await expect(warning).toBeVisible();
  await expect(results.getByRole("heading", { name: "Posting signals to review" })).toBeVisible();
  await expect(results.getByText(/low-confidence item\(s\) were excluded from the score/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await expect(page.getByTestId("job-check-highlighted").locator("article:visible")).toHaveCount(3);
  const allRequirements = page.getByTestId("job-check-all-requirements");
  await expect(allRequirements).toBeVisible();
  const allRequirementsSummary = allRequirements.locator("summary").first();
  await expect(allRequirementsSummary).toContainText("Review all extracted requirements");
  await expect(allRequirementsSummary).toContainText("2 more");
  await expect(allRequirements.locator("article:visible")).toHaveCount(0);
  const lowConfidenceShortcut = page.getByTestId("button-find-low-confidence");
  await expect(lowConfidenceShortcut).toBeVisible();
  await lowConfidenceShortcut.click();
  await expect(allRequirements.locator("article:visible")).toHaveCount(2);
  const lowConfidenceGroup = page.getByTestId("job-check-low-confidence-group");
  await expect(lowConfidenceGroup).toBeVisible();
  await expect(lowConfidenceGroup).toContainText("Low-confidence requirements");
  await expect(lowConfidenceGroup).toContainText("Must be a rockstar with a good attitude");
  await expect(lowConfidenceGroup.locator('[data-testid^="job-requirement-low-confidence-"]')).toHaveCount(1);
  await expect.poll(() => lowConfidenceGroup.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  })).toBe(true);
  await expect(allRequirements).toContainText("Must be a rockstar with a good attitude");
});

test("corrects excerpt source labels without changing evidence status or gap behavior", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume").fill(
    "Candidate confirms no professional experience with Python.\nBuilt Python data pipelines used by the finance team to automate monthly reporting.",
  );
  await page.getByTestId("input-job-check-description").fill("Must have Python data pipeline experience.");
  await page.getByTestId("button-analyze-job-posting").click();

  const requirement = page.getByTestId("job-requirement-0");
  const source = page.getByTestId("select-evidence-source-0");
  const denialSource = page.getByTestId("select-denial-source-0");
  const status = page.getByTestId("select-evidence-status-0");
  await requirement.getByText("Review evidence and source").click();
  await expect(source).toHaveValue("candidate-authored");
  await expect(denialSource).toHaveValue("candidate-authored");
  await expect(requirement).toContainText("Evidence source: Candidate-authored");
  await expect(status).toHaveValue("direct");

  await source.selectOption("role-text");
  await denialSource.selectOption("unknown");
  await expect(requirement).toContainText("Evidence source: Role text");
  await expect(denialSource).toHaveValue("unknown");
  await expect(status).toHaveValue("direct");

  await status.selectOption("confirmed-gap");
  await source.selectOption("unknown");
  await denialSource.selectOption("role-text");
  await expect(requirement).toContainText("Evidence source: Unknown source");
  await expect(denialSource).toHaveValue("role-text");
  await expect(status).toHaveValue("confirmed-gap");
  await expect(requirement).toContainText("Decide whether to build evidence");
});

test("keeps source labels and excerpts usable at a 200% zoom-equivalent width", async ({ page }) => {
  // A 640 CSS-pixel desktop viewport at 200% browser zoom has a 320 CSS-pixel layout width.
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume").fill(
    `Candidate confirms no professional experience with Python.\nBuilt Python data pipelines for monthly reporting with ${"x".repeat(140)}.`,
  );
  await page.getByTestId("input-job-check-description").fill("Must have Python data pipeline experience.");
  await page.getByTestId("button-analyze-job-posting").click();

  const requirement = page.getByTestId("job-requirement-0");
  const excerpts = page.getByTestId("job-evidence-excerpts-0");
  const evidenceSource = page.getByTestId("select-evidence-source-0");
  const denialSource = page.getByTestId("select-denial-source-0");
  const evidenceStatus = page.getByTestId("select-evidence-status-0");
  const sourceDisclosure = requirement.getByText("Review evidence and source");
  await evidenceStatus.focus();
  await page.keyboard.press("Tab");
  await expect(sourceDisclosure).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(evidenceSource).toBeVisible();
  await expect(denialSource).toBeVisible();
  const sourceLabels = excerpts.getByText("Correct source label", { exact: true });
  await expect(sourceLabels).toHaveCount(2);
  await expect(sourceLabels.first()).toBeVisible();
  await expect(sourceLabels.nth(1)).toBeVisible();
  await expect(excerpts.locator("blockquote")).toHaveCount(2);
  await expect(excerpts.locator("blockquote").first()).toBeVisible();
  await expect(excerpts.locator("blockquote").nth(1)).toBeVisible();

  const panelBounds = await excerpts.boundingBox();
  const evidenceBounds = await evidenceSource.boundingBox();
  const denialBounds = await denialSource.boundingBox();
  expect(panelBounds).not.toBeNull();
  expect(evidenceBounds).not.toBeNull();
  expect(denialBounds).not.toBeNull();
  expect(evidenceBounds!.x).toBeGreaterThanOrEqual(panelBounds!.x);
  expect(evidenceBounds!.x + evidenceBounds!.width).toBeLessThanOrEqual(panelBounds!.x + panelBounds!.width + 1);
  expect(denialBounds!.x).toBeGreaterThanOrEqual(panelBounds!.x);
  expect(denialBounds!.x + denialBounds!.width).toBeLessThanOrEqual(panelBounds!.x + panelBounds!.width + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.keyboard.press("Tab");
  await expect(evidenceSource).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(evidenceSource).toHaveValue("role-text");
  await page.keyboard.press("Tab");
  await expect(denialSource).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(denialSource).toHaveValue("role-text");
  await expect(requirement).toContainText("Evidence source: Role text");
});

test("resets corrected sources and evidence status when users analyze new text", async ({ page }) => {
  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume").fill(
    "Built Kubernetes deployment workflows for two production services.\nCandidate confirms no professional experience with Kubernetes.",
  );
  await page.getByTestId("input-job-check-description").fill("Must have Kubernetes experience.");
  await page.getByTestId("button-analyze-job-posting").click();

  const requirement = page.getByTestId("job-requirement-0");
  await requirement.getByText("Review evidence and source").click();
  await expect(page.getByTestId("select-evidence-status-0")).toHaveValue("direct");
  await page.getByTestId("select-evidence-source-0").selectOption("role-text");
  await expect(requirement).toContainText("Evidence source: Role text");
  await page.getByTestId("select-denial-source-0").selectOption("unknown");
  await expect(requirement).toContainText("Evidence source: Unknown source");
  await expect(page.getByTestId("select-evidence-status-0")).toHaveValue("direct");
  await page.getByTestId("select-evidence-status-0").selectOption("confirmed-gap");
  await expect(page.getByTestId("select-evidence-status-0")).toHaveValue("confirmed-gap");

  await page.getByTestId("input-job-check-resume").fill("Built Python data pipelines for monthly reporting.");
  await page.getByTestId("input-job-check-description").fill("Must have Python experience.");
  await page.getByTestId("button-analyze-job-posting").click();
  await expect(page.getByTestId("select-evidence-source-0")).toHaveValue("candidate-authored");
  await expect(page.getByTestId("job-requirement-0")).toContainText("Evidence source: Candidate-authored");
  await expect(page.getByTestId("select-evidence-status-0")).toHaveValue("direct");
});

test("shows pasted role excerpts as not documented without attributing them to the candidate", async ({ page }) => {
  const roleExcerpt = 'The posting states: "No professional experience with Kubernetes is required."';

  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume").fill(roleExcerpt);
  await page.getByTestId("input-job-check-description").fill("Must have Kubernetes experience.");
  await page.getByTestId("button-analyze-job-posting").click();

  const requirement = page.getByTestId("job-requirement-0");
  await expect(page.getByTestId("job-check-results")).toBeVisible();
  await requirement.getByText("Review evidence and source").click();
  await expect(requirement).toContainText("Resume excerpt");
  await expect(requirement).toContainText("Evidence source: Role text");
  await expect(requirement).toContainText(roleExcerpt);
  await expect(requirement).toContainText("does not clearly attribute it to the candidate");
  await expect(requirement).toContainText("not treated as a confirmed gap");
  await expect(requirement).toContainText("does not mean the candidate lacks the skill");
  await expect(page.getByTestId("select-evidence-status-0")).toHaveValue("not-documented");
  await expect(requirement).not.toContainText("candidate-confirmed");
  await expect(requirement).not.toContainText("Decide whether to build evidence or ask whether the skill can be learned on the job.");
});

test("asks users to review garbled pasted resume text before classifying evidence", async ({ page }) => {
  const postedBodies: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && /\/api\//i.test(request.url())) {
      postedBodies.push(request.postData() ?? "");
    }
  });

  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume").fill(
    "Resume text extraction result: 'Pyth0n, SQ L, cl0ud'. Source PDF had unusual fonts and broken columns. Candidate has not reviewed the extracted text yet.",
  );
  await page.getByTestId("input-job-check-description").fill(
    "Required: Python, SQL, and cloud data engineering. Responsibilities: build and monitor data pipelines.",
  );

  await expect(page.getByTestId("resume-quality-review")).toBeVisible();
  await expect(page.getByTestId("button-analyze-job-posting")).toBeDisabled();
  await expect(page.getByTestId("job-check-results")).toHaveCount(0);
  await page.getByTestId("button-confirm-resume-text").click();
  await expect(page.getByTestId("button-analyze-job-posting")).toBeEnabled();
  await page.getByTestId("button-analyze-job-posting").click();

  await expect(page.getByTestId("job-check-results")).toBeVisible();
  await expect(page.getByTestId("job-check-results")).toContainText("You confirmed this resume text");
  expect(postedBodies).toEqual([]);
});

test("correcting garbled pasted text removes the confirmation gate", async ({ page }) => {
  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume").fill("Built Pyth0n data pipelines and wrote SQ L queries for cl0ud reporting.");
  await page.getByTestId("input-job-check-description").fill("Must have Python, SQL, and cloud experience.");
  await expect(page.getByTestId("resume-quality-review")).toBeVisible();

  await page.getByTestId("input-job-check-resume").fill("Built Python data pipelines and wrote SQL queries for cloud reporting.");
  await expect(page.getByTestId("resume-quality-review")).toHaveCount(0);
  await expect(page.getByTestId("button-analyze-job-posting")).toBeEnabled();
  await page.getByTestId("button-analyze-job-posting").click();

  await expect(page.getByTestId("job-check-results")).toBeVisible();
  await expect(page.getByTestId("select-evidence-status-0")).toHaveValue("direct");
});

test("lists the checker in the public tools directory", async ({ page }) => {
  await page.goto("/tools");
  const link = page.getByTestId("link-directory-tools--job-posting-reality-check");
  await expect(link).toHaveAttribute("href", "/job-posting-reality-check");
});

test("reviews fetched job text and keeps structured details separate from requirement parsing", async ({ page }) => {
  let requestBody = "";
  await page.route("**/api/public/job-links/fetch", async (route) => {
    requestBody = route.request().postData() ?? "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        text: "Responsibilities\n- Build Python data pipelines for finance reporting.",
        truncated: false,
      }),
    });
  });

  await page.goto("/job-posting-reality-check");
  await expect(page.getByRole("region", { name: "Fetch public job page" })).toBeVisible();
  await page.getByTestId("input-job-check-resume").fill("Built Python data pipelines for monthly reporting.");
  await page.getByText("Add optional role details").click();
  await page.getByTestId("input-job-check-jobTitle").fill("Data Engineer");
  await page.getByTestId("input-job-check-company").fill("Example Co");
  await page.getByLabel("Public job-page URL").fill("https://jobs.lever.co/example/job-identifier");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Fetch job text" }).click();

  await expect(page.getByTestId("job-extraction-review")).toBeVisible();
  await expect(page.getByTestId("input-job-check-description")).toHaveValue(/Build Python data pipelines/);
  await expect(page.getByTestId("button-analyze-job-posting")).toBeDisabled();
  expect(JSON.parse(requestBody)).toEqual({
    url: "https://jobs.lever.co/example/job-identifier",
    consent: true,
  });

  await page.getByRole("button", { name: "I’ve reviewed this posting" }).click();
  await page.getByTestId("button-analyze-job-posting").click();
  await expect(page.getByTestId("job-check-results")).toBeVisible();
  await expect(page.getByTestId("job-context-summary")).toContainText("Data Engineer");
  await expect(page.getByTestId("job-context-summary")).toContainText("Example Co");
  await expect(page.getByTestId("job-requirement-0")).toContainText("Build Python data pipelines");

  await page.getByTestId("button-clear-job-posting").click();
  await expect(page.getByTestId("input-job-check-resume")).toHaveValue("");
  await expect(page.getByTestId("input-job-check-description")).toHaveValue("");
  await expect(page.getByTestId("input-job-check-jobTitle")).toHaveValue("");
  await expect(page.getByTestId("input-job-check-company")).toHaveValue("");
  await expect(page.getByTestId("job-check-results")).toHaveCount(0);
});

test("announces public job-page fetch failures", async ({ page }) => {
  await page.route("**/api/public/job-links/fetch", (route) =>
    route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ error: "upstream unavailable" }) }),
  );
  await page.goto("/job-posting-reality-check");
  await page.getByRole("textbox", { name: "Public job-page URL" }).fill("https://jobs.lever.co/example/job-identifier");
  await page.getByRole("checkbox", { name: /I agree to send this URL/ }).check();
  await page.getByRole("button", { name: "Fetch job text" }).click();

  await expect(page.getByRole("alert").filter({
    hasText: "We couldn't fetch that page. Check the URL and try a supported public job page.",
  })).toBeVisible();
});

test("keeps copied role text and candidate statements separate after PDF and DOCX extraction", async ({ page }) => {
  const roleExcerpt = 'The posting states: "No professional experience with Kubernetes is required."';
  const candidateStatement = "Candidate confirms they have not used Cypress.";
  const unknownExcerpt = "SQL audit logs";
  const privacyCanary = "PRIVATE-RESUME-CONTENT-CANARY-94b1";
  const resume = `${privacyCanary}\n${roleExcerpt}\n${candidateStatement}\n${unknownExcerpt}`;
  const jobDescription = "Must have Kubernetes experience.\nMust have Cypress experience.\nMust have SQL experience.";
  const requests: Array<{ url: string; body: string }> = [];
  const workerResponses: Array<{ status: number; contentType: string }> = [];
  page.on("request", (request) => {
    requests.push({ url: request.url(), body: request.postData() ?? "" });
  });
  page.on("response", (response) => {
    if (response.url().includes("pdf.worker")) {
      workerResponses.push({
        status: response.status(),
        contentType: response.headers()["content-type"] ?? "",
      });
    }
  });

  for (const file of [
    { name: "synthetic-resume.pdf", mimeType: "application/pdf", buffer: syntheticPdf(resume) },
    {
      name: "synthetic-resume.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: syntheticDocx(resume),
    },
  ]) {
    await page.goto("/job-posting-reality-check");
    await page.getByTestId("input-job-check-resume-file").setInputFiles(file);
    await expect(page.getByTestId("resume-extraction-review")).toBeVisible();
    await expect(page.getByTestId("input-job-check-resume")).toHaveValue(/The posting states:/);
    await expect(page.getByTestId("input-job-check-resume")).toHaveValue(/Candidate confirms they have not used Cypress/);
    const extractedText = await page.getByTestId("input-job-check-resume").inputValue();
    expect(extractedText).toContain("\n");
    await expect(page.getByTestId("button-analyze-job-posting")).toBeDisabled();

    await page.getByRole("button", { name: "I’ve reviewed this text" }).click();
    await page.getByTestId("input-job-check-description").fill(jobDescription);
    await page.getByTestId("button-analyze-job-posting").click();

    const results = page.getByTestId("job-check-results");
    await expect(results).toBeVisible();
    const kubernetesRequirement = page.getByTestId("job-requirement-0");
    const cypressRequirement = page.getByTestId("job-requirement-1");
    const sqlRequirement = page.getByTestId("job-requirement-2");
    await kubernetesRequirement.getByText("Review evidence and source").click();
    await cypressRequirement.getByText("Review evidence and source").click();
    await sqlRequirement.getByText("Review evidence and source").click();
    await expect(kubernetesRequirement).toContainText("No matching evidence was found");
    await expect(kubernetesRequirement).toContainText("Evidence source: Role text");
    await expect(page.getByTestId("select-evidence-source-0")).toHaveValue("role-text");
    await expect(kubernetesRequirement).not.toContainText("candidate-confirmed");
    await expect(page.getByTestId("select-evidence-status-0")).toHaveValue("not-documented");
    await expect(cypressRequirement).toContainText(candidateStatement);
    await expect(cypressRequirement).toContainText("Evidence source: Candidate-authored");
    await expect(page.getByTestId("select-evidence-source-1")).toHaveValue("candidate-authored");
    await expect(page.getByTestId("select-evidence-status-1")).toHaveValue("confirmed-gap");
    await expect(sqlRequirement).toContainText(unknownExcerpt);
    await expect(sqlRequirement).toContainText("Evidence source: Unknown source");
    await expect(page.getByTestId("select-evidence-source-2")).toHaveValue("unknown");
    await expect(page.getByTestId("select-evidence-status-2")).toHaveValue("partial");
  }

  const requestedContent = requests.map(({ url, body }) => `${url}\n${body}`).join("\n");
  expect(requestedContent).not.toContain(privacyCanary);
  expect(requests.some(({ url }) => /\/api\/(?:resume(?:-intelligence)?|job-posting)(?:\/|$|\?)/i.test(url))).toBe(false);
  expect(workerResponses.some(({ status, contentType }) =>
    status === 200 && /javascript/i.test(contentType)
  )).toBe(true);
});

test("keeps role text and candidate evidence separate in a multi-column PDF", async ({ page }) => {
  const roleExcerpt = 'The posting states: "No professional experience with Kubernetes is required."';
  const candidateStatement = "Candidate confirms they have not used Cypress.";
  const pdf = syntheticPdf([
    { text: roleExcerpt, x: 24, y: 250 },
    { text: candidateStatement, x: 500, y: 250 },
  ]);

  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume-file").setInputFiles({
    name: "synthetic-two-column-resume.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await expect(page.getByTestId("resume-extraction-review")).toBeVisible();
  const resumeInput = page.getByTestId("input-job-check-resume");
  expect(await resumeInput.inputValue()).toContain(`${roleExcerpt}\n${candidateStatement}`);

  await page.getByRole("button", { name: "I’ve reviewed this text" }).click();
  await page.getByTestId("input-job-check-description").fill(
    "Must have Kubernetes experience.\nMust have Cypress experience.",
  );
  await page.getByTestId("button-analyze-job-posting").click();

  await expect(page.getByTestId("select-evidence-status-0")).toHaveValue("not-documented");
  await expect(page.getByTestId("job-requirement-0")).toContainText("Evidence source: Role text");
  await expect(page.getByTestId("job-requirement-0")).toContainText("not treated as a confirmed gap");
  await expect(page.getByTestId("select-evidence-status-1")).toHaveValue("confirmed-gap");
  await expect(page.getByTestId("job-requirement-1")).toContainText(candidateStatement);
});

test("keeps role text and candidate evidence separate across PDF pages", async ({ page }) => {
  const roleExcerpt = 'The posting states: "No professional experience with Kubernetes is required."';
  const candidateStatement = "Candidate confirms they have not used Cypress.";
  const pdf = syntheticPdfPages([[{ text: roleExcerpt, x: 24, y: 250 }], [{ text: candidateStatement, x: 24, y: 250 }]]);

  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume-file").setInputFiles({
    name: "synthetic-two-page-resume.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await expect(page.getByTestId("resume-extraction-review")).toBeVisible();
  const resumeInput = page.getByTestId("input-job-check-resume");
  expect(await resumeInput.inputValue()).toContain(`${roleExcerpt}\n${candidateStatement}`);

  await page.getByRole("button", { name: "I’ve reviewed this text" }).click();
  await page.getByTestId("input-job-check-description").fill(
    "Must have Kubernetes experience.\nMust have Cypress experience.",
  );
  await page.getByTestId("button-analyze-job-posting").click();

  const roleRequirement = page.getByTestId("job-requirement-0");
  await expect(roleRequirement).toContainText("Evidence source: Role text");
  await expect(roleRequirement).toContainText("not treated as a confirmed gap");
  await expect(roleRequirement).not.toContainText("candidate-confirmed");
  await expect(page.getByTestId("select-evidence-status-0")).toHaveValue("not-documented");

  const candidateRequirement = page.getByTestId("job-requirement-1");
  await expect(candidateRequirement).toContainText(candidateStatement);
  await expect(candidateRequirement).toContainText("Evidence source: Candidate-authored");
  await expect(page.getByTestId("select-evidence-status-1")).toHaveValue("confirmed-gap");
});

test("rejects a renamed non-PDF file without sending its contents", async ({ page }) => {
  const postedBodies: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && /\/api\//i.test(request.url())) {
      postedBodies.push(request.postData() ?? "");
    }
  });
  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume-file").setInputFiles({
    name: "synthetic-resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not a PDF"),
  });
  await expect(page.getByTestId("resume-file-error")).toContainText("does not appear to be a valid PDF");
  await expect(page.getByRole("alert").filter({ hasText: "does not appear to be a valid PDF" })).toBeVisible();
  expect(postedBodies).toEqual([]);
});

test("extracts a DOCX locally and presents editable text for review", async ({ page }) => {
  const resume = "Built Python data pipelines for monthly reporting and delivered reliable finance reports to business teams.";
  const postedBodies: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && /\/api\//i.test(request.url())) {
      postedBodies.push(request.postData() ?? "");
    }
  });
  await page.goto("/job-posting-reality-check");
  await page.getByTestId("input-job-check-resume-file").setInputFiles({
    name: "synthetic-resume.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: syntheticDocx(resume),
  });
  await expect(page.getByTestId("resume-extraction-review")).toBeVisible();
  await expect(page.getByTestId("input-job-check-resume")).toHaveValue(/Built Python data pipelines/);
  await page.getByRole("button", { name: "I’ve reviewed this text" }).click();
  expect(postedBodies).toEqual([]);
});
