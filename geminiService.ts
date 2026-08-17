import { GoogleGenAI, ThinkingLevel, GenerateVideosOperation } from "@google/genai";
import { extractTextFromFile } from "../lib/textExtractor";
import { auth } from "../lib/firebase";
import { checkFairUseLimit, FAIR_USE_MESSAGE } from "../lib/userStats";

let aiInstance: GoogleGenAI | null = null;

export const assertFairUseLimit = async () => {
  const limitCheck = await checkFairUseLimit(auth.currentUser);
  if (!limitCheck.allowed) {
    throw new Error(FAIR_USE_MESSAGE);
  }
};

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_GEMINI_API_KEY);
    const isMock = !apiKey || apiKey.startsWith("YOUR_");
    console.log("[AI Study Buddy] Initialization - Key Check:", 
      apiKey ? `Key Present (Length: ${apiKey.length}, Prefix: ${apiKey.substring(0, 4)}...)` : "Key MISSING",
      isMock ? "WARNING: Key looks like a placeholder!" : ""
    );
    if (!apiKey || isMock) {
      console.error("[AI Study Buddy] CRITICAL ERROR: API Key is either missing or a placeholder.");
      throw new Error("GEMINI_API_KEY is not configured correctly. Please configure your free Gemini API key in AI Studio Settings (top-right menu > Settings > Secrets/API Keys) or environment variables.");
    }
    aiInstance = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
};

export const runWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    const errorStr = String(err?.message || err?.status || err || "").toLowerCase();
    const isTemporary = 
      errorStr.includes("503") || 
      errorStr.includes("unavailable") || 
      errorStr.includes("high demand") ||
      errorStr.includes("busy") ||
      errorStr.includes("overloaded") ||
      err?.status === 503;
      
    if (isTemporary && retries > 0) {
      console.warn(`[Gemini API] Temporary error (503/UNAVAILABLE) detected. Retrying in ${delayMs}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return runWithRetry(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
};

export const parseGeminiJSON = (rawText: string): any => {
  if (!rawText || !rawText.trim()) {
    throw new Error("Empty response received from AI.");
  }

  let text = rawText.trim();

  // 1. Remove markdown code fence blocks if present
  text = text.replace(/```(?:json|JSON)?/gi, "").replace(/```/g, "").trim();

  // 2. Fix corrupted key/value patterns caused by grounding injection like `":. Text`
  text = text.replace(/":\s*\.\s*([A-Za-z])/g, '": "$1');
  text = text.replace(/":\s*\[\d+(?:\.\d+)*\]/g, '": ""');

  // 3. Extract JSON payload between the first '{' or '[' and end of text
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let startIdx = -1;

  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    text = text.substring(startIdx);
  }

  // Helper function to repair truncated or corrupted JSON strings
  const repairJSON = (inputStr: string): string => {
    let str = inputStr.trim();
    // Remove grounding citation markers like [1.3.1], [1], [2.1]
    str = str.replace(/\[\d+(?:\.\d+)*\]/g, "");
    
    let inString = false;
    let isEscaped = false;
    const stack: string[] = [];

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === '\\') {
        isEscaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === '{' || char === '[') {
        stack.push(char === '{' ? '}' : ']');
      } else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }

    if (inString) {
      str += '"';
    }

    // Clean up trailing commas
    str = str.replace(/,\s*$/g, '');
    str = str.replace(/,\s*([\}\]])/g, '$1');

    // Close open objects and arrays
    while (stack.length > 0) {
      const closeChar = stack.pop();
      str += closeChar;
    }

    return str;
  };

  // Attempt 1: Direct JSON parse
  try {
    return JSON.parse(text);
  } catch (e1) {
    // Attempt 2: Clean control characters and strip citation markers
    try {
      const sanitized = text
        .replace(/\[\d+(?:\.\d+)*\]/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\t/g, " ")
        .replace(/,\s*([\}\]])/g, "$1");
      return JSON.parse(sanitized);
    } catch (e2) {
      // Attempt 3: Escape unescaped newlines within quotes
      try {
        const escaped = text
          .replace(/\[\d+(?:\.\d+)*\]/g, "")
          .replace(/\r\n/g, "\\n")
          .replace(/\n/g, "\\n")
          .replace(/\t/g, "\\t")
          .replace(/,\s*([\}\]])/g, "$1");
        return JSON.parse(escaped);
      } catch (e3) {
        // Attempt 4: Structural JSON repair for truncated or corrupted responses
        try {
          const repaired = repairJSON(text);
          return JSON.parse(repaired);
        } catch (e4) {
          console.error("[geminiService] JSON Parse Error. Raw text length:", rawText.length);
          console.error("Snippet:", text.slice(0, 500));
          throw new Error("I received an invalid response format from the AI. Please try again.");
        }
      }
    }
  }
};

