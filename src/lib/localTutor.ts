import { pipeline } from "@huggingface/transformers";

export type TutorMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ProgressEvent = {
  status?: string;
  progress?: number;
  file?: string;
};

type GeneratedMessage = {
  role?: string;
  content?: string;
};

type GenerationResult = {
  generated_text?: string | GeneratedMessage[];
};

type TextGenerator = (
  messages: TutorMessage[],
  options: {
    max_new_tokens: number;
    temperature: number;
    repetition_penalty: number;
    do_sample: boolean;
  },
) => Promise<GenerationResult[]>;

const MODEL_ID = "onnx-community/Qwen2.5-0.5B-Instruct";

const SYSTEM_PROMPT = [
  "You are ODIY AI, a patient and encouraging English tutor for IELTS learners.",
  "Reply in the language the learner uses, unless they explicitly ask to practise English.",
  "When they share an English sentence, show a corrected version and explain the most important grammar or vocabulary issue simply.",
  "For IELTS writing, give practical feedback on task response, coherence, vocabulary and grammar when relevant.",
  "Use clear examples and short practice tasks. Do not invent official IELTS scores.",
  "Be honest when you are unsure. Keep the answer focused and end with one useful next step.",
].join(" ");

let generatorPromise: Promise<TextGenerator> | null = null;

function getGenerator(onProgress?: (percent: number) => void): Promise<TextGenerator> {
  if (!generatorPromise) {
    const createPipeline = pipeline as unknown as (
      task: string,
      model: string,
      options: {
        dtype: "q4";
        progress_callback?: (event: ProgressEvent) => void;
      },
    ) => Promise<unknown>;

    generatorPromise = createPipeline("text-generation", MODEL_ID, {
      // Four-bit weights keep the browser download and memory use lower.
      dtype: "q4",
      progress_callback: (event) => {
        if (typeof event.progress === "number" && Number.isFinite(event.progress)) {
          onProgress?.(Math.max(0, Math.min(100, Math.round(event.progress))));
        }
      },
    })
      .then((pipelineInstance) => pipelineInstance as TextGenerator)
      .catch((error) => {
        // Allow another attempt if the first model download or initialization fails.
        generatorPromise = null;
        throw error;
      });
  }

  return generatorPromise;
}

export async function generateTutorReply(
  history: TutorMessage[],
  onProgress?: (percent: number) => void,
): Promise<string> {
  const generator = await getGenerator(onProgress);

  const messages: TutorMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.filter((message) => message.role !== "system").slice(-8),
  ];

  const result = await generator(messages, {
    max_new_tokens: 220,
    temperature: 0.35,
    repetition_penalty: 1.08,
    do_sample: true,
  });

  const generated = result[0]?.generated_text;
  let reply = "";

  if (Array.isArray(generated)) {
    const lastMessage = generated[generated.length - 1];
    reply = typeof lastMessage?.content === "string" ? lastMessage.content : "";
  } else if (typeof generated === "string") {
    reply = generated;
  }

  reply = reply.trim();

  if (!reply) {
    throw new Error("Mahalliy model javobi bo‘sh qaytdi. Qayta urinib ko‘ring.");
  }

  return reply;
}
