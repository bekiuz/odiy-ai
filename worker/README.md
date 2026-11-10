# ODIY AI Tutor Worker

This Worker uses Cloudflare Workers AI directly. It does not need a Gemini API key or an external AI provider key.

## Model

- Model: `@cf/google/gemma-4-26b-a4b-it`
- Runtime: Cloudflare Workers AI binding, named `AI`
- Free plan allocation: 10,000 Neurons per day. Usage above that requires a Paid plan; on Workers Free, requests stop when the free allowance is exhausted.

## Cloudflare Dashboard setup

1. Open **Workers & Pages → odiy-ai-tutor → Settings → Bindings**.
2. Select **Add binding → Workers AI**.
3. Set the variable name to exactly `AI`.
4. Save the binding.
5. Open **Edit code**, replace the code with `worker.js`, and deploy.

No Gemini secret is used by this version. The old `GEMINI_API_KEY` secret can be removed after confirming the tutor works.

## GitHub Pages

The frontend continues to call the same Worker URL. No frontend rebuild is needed when only the Worker model changes.