export const analyzeNotebook = async (
  sources: { id: string; name: string; type: string; extractedText: string; base64Data?: string; mimeType?: string }[], 
  age: number = 20,
  targetLanguage: string = 'English'
) => {
  await assertFairUseLimit();
  const ai = getAI();

  const sourcesToUse = sources.filter(s => s.extractedText || s.base64Data);
  const finalSources = sourcesToUse.length > 0 ? sourcesToUse : sources;

  const inlineParts: any[] = [];
  let sourcesText = "ACTIVE NOTEBOOK SOURCES FOR GROUNDING:\n\n";

  finalSources.forEach((src) => {
    const textContent = src.extractedText || (src as any).notes || src.name || '';
    sourcesText += `=== SOURCE [${src.id}]: ${src.name} (${src.type || 'file'}) ===\n${textContent.slice(0, 8000)}\n\n`;
    if (src.base64Data && src.mimeType) {
      inlineParts.push({
        inlineData: {
          data: src.base64Data,
          mimeType: src.mimeType
        }
      });
    }
  });

  const languageInstruction = targetLanguage && targetLanguage !== 'English'
    ? `CRITICAL MULTI-LANGUAGE MANDATE:
       Target Output Language: ${targetLanguage}.
       Detect the input document language, but generate ALL text output fields (subject, topics, summary, simpleExplanation, teacherExplanation, chapters, flashcards, quiz questions and options, weakAreas, schedule) 100% in ${targetLanguage}.`
    : `Output Language: English.`;

  const prompt = `
    Analyze these notebook study sources thoroughly.
    
    ${languageInstruction}
    
    STRICT GROUNDING & NEWS CONTENT ANALYSIS & WEB ENRICHMENT MANDATE:
    1. DIRECT NEWS STORY REPORTING: If the source contains news reports, press articles, or news snippets (e.g. from Nepal Pulse, BBC, Reuters, online portals, etc.), extract and explain the ACTUAL NEWS EVENTS, STORIES, FACTS, DATA, AND REAL-WORLD IMPACT described in the text. DO NOT write meta-summaries about the news outlet or publishing company itself (e.g. do NOT talk about 'Nepal Pulse as a media platform'). Report the news story content directly!
    2. WEB & EXTERNAL KNOWLEDGE ENRICHMENT: Ground all core points in the provided material, BUT ALSO enrich the analysis by finding and incorporating relevant external background context, complementary facts, definitions, and real-world developments from general knowledge to provide a much richer 360-degree study guide.
    3. NO GEOGRAPHIC HALLUCINATIONS: Do not substitute or invent unmentioned geographic origins. If a document is about a specific region (e.g. European Union or Nepal), stick to that true context and do not swap it with unrelated places.
    4. ACCURATE SUBJECT TITLE: The "subject" field MUST accurately state the exact primary subject/news story title (e.g., "Monetary Policy Updates and Economic Reforms" rather than "Nepal Pulse Article").
    
    AGE MODE: The student is ${age} years old. 
    ${age < 12 ? 'Explain things like they are a child using very simple metaphors.' : age < 18 ? 'Use relatable high-school analogies and punchy language.' : 'Provide a sophisticated, clear response suitable for adults.'}
    
    GROUNDING CITATIONS MANDATE:
    Every key claim or explanation should tag its source using [[source_id]] or [source: Source Name] where possible.
    
    ${sourcesText}
    
    CRITICAL OUTPUT REQUIREMENTS:
    - "subject" (string, exact document topic/geographic scope in ${targetLanguage}).
    - "topics" (array of strings, key concepts in ${targetLanguage}).
    - "summary" (array of strings, key takeaways with citations in ${targetLanguage}).
    - "simpleExplanation" (string, friendly clear teacher mode in ${targetLanguage}).
    - "teacherExplanation" (string, academic technical explanation in ${targetLanguage}).
    - "chapters" (array of objects with "title" and "topics" in ${targetLanguage}). Each topic MUST have "title", "explanation", and optional "sourceRef".
    - "flashcards" (array of 10-15 objects with "front", "back", "sourceRef" in ${targetLanguage}).
    - "quiz" (array of 10-15 objects with "question", "options" array, "correctAnswer" string, "explanation" string in ${targetLanguage}).
    - "weakAreas" (object with "difficulty" and "suggestion" in ${targetLanguage}).
    - "schedule" (array of 5-8 objects with "time" and "activity" in ${targetLanguage}).
    
    FORMAT: Return structured JSON only.
  `;

  try {
    let response;
    try {
      response = await runWithRetry(() => ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt + "\nIMPORTANT: Ensure valid JSON. Do not wrap in markdown blocks." },
              ...inlineParts
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      }));
    } catch (firstErr: any) {
      response = await runWithRetry(() => ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt + "\nIMPORTANT: Ensure valid JSON. Do not wrap in markdown blocks." },
              ...inlineParts
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      }), 2, 1000);
    }

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return parseGeminiJSON(text);
  } catch (err: any) {
    const errRaw = typeof err === 'object' ? JSON.stringify(err) : String(err);
    const errStr = (errRaw + " " + String(err?.message || "")).toLowerCase();
    if (errStr.includes("quota") || errStr.includes("exceeded") || errStr.includes("429") || errStr.includes("resource_exhausted") || errStr.includes("billing") || errStr.includes("limit")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw err;
  }
};

