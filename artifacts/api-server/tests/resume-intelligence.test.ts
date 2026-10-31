import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import pino from "pino";
import pinoHttp from "pino-http";
import { Writable } from "node:stream";
import test from "node:test";
import express from "express";
import {
  createResumeIntelligenceRouter,
} from "../src/routes/resume-intelligence";
import {
  createLoggerOptions,
  operationalLogRedactions,
  safeOperationalErrorType,
  serializeRequestLog,
  serializeResponseLog,
} from "../src/lib/logger";

const require = createRequire(import.meta.url);
const pdfParserPackageRoot = path.dirname(path.dirname(require.resolve("pdf-parse/lib/pdf-parse.js")));
const localResumeUri = "file:///private/var/mobile/Containers/Data/resume.pdf";
const docxFixtureBase64 =
  "UEsDBBQAAAAIAOsiKF15bjPX6AAAAK0BAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbH1QyU7DMBD9FWuuKHHggBCK0wPLETiUDxjZk8SqN3nc0v49Tlt6QIXjzFv1+tXeO7GjzDYGBbdtB4KCjsaGScHn+rV5AMEFg0EXAyk4EMNq6NeHRCyqNrCCuZT0KCXrmTxyGxOFiowxeyz1zJNMqDc4kbzrunupYygUSlMWDxj6Zxpx64p42df3qUcmxyCeTsQlSwGm5KzGUnG5C+ZXSnNOaKvyyOHZJr6pBJBXExbk74Cz7r0Ok60h8YG5vKGvLPkVs5Em6q2vyvZ/mys94zhaTRf94pZy1MRcF/euvSAebfjpL49zD99QSwMEFAAAAAgA6yIoXTaTfSoGAQAAdAEAABEAAAB3b3JkL2RvY3VtZW50LnhtbEWQT0/DMAzFv4qVO83ggKZp3Q78OU0INBBnr/HaaE0cOR5dvz1JOXD5RVbs5/e83d/CCD8k2XNszX2zMkCxY+dj35qvz9e7tYGsGB2OHKk1M2Wz322njePuGigqFIGYN1NrBtW0sTZ3AwXMDSeK5e/MElBLKb2dWFwS7ijnoh9G+7BaPdqAPpoqeWI31zdVSIXujhQ9CzyjIrzE3kcigcnrAO+zDhzh+HGAYg+eRr46oFsi8SUBNfDNciEHqPDGokNJIXDAU4ZiCdYwE0pu4FBa0ohafULwvaCWU+RFs4xcaODRlZ0BI/a0JMZOONcOHGf1XQYlDLnZ2mq4UhamhX+h7P/Bdr9QSwECFAMUAAAACADrIihdeW4z1+gAAACtAQAAEwAAAAAAAAAAAAAAgAEAAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLAQIUAxQAAAAIAOsiKF02k30qBgEAAHQBAAARAAAAAAAAAAAAAACAARkBAAB3b3JkL2RvY3VtZW50LnhtbFBLBQYAAAAAAgACAIAAAABOAgAAAAA=";
const emptyDocxFixtureBase64 =
  "UEsDBBQAAAAIABwjKF15bjPX6AAAAK0BAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbH1QyU7DMBD9FWuuKHHggBCK0wPLETiUDxjZk8SqN3nc0v49Tlt6QIXjzFv1+tXeO7GjzDYGBbdtB4KCjsaGScHn+rV5AMEFg0EXAyk4EMNq6NeHRCyqNrCCuZT0KCXrmTxyGxOFiowxeyz1zJNMqDc4kbzrunupYygUSlMWDxj6Zxpx64p42df3qUcmxyCeTsQlSwGm5KzGUnG5C+ZXSnNOaKvyyOHZJr6pBJBXExbk74Cz7r0Ok60h8YG5vKGvLPkVs5Em6q2vyvZ/mys94zhaTRf94pZy1MRcF/euvSAebfjpL49zD99QSwMEFAAAAAgAHCMoXZkJXFmLAAAArgAAABEAAAB3b3JkL2RvY3VtZW50LnhtbEWNQQ6CMBBFr0JmL4MujCEUdp5AD1DbEUjoTNOpIre3LIyrn5efvNcNn7BUb0o6Cxs41g1UxE78zKOB++16uECl2bK3izAZ2Ehh6Lu19eJegThXRcDargamnGOLqG6iYLWWSFy+p6Rgc8E04irJxySOVIs/LHhqmjMGOzPsyof4bd+IfYc/xH+q/wJQSwECFAMUAAAACAAcIyhdeW4z1+gAAACtAQAAEwAAAAAAAAAAAAAAgAEAAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLAQIUAxQAAAAIABwjKF2ZCVxZiwAAAK4AAAARAAAAAAAAAAAAAACAARkBAAB3b3JkL2RvY3VtZW50LnhtbFBLBQYAAAAAAgACAIAAAADTAQAAAAA=";

