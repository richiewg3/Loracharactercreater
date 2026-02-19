# LoRA Prompt Ad-Lib

A small React app to import a numbered list of dataset prompts, apply global + per-prompt “ad-lib” overrides, and generate copyable captions for training workflows.

## Local development

```bash
npm install
npm run dev
```

Then open the URL printed by Vite.

## Build (production)

```bash
npm run build
npm run preview
```

## Deploy (GitHub Pages)

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that builds and deploys the `dist/` output to **GitHub Pages** on pushes to `main`.

In your repo settings:

- **Settings → Pages**
- **Build and deployment → Source**: select **GitHub Actions**

After the workflow runs, your site will be available at:

- `https://<owner>.github.io/<repo>/`

Notes:

- The workflow builds with Vite `--base=/<repo>/` so assets work correctly under the GitHub Pages subpath.
- A `dist/404.html` is generated from `dist/index.html` for SPA refresh/deep-link friendliness.