export const generateNotebookGuide = async (sources: { id: string; name: string; extractedText: string }[], age: number = 20) => {
  const ai = getAI();

  const sourcesText = sources.map(s => {
    const textContent = s.extractedText || (s as any).notes || s.name || '';
    return `[Source ID: ${s.id}, Name: ${s.name}]:\n${textContent.slice(0, 6000)}`;
  }).join('\n\n');

  const prompt = `
    Generate a complete Notebook Study Guide from these active sources.
    
    STRICT GROUNDING MANDATE:
    - Base all sections (briefing, faq, timeline, studyGuide) strictly and accurately on the provided active sources.
    - Do NOT hallucinate unrelated topics, regions, or countries (e.g. if the material is about the European Union (EU), DO NOT discuss Nepal or unrelated subjects).
    
    AGE MODE: Student is ${age} years old. Apply age-adaptive tone and casual Hinglish friendliness.
    
    GROUNDING SOURCES:
    ${sourcesText}
    
    JSON STRUCTURE REQUIRED:
    {
      "briefing": "1-2 paragraph executive briefing framing key exam takeaways and core lessons.",
      "faq": [
        {
          "question": "8-12 likely exam questions",
          "answer": "Grounded answer citing the source",
          "sourceRefs": ["source_ids"]
        }
      ],
      "timeline": [
        {
          "date_or_order": "Step 1 / Date / Sequential Order",
          "event": "Process or event description"
        }
      ],
      "studyGuide": [
        {
          "heading": "Section Heading",
          "bullets": ["Bullet point 1", "Bullet point 2"]
        }
      ]
    }
    
    FORMAT: Return JSON only.
  `;

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    }));

    const text = response.text || "{}";
    return parseGeminiJSON(text);
  } catch (err) {
    console.error("Error generating notebook guide:", err);
    throw err;
  }
};

export const generateStudyCastScript = async (sources: { id: string; name: string; extractedText: string }[], age: number = 20) => {
  const ai = getAI();

  const sourcesText = sources.map(s => {
    const textContent = s.extractedText || (s as any).notes || s.name || '';
    return `[Source: ${s.name}]:\n${textContent.slice(0, 5000)}`;
  }).join('\n\n');

  const prompt = `
    Create a dialogue script for an interactive StudyCast podcast between two hosts discussing this material.
    
    STRICT GROUNDING MANDATE:
    - The podcast hosts MUST discuss ONLY the concepts and facts from the provided sources.
    - Do NOT invent or mention unrelated topics, regions, or countries (e.g. if the document is about the European Union, stick 100% to EU concepts).
    
    HOST PERSONAS:
    - "Host A": Curious student/peer asking insightful questions, reacting naturally, breaking down complex points.
    - "Host B": Friendly AI Tutor using Hinglish-casual tone, age-adaptive (${age} years old style), giving punchy examples and analogies.
    
    GROUNDING CONTENT:
    ${sourcesText}
    
    JSON STRUCTURE REQUIRED:
    {
      "script": [
        { "speaker": "Host A", "line": "Hey! So today we're looking at..." },
        { "speaker": "Host B", "line": "Haan, exactly! Basically iska simple concept hai..." }
      ]
    }
    
    Provide 12-18 turns of engaging dialogue.
    FORMAT: Return JSON only.
  `;

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    }));

    const text = response.text || "{}";
    const parsed = parseGeminiJSON(text);
    return parsed.script || [];
  } catch (err) {
    console.error("Error generating StudyCast script:", err);
    throw err;
  }
};

export const generateMindMapFromSources = async (sources: { id: string; name: string; extractedText: string }[]) => {
  const ai = getAI();

  const sourcesText = sources.map(s => {
    const textContent = s.extractedText || (s as any).notes || s.name || '';
    return `[Source ID: ${s.id}, Name: ${s.name}]:\n${textContent.slice(0, 6000)}`;
  }).join('\n\n');

  const prompt = `
    Build a concept graph Mind Map from these study sources.
    
    STRICT GROUNDING MANDATE:
    - All mind map nodes and connections MUST be extracted directly from the provided study sources below.
    - Do NOT invent unrelated topics, regions, or countries.
    
    GROUNDING CONTENT:
    ${sourcesText}
    
    JSON STRUCTURE REQUIRED:
    {
      "nodes": [
        { "id": "node_1", "label": "Main Topic", "category": "Core Concept", "description": "Short explanation", "sourceRefs": ["source_ids"] },
        { "id": "node_2", "label": "Sub concept 1", "category": "Sub-topic", "description": "Short explanation" }
      ],
      "connections": [
        { "fromId": "node_1", "toId": "node_2", "relation": "explains" }
      ]
    }
    
    Provide 8-14 nodes with logical connections.
    FORMAT: Return JSON only.
  `;

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    }));

    const text = response.text || "{}";
    return parseGeminiJSON(text);
  } catch (err) {
    console.error("Error generating mind map:", err);
    throw err;
  }
};

