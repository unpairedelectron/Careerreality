import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "dist", "public");
const registry = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/route-registry.json"), "utf8"),
);
const basePrefix = normalizeBasePath(process.env.BASE_PATH ?? "/");
const port = Number(process.env.PORT ?? 8080);

function normalizeBasePath(value) {
  const parts = value.split("/").filter(Boolean);
  return parts.length ? `/${parts.join("/")}` : "";
}

function normalizeRoute(value) {
  return value.replace(/\/+$/, "") || "/";
}

function routeMatches(pattern, route) {
  const normalizedPattern = normalizeRoute(pattern);
  if (!normalizedPattern.includes("*")) return normalizedPattern === route;
  const prefix = normalizedPattern.slice(0, normalizedPattern.indexOf("*")).replace(/\/+$/, "");
  return route === prefix || route.startsWith(`${prefix}/`);
}

const routes = registry.routes;
const redirects = new Map(
  registry.redirects.map((entry) => [normalizeRoute(entry.from), entry]),
);
const unpublishedRoutes = new Set([
  ...registry.drafts.companyPages.map((entry) => normalizeRoute(entry.path)),
  ...registry.drafts.retiredTools
    .filter((entry) => entry.status !== "redirect")
    .map((entry) => normalizeRoute(entry.path)),
]);
const companyDetailRoutes = new Set(
  registry.drafts.companyPages.map((entry) => normalizeRoute(entry.path)),
);
const articleHoldRoutes = new Set(
  registry.drafts.articles.map((entry) => normalizeRoute(`/article/${entry.slug}`)),
);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"],
]);
const compressibleExtensions = new Set([".css", ".html", ".js", ".json", ".map", ".svg", ".txt", ".xml"]);

function sendNotFound(request, response) {
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, follow"><title>Page not found | CareerReality</title></head><body><main><h1>Page not found</h1><p>This address is not published.</p><a href="${basePrefix || ""}/">Go to CareerReality</a></main></body></html>`;
  response.writeHead(404, {
    "Cache-Control": "no-store",
    "Content-Type": "text/html; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, follow",
  });
  response.end(request.method === "HEAD" ? undefined : body);
}

function sendRedirect(response, status, destination) {
  response.writeHead(status, {
    "Cache-Control": "public, max-age=3600",
    Location: destination,
  });
  response.end();
}

function safePublicPath(route) {
  const diskPath = path.resolve(publicRoot, `.${route}`);
  if (diskPath !== publicRoot && !diskPath.startsWith(`${publicRoot}${path.sep}`)) {
    return null;
  }
  return diskPath;
}

async function serveFile(request, response, filePath) {
  let file;
  try {
    file = await fs.promises.stat(filePath);
  } catch {
    sendNotFound(request, response);
    return;
  }
  if (!file.isFile()) {
    sendNotFound(request, response);
    return;
  }

  const isAsset = filePath.includes(`${path.sep}assets${path.sep}`);
  const extension = path.extname(filePath).toLowerCase();
  const contentType = contentTypes.get(extension) ?? "application/octet-stream";
  const canCompress = compressibleExtensions.has(extension);
  const useGzip = canCompress && /\bgzip\b/i.test(request.headers["accept-encoding"] ?? "");
  response.writeHead(200, {
    "Cache-Control": isAsset ? "public, max-age=31536000, immutable" : "no-cache",
    ...(useGzip ? { "Content-Encoding": "gzip" } : { "Content-Length": file.size }),
    ...(canCompress ? { Vary: "Accept-Encoding" } : {}),
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  const stream = fs.createReadStream(filePath).on("error", () => {
    if (!response.headersSent) response.writeHead(500);
    response.end();
  });
  if (useGzip) stream.pipe(createGzip()).pipe(response);
  else stream.pipe(response);
}

async function handleRequest(request, response) {
  const incomingHost = (request.headers.host ?? "").toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  if (incomingHost === "www.careerreality.in") {
    let destination;
    try {
      const requestUrl = new URL(request.url ?? "/", "https://careerreality.in");
      destination = `https://careerreality.in${requestUrl.pathname}${requestUrl.search}`;
    } catch {
      sendNotFound(request, response);
      return;
    }
    sendRedirect(response, 301, destination);
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD", "Cache-Control": "no-store" });
    response.end();
    return;
  }

  let url;
  let decodedPath;
  try {
    url = new URL(request.url ?? "/", "http://careerreality.invalid");
    decodedPath = decodeURIComponent(url.pathname);
  } catch {
    sendNotFound(request, response);
    return;
  }

  if (basePrefix) {
    if (decodedPath !== basePrefix && !decodedPath.startsWith(`${basePrefix}/`)) {
      sendNotFound(request, response);
      return;
    }
    decodedPath = decodedPath.slice(basePrefix.length) || "/";
  }

  const route = normalizeRoute(decodedPath);
  const redirect = redirects.get(route);
  if (redirect) {
    sendRedirect(response, redirect.status, `${basePrefix}${redirect.to}${url.search}`);
    return;
  }
  if (companyDetailRoutes.has(route)) {
    sendRedirect(response, 301, `${basePrefix}/companies/${url.search}`);
    return;
  }

  if (decodedPath.includes(".") || decodedPath.startsWith("/assets/")) {
    const filePath = safePublicPath(decodedPath);
    if (!filePath) {
      sendNotFound(request, response);
      return;
    }
    await serveFile(request, response, filePath);
    return;
  }

  const routePolicy = routes.find((entry) => routeMatches(entry.path, route));
  if (!routePolicy || unpublishedRoutes.has(route) || (route.startsWith("/article/") && !articleHoldRoutes.has(route))) {
    sendNotFound(request, response);
    return;
  }

  if (route !== "/" && !decodedPath.endsWith("/")) {
    sendRedirect(response, 301, `${basePrefix}${route}/${url.search}`);
    return;
  }

  const snapshotPath = `${route === "/" ? "" : route.slice(1)}/index.html`;
  const filePath = safePublicPath(`/${snapshotPath}`);
  if (!filePath) {
    sendNotFound(request, response);
    return;
  }
  await serveFile(request, response, filePath);
}

const server = createServer((request, response) => {
  void handleRequest(request, response).catch(() => {
    if (!response.headersSent) response.writeHead(500, { "Cache-Control": "no-store" });
    response.end();
  });
});

server.listen(port, "0.0.0.0", () => {
  console.info(`CareerReality web server listening on port ${port}`);
});
