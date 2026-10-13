/**
 * Shared Google Gemini REST Client
 *
 * Uses direct fetch to the official Generative Language REST API.
 * Never logs or exposes secret API keys.
 * Handles timeouts, rate-limits (429), and structured JSON responses cleanly.
 */

export interface GeminiInlineData {
  mimeType: string;
  data: string; // Base64 encoded string without data: URL prefix
}

export interface GeminiPart {
  text?: string;
  inlineData?: GeminiInlineData;
}

export interface GeminiContent {
  role?: 'user' | 'model';
  parts: GeminiPart[];
}

export interface CallGeminiOptions {
  contents: GeminiContent[];
  systemInstruction?: string;
  temperature?: number;
  responseSchema?: Record<string, any>;
  responseMimeType?: string;
  timeoutMs?: number;
}

export async function callGemini(options: CallGeminiOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody: Record<string, any> = {
    contents: options.contents,
    generationConfig: {
      temperature: options.temperature ?? 0.3,
    },
  };

  if (options.systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options.responseMimeType) {
    requestBody.generationConfig.responseMimeType = options.responseMimeType;
  }

  if (options.responseSchema) {
    requestBody.generationConfig.responseSchema = options.responseSchema;
    requestBody.generationConfig.responseMimeType = 'application/json';
  }

  const timeoutMs = options.timeoutMs ?? 55000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Gemini API rate limit reached. Please wait a minute before generating again.');
      }
      if (response.status === 404) {
        throw new Error(`Gemini model "${model}" was not found or is deprecated. Please check GEMINI_MODEL setting.`);
      }
      const errorText = await response.text();
      let errorJson: any;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = null;
      }
      const message = errorJson?.error?.message || `HTTP ${response.status}: ${errorText.slice(0, 150)}`;
      throw new Error(`Gemini API error: ${message}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Gemini returned an empty response or no text candidate');
    }

    return candidateText;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Gemini request timed out after ${timeoutMs / 1000} seconds`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