export const askTutorQuestion = async (
  sources: { id: string; name: string; extractedText: string }[],
  question: string,
  age: number = 20,
  context?: string
): Promise<string> => {
  const ai = getAI();
  const sourcesText = sources.map(s => {
    const textContent = s.extractedText || (s as any).notes || s.name || '';
    return `[Source: ${s.name}]:\n${textContent.slice(0, 4000)}`;
  }).join('\n\n');
  const prompt = `
    You are an engaging AI Tutor speaking with a student (Age: ${age}). 
    Tone: Friendly, age-adaptive, casual Hinglish tutor voice.
    Context: ${context || ''}
    Question: ${question}
    
    STRICT GROUNDING MANDATE:
    Ground your answer strictly in these study sources.
    Do NOT mention or invent unrelated topics, regions, or countries unless present in the sources.
    
    Study sources:
    ${sourcesText}
  `;
  try {
    const res = await runWithRetry(() => ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    }));
    return res.text || "I couldn't find a grounded answer in your sources.";
  } catch (err) {
    console.error("askTutorQuestion error:", err);
    return "Sorry, I had a momentary connection hiccup!";
  }
};

export const analyzeStudyMaterial = async (files: File[], age: number = 20, targetLanguage: string = 'English') => {
  await assertFairUseLimit();
  const ai = getAI();

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getMimeType = (file: File): string => {
    if (file.type && file.type !== 'application/octet-stream') {
      return file.type;
    }
    const name = file.name.toLowerCase();
    if (name.endsWith('.mp4')) return 'video/mp4';
    if (name.endsWith('.webm')) return 'video/webm';
    if (name.endsWith('.mov')) return 'video/quicktime';
    if (name.endsWith('.mkv')) return 'video/x-matroska';
    if (name.endsWith('.avi')) return 'video/x-msvideo';
    if (name.endsWith('.3gp')) return 'video/3gpp';
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.png')) return 'image/png';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
    return 'application/octet-stream';
  };

  const hasVideo = files.some(file => {
    const mime = getMimeType(file);
    return mime.startsWith('video/') || Boolean(file.name.match(/\.(mp4|webm|mov|mkv|avi|3gp|flv)$/i));
  });

  const extractedTexts = await Promise.all(
    files.map(async (file) => {
      try {
        const txt = await extractTextFromFile(file);
        return txt;
      } catch (err) {
        console.warn("Text extraction failed for:", file.name, err);
        return `[File Name: ${file.name}]`;
      }
    })
  );

  const fileData = await Promise.all(
    files.map(async (file) => ({
      inlineData: {
        data: await convertToBase64(file),
        mimeType: getMimeType(file),
      },
    }))
  );

  const sourcesText = files.map((f, i) => {
    return `=== FILE [${f.name}] (${f.type || 'unknown type'}) ===\n${extractedTexts[i] || ''}\n`;
  }).join('\n\n');

  const modelToUse = hasVideo ? "gemini-3.1-pro-preview" : "gemini-3.6-flash";

  const videoPromptNote = hasVideo ? `\n    NOTE: Video content is included in this study material. Perform deep temporal and visual analysis of the video frames and audio track. Extract key concepts, timestamps if relevant, visual demonstrations, and summarize all core lessons.` : '';

  const languageInstruction = targetLanguage && targetLanguage !== 'English'
    ? `CRITICAL MULTI-LANGUAGE MANDATE:
       Target Output Language: ${targetLanguage}.
       Detect the input document language, but generate ALL text output fields (subject, topics, summary, simpleExplanation, teacherExplanation, chapters, flashcards, quiz questions and options, weakAreas, schedule) 100% in ${targetLanguage}.`
    : `Output Language: English.`;

  const prompt = `
    Analyze this study material thoroughly and provide a structured JSON response ULTRA-FAST.${videoPromptNote}
    
    ${languageInstruction}
    
    STRICT ACCURACY, NEWS CONTENT ANALYSIS & WEB ENRICHMENT MANDATE:
    1. DIRECT NEWS STORY REPORTING: If the uploaded material contains news articles, press reports, or media content (e.g. from Nepal Pulse, BBC, Reuters, online news portals, etc.), extract and explain the ACTUAL NEWS EVENTS, STORIES, FACTS, DATA, AND REAL-WORLD IMPACT described in the text. DO NOT write meta-summaries about the news outlet or publishing company itself (e.g. do NOT talk about 'Nepal Pulse as a media platform'). Report the news story content directly!
    2. WEB & COMPLEMENTARY ENRICHMENT: Ground all core points in the provided material, BUT ALSO incorporate relevant external background context, complementary facts, definitions, and real-world developments from general knowledge and web research to provide an enriched 360-degree study guide.
    3. ACCURATE SUBJECT TITLE: The "subject" field MUST state the exact primary news event or subject topic (e.g., "Monetary Policy Updates and Economic Reforms" rather than "Nepal Pulse Article").
    
    AGE MODE: The student is ${age} years old. 
    ${age < 12 ? 'Explain things like they are a child using very simple metaphors and fun language.' : age < 18 ? 'Use relatable high-school analogies and punchy language.' : 'Provide a sophisticated, clear response suitable for adults.'}
    
    RAW EXTRACTED DOCUMENT CONTENT:
    ${sourcesText}
    
    CRITICAL OUTPUT REQUIREMENTS:
    - Provide a "subject" (string, exact document topic in ${targetLanguage}).
    - Provide "topics" (array of strings, key concepts extracted from text in ${targetLanguage}).
    - Provide "summary" (array of strings, key takeaways directly from text in ${targetLanguage}).
    - Provide "simpleExplanation" (string, friendly clear teacher mode in ${targetLanguage}).
    - Provide "teacherExplanation" (string, academic technical explanation in ${targetLanguage}).
    - Provide "chapters" (array of objects with "title" and "topics" in ${targetLanguage}). Each topic in chapters MUST have a "title" and "explanation".
    - Provide "flashcards" (array of 10-15 objects with "front" and "back" in ${targetLanguage}).
    - Provide "quiz" (array of 10-15 objects with "question", "options" array, and "correctAnswer" string in ${targetLanguage}).
    - Provide "weakAreas" (object with "difficulty" and "suggestion" in ${targetLanguage}).
    - Provide "schedule" (array of 5-8 objects with "time" and "activity" in ${targetLanguage}).
    
    FORMAT: Return structured JSON only.
  `;

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: modelToUse,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt + "\nIMPORTANT: Ensure all strings are properly escaped and the JSON is structurally complete. Do not wrap in markdown blocks." },
            ...fileData
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    }));

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return parseGeminiJSON(text);
  } catch (err: any) {
    if (err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("QUOTA_EXCEEDED");
    }
    // Re-throw with a cleaner message if it's the API key error seen in the screenshot
    if (err?.message?.includes("API key not valid")) {
       throw new Error("The API key provided for Gemini is invalid. Please check your AI Studio project settings.");
    }
    throw err;
  }
};

