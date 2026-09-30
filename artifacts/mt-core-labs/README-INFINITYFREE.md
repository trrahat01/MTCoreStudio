# MT Core Labs — InfinityFree deployment

This is a static, multi-page website. The live site uses HTML, CSS, image assets and browser JavaScript only. Vite is used locally to preview and produce the upload-ready files; the hosting account does not need Node.js, PHP, a database, a paid service or an API.

## Build the upload folder

From the workspace root (the directory containing `pnpm-workspace.yaml`), run:

```sh
pnpm install
pnpm --filter @workspace/mt-core-labs run build
```

The finished website is in **`dist/public/`**. In InfinityFree File Manager (or FTP), upload the **contents** of `dist/public/` into `public_html`—not the `dist` folder itself. The top level of `public_html` should contain `index.html`, `apps.html`, `app.html`, the other HTML pages, `assets/`, `data/`, `robots.txt` and `sitemap.xml`. The production CSS and JavaScript bundles live in `assets/`.

The output uses relative page, stylesheet, script and image links. It works from a domain root without a Node server. Vite preview also runs below the configured `/mt-core-labs/` prefix.

## Replace the example domain

Before launch, replace `https://example.com` in the canonical URLs and Open Graph metadata in all HTML pages, and in `robots.txt` and `sitemap.xml`. Set `canonicalDomain` and `websiteUrl` in `data/site-config.js` to the real public site. Rebuild and upload the new `dist/public/` contents.

## Add or update apps

Edit **`data/apps.js`**. Add one object to the `apps` array, for example:

```js
{
  id: "descriptive-lowercase-slug",
  name: "App Name",
  category: "Tools",
  platform: "Android",
  description: "A verified, concise description.",
  status: "Status to be confirmed",
  packageName: "",
  playStoreUrl: "",
  privacyUrl: "",
  features: [],
  screenshots: []
}
```

Supported directory categories: `Productivity`, `Education`, `Lifestyle`, `Entertainment`, `Tools`, and `Other`. Keep unknown details blank and leave the status unconfirmed until publication is verified. A Play Store action is disabled while its URL is blank. Publisher Information only lists an app when its status is exactly `Published` and a verified store URL has been provided. After editing, rebuild and upload `dist/public/`.

## Configure the public profile

Edit **`data/site-config.js`** to add verified public contact information and profile links. Blank values intentionally render as unavailable. Do not put login credentials, advertising account IDs, tax or payment information, API keys or other private records in this file; all site files are public.

## Organize publisher records privately

The workspace-root file **`publisher-accounts.local.template.json`** is a local-only organizer for account labels, associated app names, package names and non-sensitive notes. It is not copied into `dist/public/`; never upload it to `public_html`. It is not encrypted, so do not store AdMob account IDs, credentials, tax or payment information, or other confidential details in it.

## Add studio notes

Add objects to **`data/posts.js`** to populate the Blog page. Each post can include `title`, `date`, `category`, `description`, `image`, `imageAlt`, and `content`. With an empty array, the page shows an honest empty state.

## Policies and publication

`privacy.html` is an explicitly incomplete template. Replace it with an accurate app-specific policy based on the app's real data practices before linking or publishing it. This static site has no secure client-only admin area and makes no claims about data collection, verification or app availability.