type Fixture = {
  bytes: Buffer;
  fileName: string;
  contentType: string;
};

function fixture(
  fileName: string,
  contentType: string,
  bytes: Buffer,
): Fixture {
  return { fileName, contentType, bytes };
}

const validPdf = fixture(
  "resume.pdf",
  "application/pdf",
  readFileSync(path.join(pdfParserPackageRoot, "test/data/01-valid.pdf")),
);
const emptyDocx = fixture(
  "empty.docx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  Buffer.from(emptyDocxFixtureBase64, "base64"),
);
const validDocx = fixture(
  "resume.docx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  Buffer.from(docxFixtureBase64, "base64"),
);

function createTestApp(
  calls: Array<Record<string, string>> = [],
  authenticatedUserId: string | null = "resume-test-user",
) {
  const app = express();
  app.use(
    createResumeIntelligenceRouter({
      enableResumeProcessing: true,
      getAuthenticatedUserId: () => authenticatedUserId,
      loadMarketData: async (filters) => {
        calls.push(filters);
        return { companyRows: [], salaryRows: [], layoffRows: [] };
      },
    }),
  );
  return app;
}

test("resume processing is unavailable unless explicitly enabled", async () => {
  await withServer(express().use(createResumeIntelligenceRouter()), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/resume/intelligence`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file: "must not be processed" }),
    });

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: "Resume processing is not available.",
    });
  });
});

test("resume processing stays unavailable in production even when explicitly enabled", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    await withServer(
      express().use(createResumeIntelligenceRouter({ enableResumeProcessing: true })),
      async (baseUrl) => {
        const response = await fetch(`${baseUrl}/resume/intelligence`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ file: "must not be processed" }),
        });

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), {
          error: "Resume processing is not available.",
        });
      },
    );
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test("production-like request and error logs omit uploaded resume content", async () => {
  const markers = [
    "UPLOAD_BYTES_SENTINEL",
    "EXTRACTED_TEXT_SENTINEL",
    "PRIVATE_FILENAME_SENTINEL.pdf",
    "EXCERPT_SENTINEL",
    "ROLE_FIELD_SENTINEL",
  ];
  const logChunks: Buffer[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      logChunks.push(Buffer.from(chunk));
      callback();
    },
  });
  const auditLogger = pino(createLoggerOptions(true), destination);
  const app = express();
  app.use(
    pinoHttp({
      logger: auditLogger,
      serializers: { req: serializeRequestLog, res: serializeResponseLog },
    }),
  );
  app.use(
    createResumeIntelligenceRouter({
      enableResumeProcessing: true,
      getAuthenticatedUserId: () => "operational-log-test-user",
      getRateLimitKey: () => "operational-log-test",
      loadMarketData: async () => ({ companyRows: [], salaryRows: [], layoffRows: [] }),
      extractResumeText: async () => {
        throw new Error(markers.join(" "));
      },
    }),
  );

  await withServer(app, async (baseUrl) => {
    const form = new FormData();
    form.append(
      "file",
      new Blob([markers[0]!], { type: "application/pdf" }),
      markers[2]!,
    );
    form.append("role", markers[4]!);
    const response = await fetch(
      `${baseUrl}/resume/intelligence?excerpt=${encodeURIComponent(markers[3]!)}`,
      {
        method: "POST",
        headers: { "x-resume-intelligence-consent": "accepted-v1" },
        body: form,
      },
    );
    const responseText = await response.text();
    assert.equal(response.status, 422);
    assert.doesNotMatch(responseText, /SENTINEL/u);

    const logs = Buffer.concat(logChunks).toString("utf8");
    for (const marker of markers) assert.equal(logs.includes(marker), false, marker);
    assert.match(logs, /"method":"POST"/u);
    assert.match(logs, /"url":"\/resume\/intelligence"/u);
    assert.equal(operationalLogRedactions.includes("req.body"), true);
    assert.equal(operationalLogRedactions.includes("req.query"), true);
    assert.equal(safeOperationalErrorType(new Error(markers.join(" "))), "Error");
  });
});

async function withServer<T>(
  app: express.Express,
  callback: (baseUrl: string) => Promise<T>,
): Promise<T> {
  const server: Server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

async function upload(
  baseUrl: string,
  resume: Fixture,
  fields: Record<string, string> = {},
  options: { consent?: boolean } = {},
) {
  const form = new FormData();
  form.append(
    "file",
    new Blob([resume.bytes], { type: resume.contentType }),
    resume.fileName,
  );
  for (const [name, value] of Object.entries(fields)) form.append(name, value);
  const response = await fetch(`${baseUrl}/resume/intelligence`, {
    method: "POST",
    headers: options.consent === false
      ? undefined
      : { "x-resume-intelligence-consent": "accepted-v1" },
    body: form,
  });
  const text = await response.text();
  return {
    response,
    text,
    body: text ? (JSON.parse(text) as Record<string, unknown>) : {},
  };
}

test("rejects unauthenticated resume uploads before processing", async () => {
  const calls: Array<Record<string, string>> = [];
  await withServer(express().use(createTestApp(calls, null)), async (baseUrl) => {
    const result = await upload(baseUrl, validPdf);

    assert.equal(result.response.status, 401);
    assert.deepEqual(result.body, {
      error: "Sign in before processing a resume.",
    });
    assert.deepEqual(calls, []);
  });
});

test("requires explicit resume-processing consent before processing", async () => {
  const calls: Array<Record<string, string>> = [];
  await withServer(express().use(createTestApp(calls)), async (baseUrl) => {
    const result = await upload(baseUrl, validPdf, {}, { consent: false });

    assert.equal(result.response.status, 428);
    assert.deepEqual(result.body, {
      error: "Confirm the resume processing notice before uploading.",
    });
    assert.deepEqual(calls, []);
  });
});

test("extracts a valid PDF without persisting bytes or a local URI", async () => {
  const calls: Array<Record<string, string>> = [];
  await withServer(createTestApp(calls), async (baseUrl) => {
    const result = await upload(baseUrl, validPdf, {
      role: "Senior Data Engineer",
      city: "Bengaluru",
      target: "Staff Data Engineer",
      currentCompany: "Northstar",
    });

    assert.equal(result.response.status, 200, result.text);
    assert.equal(result.body.fileType, "PDF");
    assert.ok(Array.isArray(result.body.skills));
    assert.deepEqual(calls, [
      {
        role: "Senior Data Engineer",
        city: "Bengaluru",
        currentCompany: "Northstar",
      },
    ]);
    assert.equal(result.text.includes(localResumeUri), false);
    assert.equal(result.text.includes(validPdf.bytes.toString("latin1")), false);
  });
});

test("extracts a valid DOCX with the same structured-only contract", async () => {
  await withServer(createTestApp(), async (baseUrl) => {
    const result = await upload(baseUrl, validDocx);

    assert.equal(result.response.status, 200);
    assert.equal(result.body.fileType, "DOCX");
    assert.deepEqual(
      (result.body.skills as Array<{ name: string }>).map((skill) => skill.name),
      ["Python", "SQL", "Cloud", "Stakeholder management"],
    );
    assert.equal(result.text.includes(localResumeUri), false);
    assert.equal(result.text.includes(validDocx.bytes.toString("base64")), false);
  });
});

test("rejects malformed PDFs and empty-text documents explicitly", async () => {
  await withServer(createTestApp(), async (baseUrl) => {
    const malformed = await upload(
      baseUrl,
      fixture("broken.pdf", "application/pdf", Buffer.from("%PDF-1.7\nnot a PDF")),
    );
    assert.equal(malformed.response.status, 422);
    assert.match(String(malformed.body.error), /could not read/i);

    const empty = await upload(baseUrl, emptyDocx);
    assert.equal(empty.response.status, 422);
    assert.match(String(empty.body.error), /enough readable text/i);
  });
});

test("rejects unsupported types and files larger than 5 MB", async () => {
  await withServer(createTestApp(), async (baseUrl) => {
    const unsupported = await upload(
      baseUrl,
      fixture("resume.txt", "text/plain", Buffer.from("plain text resume")),
    );
    assert.equal(unsupported.response.status, 415);
    assert.match(String(unsupported.body.error), /only PDF and DOCX/i);

    const oversized = await upload(
      baseUrl,
      fixture(
        "oversized.pdf",
        "application/pdf",
        Buffer.alloc(5 * 1024 * 1024 + 1, 0x41),
      ),
    );
    assert.equal(oversized.response.status, 413);
    assert.match(String(oversized.body.error), /5 MB or smaller/i);
  });
});

test("limits each request key to five processing attempts per hour", async () => {
  await withServer(createTestApp(), async (baseUrl) => {
    const statuses: number[] = [];
    for (let index = 0; index < 6; index += 1) {
      statuses.push(
        (
          await upload(
            baseUrl,
            fixture("resume.txt", "text/plain", Buffer.from("not a resume")),
          )
        ).response.status,
      );
    }

    assert.deepEqual(statuses, [415, 415, 415, 415, 415, 429]);
    const limited = await upload(
      baseUrl,
      fixture("resume.txt", "text/plain", Buffer.from("not a resume")),
    );
    assert.equal(limited.response.status, 429);
    assert.equal(limited.response.headers.get("retry-after"), "3600");
  });
});
