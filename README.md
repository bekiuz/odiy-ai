# ODIY AI

ODIY AI is an IELTS-focused English learning app. Its AI Tutor runs directly in the visitor's browser using Transformers.js and the public ONNX version of Qwen2.5-0.5B-Instruct.

## Local AI Tutor

- No Gemini, Groq, Cloudflare Worker, or hosted inference API key is needed.
- The model runs on the visitor's own device.
- On the first use, the browser downloads the quantized model files from Hugging Face. Later use may reuse the browser cache.
- Performance depends on the visitor's device and browser. The model is small, so feedback is more limited than a large hosted model.
- The app does not send tutor messages to a third-party inference API.

Model: `onnx-community/Qwen2.5-0.5B-Instruct`

The underlying Qwen2.5-0.5B-Instruct model is released under Apache 2.0. See the model card and license:
- https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct
- https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/blob/main/LICENSE

## Development

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Deployment

GitHub Actions builds the Vite app and deploys `dist` to GitHub Pages. No AI API environment variables are required.
