import { Storage } from "@google-cloud/storage";
import { Router, type IRouter } from "express";

const router: IRouter = Router();
const sidecar = "http://127.0.0.1:1106";
const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${sidecar}/token`,
    type: "external_account",
    credential_source: {
      url: `${sidecar}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

router.get("/storage/public-objects", async (req, res) => {
  const relativePath = typeof req.query.path === "string" ? req.query.path : "";
  if (
    !relativePath ||
    relativePath.startsWith("/") ||
    relativePath.includes("\\") ||
    relativePath.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    res.status(400).json({ message: "Invalid public asset path." });
    return;
  }

  const searchPaths = (process.env.PUBLIC_OBJECT_SEARCH_PATHS ?? "")
    .split(",")
    .map((path) => path.trim().replace(/^\/+|\/+$/gu, ""))
    .filter(Boolean);
  if (!searchPaths.length) {
    res.status(503).json({ message: "Public asset storage is not configured." });
    return;
  }

  try {
    for (const searchPath of searchPaths) {
      const [bucketName, ...prefix] = searchPath.split("/");
      if (!bucketName) continue;
      const objectName = [...prefix, relativePath].filter(Boolean).join("/");
      const file = storage.bucket(bucketName).file(objectName);
      const [exists] = await file.exists();
      if (!exists) continue;

      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400, immutable",
        ...(metadata.size ? { "Content-Length": String(metadata.size) } : {}),
        "X-Content-Type-Options": "nosniff",
      });
      file.createReadStream()
        .on("error", () => {
          if (!res.headersSent) res.status(502);
          res.end();
        })
        .pipe(res);
      return;
    }
    res.status(404).json({ message: "Public asset not found." });
  } catch {
    res.status(503).json({ message: "Public asset storage is unavailable." });
  }
});

export default router;
