import fs from 'node:fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { getSiteUrl } from './scripts/seo-site-url.mjs';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT ?? '5173';

const port = Number(rawPort);
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? '/';
const routeRegistry = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, 'src/data/route-registry.json'), 'utf8'),
) as {
  routes: Array<{ path: string }>;
  redirects: Array<{ from: string; to: string; status: number }>;
  drafts: {
    articles: Array<{ slug: string }>;
    companyPages: Array<{ path: string; status: string }>;
    retiredTools: Array<{ path: string; status: string }>;
  };
};
const normalizeRoute = (route: string) => route.replace(/\/+$/, '') || '/';
const registeredRoutes = [
  ...routeRegistry.routes.map((route) => normalizeRoute(route.path)),
  ...routeRegistry.drafts.articles.map((article) => normalizeRoute(`/article/${article.slug}`)),
];
const archivedArticleRoutes = new Set(
  routeRegistry.drafts.articles.map((article) => normalizeRoute(`/article/${article.slug}`)),
);
const redirects = new Map(
  routeRegistry.redirects.map((entry) => [normalizeRoute(entry.from), entry]),
);
const unpublishedRoutes = new Set([
  ...routeRegistry.drafts.companyPages.map((entry) => normalizeRoute(entry.path)),
  ...routeRegistry.drafts.retiredTools
    .filter((entry) => entry.status !== 'redirect')
    .map((entry) => normalizeRoute(entry.path)),
]);

function isRegisteredRoute(route: string): boolean {
  return registeredRoutes.some((registered) => {
    if (!registered.includes('*')) return registered === route;
    const prefix = registered.slice(0, registered.indexOf('*')).replace(/\/+$/, '');
    return route === prefix || route.startsWith(`${prefix}/`);
  });
}

function trailingSlashRedirect() {
  const redirect = (server: { middlewares: { use: (handler: (req: { method?: string; url?: string }, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: () => void }, next: () => void) => void) => void } }) => {
    server.middlewares.use((req, res, next) => {
      const requestUrl = req.url ?? "/";
      const [originalPathname, query = ""] = requestUrl.split("?");
      const isPageRequest = req.method === "GET" || req.method === "HEAD";
      let pathname = originalPathname;
      try {
        pathname = decodeURIComponent(pathname);
      } catch {
        // Leave malformed paths unmatched so the normal Vite handler can reject them.
      }
      const basePrefix = basePath.replace(/\/+$/, '');
      if (basePrefix && (pathname === basePrefix || pathname.startsWith(`${basePrefix}/`))) {
        pathname = pathname.slice(basePrefix.length) || '/';
      }
      const normalizedPath = normalizeRoute(pathname);
      if (
        !isPageRequest ||
        pathname.includes('.') ||
        pathname.startsWith('/@') ||
        pathname === '/api' ||
        pathname.startsWith('/api/')
      ) {
        next();
        return;
      }
      const legacyRedirect = redirects.get(normalizedPath);
      if (legacyRedirect) {
        res.statusCode = legacyRedirect.status;
        res.setHeader("Location", `${basePrefix}${legacyRedirect.to}${query ? `?${query}` : ""}`);
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.end();
        return;
      }
      if (
        unpublishedRoutes.has(normalizedPath) ||
        !isRegisteredRoute(normalizedPath) ||
        (normalizedPath.startsWith('/article/') && !archivedArticleRoutes.has(normalizedPath))
      ) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Robots-Tag', 'noindex, follow');
        const body = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex, follow"><title>Page not found | CareerReality</title><body><main><h1>Page not found</h1><p>This address is not published.</p><a href="${basePrefix || ''}/">Go to CareerReality</a></main></body></html>`;
        res.end(req.method === 'HEAD' ? undefined : body);
        return;
      }
      if (normalizedPath !== '/' && !pathname.endsWith('/')) {
        res.statusCode = 301;
        res.setHeader("Location", `${basePrefix}${normalizedPath}/${query ? `?${query}` : ""}`);
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.end();
      } else {
        next();
      }
    });
  };

  return {
    name: "career-reality-trailing-slash",
    configureServer: redirect,
    configurePreviewServer: redirect,
  };
}

export default defineConfig(async ({ command }) => {
  // Match the snapshot generators' validation and SITE_URL-first precedence.
  // Only the non-publishable development server may run without an origin.
  const canonicalSiteUrl = command === 'build' || process.env.SITE_URL?.trim() || process.env.VITE_SITE_URL?.trim()
    ? getSiteUrl()
    : '';
  return {
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),
    trailingSlashRedirect(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: [
      {
        find: '@/lib/clerk-runtime',
        replacement: path.resolve(
          import.meta.dirname,
          process.env.VITE_E2E_AUTH_RUNTIME === 'true'
            ? 'src/lib/clerk-runtime-test.tsx'
            : 'src/lib/clerk-runtime.tsx',
        ),
      },
      {
        find: '@assets',
        replacement: path.resolve(import.meta.dirname, '..', '..', 'attached_assets'),
      },
      {
        find: '@',
        replacement: path.resolve(import.meta.dirname, 'src'),
      },
    ],
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
  },
  define: {
    'import.meta.env.VITE_SITE_URL': JSON.stringify(canonicalSiteUrl),
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? '';
          // The production static host serves .mjs as application/octet-stream.
          // PDF.js loads this worker as a JavaScript module, so publish it with
          // a .js extension to ensure browsers accept the module response.
          if (name.startsWith('pdf.worker') && name.endsWith('.mjs')) {
            return 'assets/[name]-[hash].js';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: apiProxyTarget
      ? {
          '/api': {
            target: apiProxyTarget,
            changeOrigin: true,
          },
        }
      : undefined,
    fs: {
      strict: true,
      deny: ['**/src/data/application-readiness.ts'],
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  };
});
