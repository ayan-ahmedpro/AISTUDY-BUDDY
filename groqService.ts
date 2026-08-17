/**
 * Groq Cloud Inference API Service
 * High-speed, ultra-low latency LLM inference using Groq LPU™ technology.
 * Supports Llama 3.3 70B, Llama 3.1 8B, DeepSeek R1 Distill, Mixtral, Gemma 2, and more.
 */

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatOptions {
  model?: 
    | 'llama-3.3-70b-versatile'
    | 'llama-3.1-8b-instant'
    | 'deepseek-r1-distill-llama-70b'
    | 'gemma2-9b-it'
    | 'mixtral-8x7b-32768'
    | string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export const getGroqApiKey = (): string | null => {
  const key = 
    (typeof process !== 'undefined' && process.env?.GROQ_API_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_GROQ_API_KEY);

  if (!key || key.startsWith("YOUR_") || key.trim() === "") {
    return null;
  }
  return key.trim();
};

export const isGroqConfigured = (): boolean => {
  return !!getGroqApiKey();
};

/**
 * Standard non-streaming completion via Groq Cloud API
 */
export const askGroq = async (
  messages: GroqMessage[],
  options: GroqChatOptions = {}
): Promise<string> => {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error(
      "Groq API Key (GROQ_API_KEY) is not configured. Please set GROQ_API_KEY in AI Studio Settings (Settings > Secrets/API Keys) or environment variables."
    );
  }

  const model = options.model || "llama-3.3-70b-versatile";
  const temperature = options.temperature ?? 0.6;
  const max_tokens = options.max_tokens ?? 4096;
  const top_p = options.top_p ?? 0.95;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Groq API Error (${response.status}): ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      }
    } catch {
      if (errorText) {
        errorMessage += ` - ${errorText}`;
      }
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error("No response returned by Groq model.");
  }

  return reply;
};

/**
 * Streaming inference helper for real-time instant typing responses from Groq
 */
export const streamGroq = async (
  messages: GroqMessage[],
  onChunk: (text: string) => void,
  options: GroqChatOptions = {}
): Promise<string> => {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error(
      "Groq API Key (GROQ_API_KEY) is not configured. Please set GROQ_API_KEY in AI Studio Settings (Settings > Secrets/API Keys)."
    );
  }

  const model = options.model || "llama-3.3-70b-versatile";
  const temperature = options.temperature ?? 0.6;
  const max_tokens = options.max_tokens ?? 4096;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Streaming Error (${response.status}): ${errorText}`);
  }

  if (!response.body) {
    throw new Error("ReadableStream not supported on this response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;

      const dataStr = trimmed.replace(/^data:\s*/, "");
      if (dataStr === "[DONE]") break;

      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onChunk(delta);
        }
      } catch {
        // Skip malformed chunk
      }
    }
  }

  return fullText;
};

/**
 * Fast tutor query helper using Groq LPU speed
 */
export const queryGroqTutor = async (
  prompt: string,
  systemPrompt: string = "You are an ultra-fast AI study tutor powered by Groq LPU inference. Provide clear, accurate, and structured explanations with helpful examples."
): Promise<string> => {
  return askGroq([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ]);
};