export const detectWeakness = async (results: { question: string, answer: string }[]) => {
  const ai = getAI();

  const prompt = `
    Analyze these psychological and behavioral study habits to detect a person's core cognitive weakness.
    
    GUIDELINES:
    - BE ARCHITECTURAL: Analyze the "Why" behind the "What".
    - STYLE: Sophisticated, empathetic, yet direct and analytical (similar to Claude's style).
    - Use technical yet accessible terms (e.g., "Executive Dysfunction", "Cognitive Load", "Dopamine-loop dependency").
    
    SURVEY DATA:
    ${results.map((r, i) => `[Question ${i+1}]: ${r.question}\n[User Answer]: ${r.answer}`).join('\n\n')}
    
    TASK:
    1. Identify the "Primary Weakness" (A punchy 3-5 word name).
    2. Provide a "Psychological Profile" (3-4 sentences of deep insights into their behavioral patterns).
    3. Provide 4-5 high-impact "Suggestions" for improvement.
    4. Set a "Danger Level" (Low, Medium, High).
    5. Provide "comparisonScores" (object with keys: "Action Orientation", "Resilience", "Focus", "Knowledge Depth", "Environment" and values from 0-100 indicating STRENGTH in that area).
    
    FORMAT: Return structured JSON only with keys: "weakness", "psychologicalProfile", "suggestions" (array), "dangerLevel", "comparisonScores" (object).
  `;

  try {
    const response = await runWithRetry(() => ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    }));

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return parseGeminiJSON(text);
  } catch (err: any) {
    if (err?.message?.includes("API key not valid")) {
      throw new Error("The API key provided for Gemini is invalid. Please check your AI Studio project settings.");
    }
    throw err;
  }
};

