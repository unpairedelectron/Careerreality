import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import https from "node:https";
import type { IncomingHttpHeaders } from "node:http";

export const reviewedJobHosts = [
  "boards.greenhouse.io",
  "job-boards.greenhouse.io",
  "jobs.lever.co",
  "jobs.ashbyhq.com",
] as const;
export const maxJobPageBytes = 1_000_000;
export const maxJobTextLength = 20_000;
const maxRedirects = 3;
const totalTimeoutMs = 8_000;
const perRequestTimeoutMs = 5_000;

export class JobLinkFetchError extends Error {
  constructor(public readonly status: 400 | 403 | 413 | 415 | 422 | 502 | 504, message: string) {
    super(message);
    this.name = "JobLinkFetchError";
  }
}

function v4Number(address: string): number | null {
  const pieces = address.split(".");
  if (pieces.length !== 4 || pieces.some((piece) => !/^(0|[1-9]\d{0,2})$/.test(piece))) return null;
  const octets = pieces.map(Number);
  if (octets.some((part) => part > 255)) return null;
  return (((octets[0]! * 256 + octets[1]!) * 256 + octets[2]!) * 256 + octets[3]!) >>> 0;
}

function ipv6Number(address: string): bigint | null {
  if (address.includes("%")) return null;
  let value = address.toLowerCase();
  const ipv4 = value.match(/(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (ipv4) {
    const number = v4Number(ipv4[1]!);
    if (number === null) return null;
    value = value.replace(ipv4[1]!, `${(number >>> 16).toString(16)}:${(number & 0xffff).toString(16)}`);
  }
  const halves = value.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0]!.split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1]!.split(":") : [];
  if ([...left, ...right].some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const groups = [...left, ...Array(Math.max(0, missing)).fill("0"), ...right];
  if (groups.length !== 8) return null;
  return groups.reduce((result, group) => (result << 16n) | BigInt(`0x${group}`), 0n);
}

function inV6Range(address: bigint, network: bigint, prefix: number): boolean {
  const shift = BigInt(128 - prefix);
  return (address >> shift) === (network >> shift);
}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const n = v4Number(address);
    if (n === null) return false;
    const blocked: Array<[number, number]> = [
      [0x00000000, 8], [0x0a000000, 8], [0x64400000, 10], [0x7f000000, 8],
      [0xa9fe0000, 16], [0xac100000, 12], [0xc0000000, 24], [0xc0000200, 24],
      [0xc01fc400, 24], [0xc034c100, 24], [0xc0586300, 24], [0xc0af3000, 24],
      [0xc0a80000, 16], [0xc6120000, 15], [0xc6336400, 24], [0xcb007100, 24],
      [0xe0000000, 4], [0xf0000000, 4],
    ];
    return !blocked.some(([network, prefix]) => {
      const shift = 32 - prefix;
      return (n >>> shift) === (network >>> shift);
    });
  }
  if (family !== 6) return false;
  const n = ipv6Number(address);
  if (n === null || (n >> 125n) !== 1n) return false; // only 2000::/3 global unicast
  const blocked: Array<[bigint, number]> = [
    [0x20010000000000000000000000000000n, 23], // special-purpose 2001::/23
    [0x20010db8000000000000000000000000n, 32], // documentation
    [0x20010010000000000000000000000000n, 28], // ORCHID
    [0x20010020000000000000000000000000n, 28], // ORCHIDv2
    [0x20020000000000000000000000000000n, 16], // 6to4
    [0x3fff0000000000000000000000000000n, 20], // documentation
  ];
  return !blocked.some(([network, prefix]) => inV6Range(n, network, prefix));
}

