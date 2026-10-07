import path from 'path';
import { cpSync } from 'node:fs';
import { defineConfig } from 'vite';

const root = path.resolve(import.meta.dirname);
const port = Number(process.env.PORT || 5173);
const basePath = process.env.BASE_PATH || '/mt-core-studio/';
const pageNames = [
  'index', 'apps', 'app', 'about', 'developer',
  'publisher', 'contact', 'privacy', 'blog',
  'updates', 'app-privacy', 'terms', '404',
];

export default defineConfig({
  // Relative URLs work both at Replit's preview prefix and at a domain root.
  base: process.env.NODE_ENV === 'production' ? './' : basePath,
  root,
  publicDir: path.resolve(root, 'public'),
  plugins: [{
    name: 'sync-static-deployment-files',
    closeBundle() {
      const output = path.resolve(root, 'dist/public');
      // Keep the build deployable on the PHP host as well as locally: the
      // editable site sources live beside the Vite config, outside public/.
      for (const directory of ['assets', 'api', 'css', 'js', 'meher', 'tools']) {
        cpSync(path.resolve(root, directory), path.resolve(output, directory), { recursive: true });
      }
      cpSync(path.resolve(root, 'data'), path.resolve(output, 'data'), { recursive: true });
      for (const file of ['.htaccess', 'README-INFINITYFREE.md', 'app-ads.txt', 'feed.xml', 'robots.txt', 'sitemap.xml', 'site.webmanifest', 'sw.js']) {
        cpSync(path.resolve(root, file), path.resolve(output, file));
      }
    },
  }],
  build: {
    outDir: path.resolve(root, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(
        pageNames.map((name) => [name, path.resolve(root, `${name}.html`)]),
      ),
    },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