export const generateOrEditImage = async (params: {
  prompt: string;
  base64Image?: string;
  mimeType?: string;
  quality?: 'flash' | 'pro';
  imageSize?: '1K' | '2K' | '4K';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}): Promise<string> => {
  await assertFairUseLimit();
  const ai = getAI();
  const modelsToTry = params.quality === 'pro' 
    ? ['gemini-3.1-flash-lite-image', 'gemini-3-pro-image', 'gemini-3.1-flash-image']
    : ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image', 'gemini-3-pro-image'];

  const parts: any[] = [];
  if (params.base64Image) {
    parts.push({
      inlineData: {
        data: params.base64Image,
        mimeType: params.mimeType || 'image/png'
      }
    });
  }
  parts.push({ text: params.prompt });

  let lastError: any = null;

  for (const modelToUse of modelsToTry) {
    try {
      const imageConfig: any = {
        aspectRatio: params.aspectRatio || '16:9'
      };
      if (modelToUse === 'gemini-3-pro-image' && params.imageSize) {
        imageConfig.imageSize = params.imageSize;
      }

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: { parts },
        config: {
          imageConfig
        }
      });

      const candidateParts = response.candidates?.[0]?.content?.parts || [];
      for (const part of candidateParts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }
    } catch (err: any) {
      console.warn(`[ImageStudio] Model ${modelToUse} failed:`, err?.message || err);
      lastError = err;
      if (
        err?.status === 403 || 
        err?.status === 400 || 
        err?.status === 404 ||
        err?.message?.includes('PERMISSION_DENIED') || 
        err?.message?.includes('permission') ||
        err?.message?.includes('not supported') ||
        err?.message?.includes('INVALID_ARGUMENT')
      ) {
        continue;
      }
      throw err;
    }
  }

  if (lastError?.status === 403 || lastError?.message?.includes('PERMISSION_DENIED') || lastError?.message?.includes('permission')) {
    throw new Error("Image generation models require billing or permission on your Gemini API key. Please check your project settings.");
  }

  throw lastError || new Error("No image was returned from the AI model.");
};

export const generateVeoVideo = async (params: {
  prompt: string;
  base64Image?: string;
  mimeType?: string;
  aspectRatio?: '16:9' | '9:16';
}): Promise<string> => {
  await assertFairUseLimit();
  const ai = getAI();
  const modelToUse = 'veo-3.1-lite-generate-preview';

  const videoParams: any = {
    model: modelToUse,
    prompt: params.prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: params.aspectRatio || '16:9'
    }
  };

  if (params.base64Image) {
    videoParams.image = {
      imageBytes: params.base64Image,
      mimeType: params.mimeType || 'image/png'
    };
  }

  try {
    const operation = await runWithRetry(() => ai.models.generateVideos(videoParams));
    if (!operation?.name) {
      throw new Error("Failed to initiate video generation operation.");
    }
    return operation.name;
  } catch (err: any) {
    if (err?.status === 403 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('permission')) {
      throw new Error("Veo 3 video generation requires a Gemini API key with billing/permission enabled. Please check your project settings.");
    }
    throw err;
  }
};

