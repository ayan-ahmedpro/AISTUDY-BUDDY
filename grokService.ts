/**
 * Grok (xAI) API Service Integration
 * Provides direct, authenticated integration with xAI's Grok models (grok-2-latest, grok-beta, etc.)
 */

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GrokChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export const getGrokApiKey = (): string | null => {
  const key = 
    (typeof process !== 'undefined' && (process.env?.GROK_API_KEY || process.env?.XAI_API_KEY)) ||
    (typeof import.meta !== 'undefined' && import.meta.env && (
      (import.meta.env as any).VITE_GROK_API_KEY || 
      (import.meta.env as any).VITE_XAI_API_KEY
    ));

  if (!key || key.startsWith("YOUR_") || key.trim() === "") {
    return null;
  }
  return key.trim();
};

export const isGrokConfigured = (): boolean => {
  return !!getGrokApiKey();
};

export const askGrok = async (
  messages: GrokMessage[],
  options: GrokChatOptions = {}
): Promise<string> => {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    throw new Error(
      "Grok API Key (GROK_API_KEY or XAI_API_KEY) is not configured. Please set it in AI Studio Settings (Settings > Secrets/API Keys) or environment variables."
    );
  }

  const model = options.model || "grok-2-latest";
  const temperature = options.temperature ?? 0.7;
  const max_tokens = options.max_tokens ?? 4096;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
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
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Grok API Error (${response.status}): ${response.statusText}`;
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
    throw new Error("No response returned by Grok model.");
  }

  return reply;
};

/**
 * Quick helper for single prompt queries to Grok
 */
export const queryGrokTutor = async (
  prompt: string,
  systemPrompt: string = "You are Grok, an ultra-smart, witty, and precise AI study tutor assisting students with their coursework and deep learning."
): Promise<string> => {
  return askGrok([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ]);
};
