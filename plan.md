# ODIY AI product plan

## Implementation
ODIY AI remains a Vite + React + TypeScript single-page application with localStorage-backed learner progress. The main shell is organised around six product areas: Overview, IELTS practice, AI tutor, Vocabulary, Grammar, and Progress. Practice uses shared skill state for Reading, Listening, Writing, and Speaking, with browser speech recognition and speech synthesis where supported. Mock exam timing is handled in the client and all completed activities update the learner profile.

The Netlify function at `netlify/functions/chat.mts` is the tutor boundary. It uses an OpenAI-compatible API when `OPENAI_API_KEY` is present and falls back to useful deterministic coaching when it is not, keeping local previews functional. The interface is responsive from desktop to mobile and uses a light editorial dashboard language: white surfaces, cool gray canvas, purple as the ownable brand color, and blue/green/orange skill accents.

## Design
- **Style options:** Editorial coaching studio (0.06); quiet academic workspace (0.08); soft SaaS productivity dashboard (0.05).
- **Chosen movement:** Editorial coaching studio — calm, premium, and focused like a modern learning product rather than a game.
- **Core principles:** clear hierarchy, purposeful density, honest progress signals, and frictionless practice starts.
- **Color philosophy:** a cool near-white canvas keeps attention on learning; saturated violet signals confidence and guidance; blue, green, and orange distinguish listening, speaking, and writing without becoming decorative noise.
- **Layout paradigm:** persistent left workspace navigation with asymmetrical hero and content rails, keeping the next best action visible beside deeper practice content.
- **Signature elements:** violet gradient brand mark, small uppercase progress labels, and compact band/skill score treatments.
- **Interaction philosophy:** every primary action starts practice, gets feedback, or makes the next step clearer. Buttons are direct and reversible.
- **Animation:** restrained 180–220ms lifts and color transitions; no distracting loops; respect reduced-motion preferences.
- **Typography:** DM Sans for readable UI copy; Manrope for confident headings and score numerals.
- **Brand essence:** ODIY AI is the focused English coach for ambitious IELTS learners who want honest, actionable practice. Personality: clear, warm, ambitious.
- **Brand voice:** direct, encouraging, specific. Example lines: “Build the English you can rely on.” and “Feedback that helps you move forward.”
- **Wordmark & logo:** uppercase ODIY wordmark paired with a four-point spark mark, implying small insights accumulating into progress.
- **Signature brand color:** ODIY Violet `#6D4AFF`.