export const pollVeoOperation = async (
  operationName: string, 
  onProgress?: (msg: string) => void
): Promise<any> => {
  const ai = getAI();
  const op = new GenerateVideosOperation();
  op.name = operationName;

  let attempts = 0;
  const maxAttempts = 40;

  while (attempts < maxAttempts) {
    attempts++;
    onProgress?.(`Rendering Veo video frames... (Attempt ${attempts})`);
    
    const updated = await ai.operations.getVideosOperation({ operation: op });
    if (updated.done) {
      if ((updated as any).error) {
        throw new Error((updated as any).error?.message || "Video rendering failed.");
      }
      return updated;
    }
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  throw new Error("Video generation timed out. Please try again.");
};

export const downloadVeoVideo = async (operationResult: any): Promise<string> => {
  const uri = operationResult.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) throw new Error("Video download URI not found in operation result.");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const res = await fetch(uri, {
    headers: { 'x-goog-api-key': apiKey }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch video stream: ${res.statusText}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const solveWithHighThinking = async (prompt: string): Promise<string> => {
  await assertFairUseLimit();
  const ai = getAI();
  const modelsToTry = ["gemini-3.1-pro-preview", "gemini-3.6-flash", "gemini-flash-latest"];

  for (const modelName of modelsToTry) {
    try {
      const configObj: any = {};
      if (modelName === "gemini-3.1-pro-preview") {
        configObj.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      const response = await runWithRetry(() => ai.models.generateContent({
        model: modelName,
        contents: [{
          role: "user",
          parts: [{
            text: `You are an elite academic AI tutor with deep reasoning capabilities.\nPerform comprehensive, step-by-step mathematical, logical, and scientific reasoning.\n\nProblem / Statement:\n${prompt}`
          }]
        }],
        config: configObj
      }));

      const text = response.text;
      if (text) return text;
    } catch (err: any) {
      console.warn(`[HighThinking] Model ${modelName} failed:`, err?.message || err);
      if (err?.status === 403 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('permission')) {
        continue;
      }
      throw err;
    }
  }

  throw new Error("Failed to generate response from High Thinking model.");
};

export const searchGroundedQuery = async (query: string): Promise<{ text: string; sources: any[] }> => {
  await assertFairUseLimit();
  const ai = getAI();
  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

  for (const modelName of modelsToTry) {
    try {
      const response = await runWithRetry(() => ai.models.generateContent({
        model: modelName,
        contents: [{
          role: "user",
          parts: [{ text: query }]
        }],
        config: {
          tools: [{ googleSearch: {} }]
        }
      }));

      const text = response.text || "No grounded answer available.";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      return { text, sources };
    } catch (err: any) {
      console.warn(`[SearchGrounded] Model ${modelName} failed:`, err?.message || err);
      if (err?.status === 403 || err?.message?.includes('PERMISSION_DENIED') || err?.message?.includes('permission')) {
        continue;
      }
      throw err;
    }
  }

  throw new Error("Search grounding failed due to API permissions.");
};

export const searchUniversitiesAndDegrees = async (params: {
  interest: string;
  education: string;
  location: string;
  degreeLevel: string;
  scholarshipPreference?: string;
  targetLanguage?: string;
}) => {
  const ai = getAI();
  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

  const prompt = `
    You are an expert international education consultant and admissions advisor.
    Find real-world universities, exact admission eligibility, and degree programs matching the student's profile:
    - Choice / Academic Subject Interest: ${params.interest}
    - Current Education & GPA / Grades: ${params.education}
    - Preferred Location / Country / Region: ${params.location}
    - Target Degree Level: ${params.degreeLevel}
    - Scholarship Preference: ${params.scholarshipPreference || 'All'}
    - Output Language: ${params.targetLanguage || 'English'}

    CRITICAL LOCATION & ELIGIBILITY INSTRUCTIONS:
    1. COMPREHENSIVE LIST OF 8 TO 10 TOP UNIVERSITIES: You MUST return a diverse list of 8 to 10 top universities for the requested subject/interest and location. DO NOT stop at just 1 or 2 universities.
    2. REGIONAL / COUNTRY GUIDANCE:
       - If location is "Pakistan" or Pakistan is selected: Always include a top list of 8 to 10 premier Pakistani institutions relevant to the subject. For Engineering/CS: NUST, UET Lahore, FAST-NUCES, GIKI (Ghulam Ishaq Khan Institute), COMSATS, LUMS, PIEAS, Air University. For Medicine/MBBS: King Edward Medical University (KEMU), Aga Khan University (AKU), Dow University of Health Sciences (DUHS), Allama Iqbal Medical College, Rawalpindi Medical University. For Business: LUMS, IBA Karachi, NUST NBS.
       - If location is "Nepal" or Nepal is selected: Always include top Nepalese institutions relevant to the subject. For Engineering/CS: Tribhuvan University (IOE Pulchowk, Thapathali), Kathmandu University (KU), Pokhara University, Purbanchal University, Nepal Engineering College. For Medicine/MBBS: TU IOM Maharajgunj, BPKIHS Dharan, PAHS Patan Academy, KU School of Medical Sciences.
       - If location is "United States": Include MIT, Stanford, UC Berkeley, Carnegie Mellon, Georgia Tech, University of Illinois Urbana-Champaign, Purdue, UT Austin, NYU, etc.
       - If "United Kingdom": Include Imperial College London, University of Oxford, Cambridge, UCL, University of Edinburgh, Manchester, King's College London, Bristol.
       - If "Germany": Include TU Munich, RWTH Aachen, Karlsruhe Institute of Technology (KIT), Heidelberg University, LMU Munich, TU Berlin, Humboldt University.
       - If "India": Include IIT Bombay, IIT Delhi, IIT Madras, AIIMS Delhi, BITS Pilani, IISc Bangalore, NIT Trichy.
       - If "Anywhere / Global": Include 8 to 10 top international universities across North America, Europe, Asia, and Oceania.
    3. REAL ELIGIBILITY & ENTRANCE CRITERIA: State exact GPA/percentage requirements, required standardized tests (e.g. GRE, GMAT, SAT, IELTS 6.5+, TOEFL, or local entrance exams like UET ECAT, NUST NET, KEMU MDCAT, IOE Entrance, CMAT, KUET), and prerequisite coursework concisely.
    4. MATCHING DEGREES: Provide 2-3 specific degree program names per university.
    5. RELATED DEGREES: Suggest 3-5 closely aligned alternative or specialized degree programs.

    JSON STRUCTURE REQUIRED:
    {
      "universities": [
        {
          "name": "Exact University Name",
          "country": "City, Country",
          "matchScore": 95,
          "eligibilityCriteria": "Exact eligibility criteria (GPA, Entrance Exam, IELTS/TOEFL requirements)",
          "acceptanceRate": "Acceptance Rate / Likelihood (e.g. 50% High Match)",
          "tuitionEstimate": "Tuition cost per year / range",
          "recommendedDegrees": ["Degree Program 1", "Degree Program 2"],
          "scholarships": "Scholarship and financial aid details",
          "campusHighlights": ["Highlight 1", "Highlight 2"],
          "applicationDeadline": "Intake deadlines (e.g. Fall 2026 / Nov 30)",
          "websiteUrl": "https://university.edu"
        }
      ],
      "relatedDegrees": [
        {
          "title": "Degree Title",
          "field": "Specialization Field",
          "description": "Why this degree fits their interest",
          "demandLevel": "High / Very High"
        }
      ],
      "careerProspects": "Overview of job market, top hiring roles, and salary expectations for this field."
    }

    Return strictly valid JSON.
  `;

  for (const modelName of modelsToTry) {
    try {
      const response = await runWithRetry(() => ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192
        }
      }));

      const text = response.text || "{}";
      return parseGeminiJSON(text);
    } catch (err: any) {
      console.warn(`[UniversitySearch] Model ${modelName} standard request failed, retrying with search tool:`, err?.message || err);
      try {
        const responseWithTool = await runWithRetry(() => ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            maxOutputTokens: 8192
          }
        }));
        const textWithTool = responseWithTool.text || "{}";
        return parseGeminiJSON(textWithTool);
      } catch (e2) {
        continue;
      }
    }
  }

  throw new Error("Failed to find university recommendations. Please check your internet connection or try again.");
};

