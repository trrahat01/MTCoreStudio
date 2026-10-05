import path from 'path';
import { cpSync } from 'node:fs';
import { defineConfig } from 'vite';

const root = path.resolve(import.meta.dirname);
const port = Number(process.env.PORT || 5173);
const basePath = process.env.BASE_PATH || '/mt-core-studio/';
const pageNames = [
  'index', 'apps', 'app', 'about', 'developer',
  'publisher', 'contact', 'privacy', 'blog',
  'updates', 'app-privacy',
];

export default defineConfig({
  // Relative URLs work both at Replit's preview prefix and at a domain root.
  base: process.env.NODE_ENV === 'production' ? './' : basePath,
  root,
  publicDir: path.resolve(root, 'public'),
  plugins: [{
    name: 'copy-editable-content-data',
    closeBundle() {
      cpSync(path.resolve(root, 'data'), path.resolve(root, 'dist/public/data'), {
        recursive: true,
      });
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
