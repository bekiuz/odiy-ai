# ODIY AI Tutor Worker

This Worker connects the GitHub Pages frontend to the Gemini API. The Gemini key stays in a Cloudflare secret and is never exposed to the browser.

## Deploy

1. Install Wrangler: `npm install -g wrangler`
2. From this folder, sign in: `wrangler login`
3. Add your Google AI Studio key as a secret: `wrangler secret put GEMINI_API_KEY`
4. Deploy: `wrangler deploy`
5. Copy the deployed Worker URL (for example, `https://odiy-ai-tutor.<your-subdomain>.workers.dev`).

## Connect GitHub Pages

In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables** and add:

- Name: `VITE_AI_API_URL`
- Value: your deployed Worker URL

Then rerun the **Build and deploy to GitHub Pages** workflow. Do not add the Gemini key to GitHub Pages variables or frontend code; it belongs only in the Cloudflare Worker secret.

The Worker accepts POST requests containing a `messages` array and returns `{ "reply": "..." }`.