export interface ScholarshipMatch {
  id?: string;
  title: string;
  provider: string;
  amount: string;
  fundingType: 'Fully Funded' | 'Tuition Waiver' | 'Partial' | 'Stipend + Allowance' | 'Merit Grant';
  location: string;
  targetEducationLevel: string;
  minGradeGpa: string;
  eligibleMajors: string[];
  matchScore: number;
  deadline: string;
  requiredDocuments: string[];
  applicationUrl: string;
  description: string;
  winningStrategy: string;
}

export interface ScholarshipSearchResponse {
  scholarships: ScholarshipMatch[];
  profileStrengths: string[];
  suggestedActionPlan: string[];
}

export const searchScholarships = async (params: {
  educationLevel: string;
  location: string;
  marksGpa: string;
  fieldOfStudy: string;
  fundingType?: string;
  language?: string;
}): Promise<ScholarshipSearchResponse> => {
  const ai = getAI();
  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

  const prompt = `
    You are an expert International Higher Education & Scholarship Matching Advisor.
    Search real-world global and national scholarships based on the student's profile:
    
    STUDENT PROFILE:
    - Education Level: ${params.educationLevel}
    - Location / Target Study Destination: ${params.location}
    - Academic Performance / Marks / GPA: ${params.marksGpa}
    - Field of Study / Major: ${params.fieldOfStudy}
    - Preferred Scholarship Type: ${params.fundingType || 'All Types'}
    - Target Output Language: ${params.language || 'English'}

    TASK:
    1. Find 6-10 highly relevant real-world scholarships (e.g. Fulbright, Chevening, DAAD, Australia Awards, MEXT, Commonwealth, Erasmus Mundus, Gates Cambridge, Eiffel Excellence, University-specific merit grants, or regional/national government scholarships).
    2. Evaluate how well this candidate fits each scholarship based on their GPA (${params.marksGpa}), major (${params.fieldOfStudy}), and level (${params.educationLevel}).
    3. Calculate an accurate matchScore (percentage 75-99%).
    4. Provide actionable winning strategies, required documents, deadline guidance, and official URL link.

    JSON STRUCTURE:
    {
      "scholarships": [
        {
          "title": "Scholarship Name",
          "provider": "Sponsoring Government / University / Foundation",
          "amount": "Coverage Details e.g. Fully Funded (Tuition + $1,800/mo stipend + Flights)",
          "fundingType": "Fully Funded" | "Tuition Waiver" | "Partial" | "Stipend + Allowance" | "Merit Grant",
          "location": "Country or Institution",
          "targetEducationLevel": "Degree Level",
          "minGradeGpa": "e.g. GPA 3.2+ or 75%+",
          "eligibleMajors": ["Major 1", "Major 2"],
          "matchScore": 95,
          "deadline": "e.g. November 15, 2026",
          "requiredDocuments": ["Transcripts", "Statement of Purpose (SOP)", "2 Reference Letters", "IELTS/TOEFL"],
          "applicationUrl": "https://official-scholarship-portal.org",
          "description": "Comprehensive explanation of what the scholarship covers and who it targets.",
          "winningStrategy": "Specific advice on how this student can highlight their GPA/major to stand out in the application essay."
        }
      ],
      "profileStrengths": [
        "Key strength 1 of the student's profile",
        "Key strength 2"
      ],
      "suggestedActionPlan": [
        "Step 1 to prepare application documents",
        "Step 2 to target top deadline"
      ]
    }

    Return strictly valid JSON only.
  `;

  for (const modelName of modelsToTry) {
    try {
      const response = await runWithRetry(() => ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192
        }
      }));

      const text = response.text || "{}";
      return parseGeminiJSON(text);
    } catch (err: any) {
      console.warn(`[ScholarshipSearch] Model ${modelName} standard request failed, retrying with tool:`, err);
      try {
        const responseWithTool = await runWithRetry(() => ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            maxOutputTokens: 8192
          }
        }));
        const textWithTool = responseWithTool.text || "{}";
        return parseGeminiJSON(textWithTool);
      } catch (e2) {
        continue;
      }
    }
  }

  throw new Error("Failed to find scholarship matches. Please check your network and try again.");
};