function validateJobUrl(raw: string): URL {
  if (raw.length > 2048 || raw !== raw.trim() || /[\u0000-\u0020\\]/u.test(raw)) {
    throw new JobLinkFetchError(400, "Enter a valid public job-page URL.");
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new JobLinkFetchError(400, "Enter a valid public job-page URL.");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.hash || (url.port && url.port !== "443")) {
    throw new JobLinkFetchError(400, "Only credential-free HTTPS job-page URLs on port 443 are supported.");
  }
  const host = url.hostname.toLowerCase();
  if (!reviewedJobHosts.includes(host as (typeof reviewedJobHosts)[number])) {
    throw new JobLinkFetchError(403, "This job-page provider is not supported.");
  }
  const allowedPath =
    (/^(boards|job-boards)\.greenhouse\.io$/u.test(host) && /^\/[a-z0-9-]+\/jobs\/\d+\/?$/iu.test(url.pathname)) ||
    (host === "jobs.lever.co" && /^\/[a-z0-9-]+\/[a-z0-9-]{8,}\/?$/iu.test(url.pathname)) ||
    (host === "jobs.ashbyhq.com" && /^\/[a-z0-9-]+\/[a-z0-9-]{8,}\/?$/iu.test(url.pathname));
  if (!allowedPath || url.search.length > 512) {
    throw new JobLinkFetchError(400, "Enter a supported public job-page URL.");
  }
  return url;
}

type ResponseData = { status: number; headers: IncomingHttpHeaders; body: Buffer };
type Address = { address: string; family: number };
type Dependencies = {
  resolve?: (host: string) => Promise<Address[]>;
  request?: (url: URL, address: Address, timeoutMs: number) => Promise<ResponseData>;
};

function resolvePublic(host: string): Promise<Address[]> {
  return lookup(host, { all: true, verbatim: true });
}

function resolveWithTimeout(resolveHost: (host: string) => Promise<Address[]>, host: string, timeoutMs: number): Promise<Address[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new JobLinkFetchError(504, "The job page request timed out.")), timeoutMs);
    resolveHost(host).then(
      (addresses) => { clearTimeout(timer); resolve(addresses); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

function requestPinned(url: URL, address: Address, timeoutMs: number): Promise<ResponseData> {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | undefined;
    const agent = new https.Agent({
      keepAlive: false,
      lookup(hostname, options, callback) {
        if (hostname !== url.hostname) {
          callback(new Error("Unexpected host lookup"), "", 0);
          return;
        }
        if (options.all) callback(null, [{ address: address.address, family: address.family }]);
        else callback(null, address.address, address.family);
      },
    });
    const req = https.request({
      protocol: "https:",
      hostname: url.hostname,
      port: 443,
      path: `${url.pathname}${url.search}`,
      method: "GET",
      agent,
      servername: url.hostname,
      headers: {
        Accept: "text/html, text/plain;q=0.9",
        "Accept-Encoding": "identity",
        "User-Agent": "CareerRealityJobPageFetcher/1.0",
      },
    }, (res) => {
      const status = res.statusCode ?? 502;
      if (status >= 300 && status < 400) {
        res.resume();
        res.once("end", () => { if (timer) clearTimeout(timer); agent.destroy(); resolve({ status, headers: res.headers, body: Buffer.alloc(0) }); });
        return;
      }
      const size = Number(res.headers["content-length"] ?? 0);
      if (Number.isFinite(size) && size > maxJobPageBytes) {
        if (timer) clearTimeout(timer);
        res.destroy();
        agent.destroy();
        reject(new JobLinkFetchError(413, "The job page exceeds the size limit."));
        return;
      }
      const chunks: Buffer[] = [];
      let total = 0;
      res.on("data", (chunk: Buffer) => {
        total += chunk.length;
        if (total > maxJobPageBytes) {
          res.destroy(new JobLinkFetchError(413, "The job page exceeds the size limit."));
          return;
        }
        chunks.push(Buffer.from(chunk));
      });
      res.once("end", () => { if (timer) clearTimeout(timer); agent.destroy(); resolve({ status, headers: res.headers, body: Buffer.concat(chunks) }); });
      res.once("error", (error) => { if (timer) clearTimeout(timer); agent.destroy(); reject(error); });
    });
    timer = setTimeout(() => req.destroy(new JobLinkFetchError(504, "The job page request timed out.")), timeoutMs);
    req.once("error", (error) => { if (timer) clearTimeout(timer); agent.destroy(); reject(error); });
    req.end();
  });
}

function decodeEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-f]+);/giu, (entity) => {
    const key = entity.toLowerCase();
    const named: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&apos;": "'", "&nbsp;": " " };
    if (named[key]) return named[key]!;
    const hex = key.startsWith("&#x");
    const code = Number.parseInt(key.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });
}

function pageText(body: Buffer, contentType: string): { text: string; truncated: boolean } {
  let text = body.toString("utf8");
  if (contentType === "text/html") {
    text = text
      .replace(/<!--[\s\S]*?-->/gu, " ")
      .replace(/<(script|style|noscript|svg|template|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1\s*>/giu, " ")
      .replace(/<\/?(?:p|div|br|li|h[1-6]|section|article|tr|td|th|header|footer|main|ul|ol)\b[^>]*>/giu, "\n")
      .replace(/<[^>]*>/gu, " ");
    text = decodeEntities(text);
  }
  text = text.replace(/[\t\r ]+/gu, " ").replace(/\n\s+/gu, "\n").trim();
  const truncated = text.length > maxJobTextLength;
  return { text: text.slice(0, maxJobTextLength), truncated };
}

export async function fetchPublicJobPage(rawUrl: string, dependencies: Dependencies = {}): Promise<{ text: string; truncated: boolean }> {
  const deadline = Date.now() + totalTimeoutMs;
  const resolveHost = dependencies.resolve ?? resolvePublic;
  const request = dependencies.request ?? requestPinned;
  let current = validateJobUrl(rawUrl);
  for (let redirects = 0; ; redirects += 1) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new JobLinkFetchError(504, "The job page request timed out.");
    let addresses: Address[];
    try {
      addresses = await resolveWithTimeout(resolveHost, current.hostname, Math.min(2000, remaining));
    } catch (error) {
      if (error instanceof JobLinkFetchError) throw error;
      throw new JobLinkFetchError(502, "The job page could not be reached safely.");
    }
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      throw new JobLinkFetchError(403, "The job page resolved to a non-public network address.");
    }
    let response: ResponseData;
    try {
      response = await request(current, addresses[0]!, Math.min(perRequestTimeoutMs, remaining));
    } catch (error) {
      if (error instanceof JobLinkFetchError) throw error;
      throw new JobLinkFetchError(502, "The job page could not be fetched.");
    }
    if (response.status >= 300 && response.status < 400) {
      if (redirects >= maxRedirects) throw new JobLinkFetchError(502, "The job page redirected too many times.");
      const location = response.headers.location;
      if (typeof location !== "string") throw new JobLinkFetchError(502, "The job page returned an invalid redirect.");
      try {
        current = validateJobUrl(new URL(location, current).toString());
      } catch (error) {
        if (error instanceof JobLinkFetchError) throw error;
        throw new JobLinkFetchError(502, "The job page returned an invalid redirect.");
      }
      continue;
    }
    if (response.status < 200 || response.status >= 300) throw new JobLinkFetchError(502, "The job page returned an error.");
    if (response.body.length > maxJobPageBytes) throw new JobLinkFetchError(413, "The job page exceeds the size limit.");
    const rawType = response.headers["content-type"];
    const contentType = (Array.isArray(rawType) ? rawType[0] : rawType)?.split(";")[0]?.trim().toLowerCase();
    if (contentType !== "text/html" && contentType !== "text/plain") {
      throw new JobLinkFetchError(415, "Only HTML and plain-text job pages are supported.");
    }
    const result = pageText(response.body, contentType);
    if (!result.text) throw new JobLinkFetchError(422, "No readable job-page text was found.");
    return result;
  }
}
