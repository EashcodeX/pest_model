import { GoogleGenAI, Tool } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const chatWithRoverAI = async (message: string, history: {role: 'user' | 'model', text: string}[]) => {
  const ai = getClient();
  // Use gemini-3-pro-preview for complex reasoning chat
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are 'RoverAI', an advanced assistant for the Pest Detection Rover. You help farmers analyze pest data, suggest operational strategies, and debug rover issues. Be concise, professional, and helpful.",
    },
    history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};

export const researchTreatments = async (query: string) => {
  const ai = getClient();
  // Use gemini-2.5-flash with googleSearch for grounded information
  const model = 'gemini-2.5-flash';
  
  const tools: Tool[] = [
    { googleSearch: {} }
  ];

  const result = await ai.models.generateContent({
    model,
    contents: `Find the latest and most effective treatments for this pest issue: ${query}. Provide a concise summary with chemical and organic options.`,
    config: {
      tools,
    }
  });

  const text = result.text;
  const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  const sources = groundingChunks?.map((chunk: any) => {
    if (chunk.web) {
      return { uri: chunk.web.uri, title: chunk.web.title };
    }
    return null;
  }).filter(Boolean) || [];

  return { text, sources };
};
