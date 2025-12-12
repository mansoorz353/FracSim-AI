import { GoogleGenAI, Type, SchemaType } from "@google/genai";
import { MODEL_NAMES, SYSTEM_INSTRUCTION } from "../constants";
import { AspectRatio } from "../types";

// Helper to get client with current API key
const getAIClient = (apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Text Generation with optional Search Grounding or Thinking
 */
export const generateText = async (
  prompt: string,
  useSearch: boolean,
  useThinking: boolean
) => {
  const ai = getAIClient();
  
  let modelName = MODEL_NAMES.SEARCH;
  let config: any = {
    systemInstruction: SYSTEM_INSTRUCTION
  };
  
  if (useThinking) {
    modelName = MODEL_NAMES.THINKING;
    config.thinkingConfig = { thinkingBudget: 32768 };
    // Explicitly do NOT set maxOutputTokens per instructions for thinking
  } else if (useSearch) {
    modelName = MODEL_NAMES.SEARCH;
    config.tools = [{ googleSearch: {} }];
  } else {
      modelName = 'gemini-2.5-flash'; // Fallback / standard
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config
  });

  const text = response.text || "No response generated.";
  const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  return { text, grounding };
};

/**
 * Generate Image
 */
export const generateImage = async (prompt: string, aspectRatio: AspectRatio) => {
  const ai = getAIClient();
  
  // Use generateContent for gemini-3-pro-image-preview
  const response = await ai.models.generateContent({
    model: MODEL_NAMES.IMAGE_GEN,
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: '1K'
      }
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated.");
};

/**
 * Edit Image using Nano Banana (Gemini 2.5 Flash Image)
 */
export const editImage = async (base64Image: string, prompt: string) => {
  const ai = getAIClient();
  
  // Strip prefix if present for API
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: MODEL_NAMES.IMAGE_EDIT,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png', // Assuming PNG for canvas exports/uploads usually
            data: cleanBase64
          }
        },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No edited image returned.");
};

/**
 * Generate Video with Veo
 */
export const generateVideo = async (prompt: string, base64Image: string, aspectRatio: '16:9' | '9:16') => {
  // Check for selected API key for Veo
  if (!(window as any).aistudio) {
     throw new Error("AI Studio environment not detected.");
  }
  
  const hasKey = await (window as any).aistudio.hasSelectedApiKey();
  if (!hasKey) {
     // Trigger UI flow in component, but throw here to stop execution
     throw new Error("API_KEY_REQUIRED");
  }

  // Use the selected key implicitly via process.env.API_KEY which is injected after selection
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  let operation = await ai.models.generateVideos({
    model: MODEL_NAMES.VIDEO_GEN,
    prompt: prompt,
    image: {
        imageBytes: cleanBase64,
        mimeType: 'image/png' // Assuming upload is converted/validated
    },
    config: {
        numberOfVideos: 1,
        resolution: '720p', // Only 720p supported for fast preview often, checking spec.. spec says 720 or 1080.
        aspectRatio: aspectRatio
    }
  });

  // Poll
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed.");

  // Fetch with key
  const finalVideoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  const blob = await finalVideoResponse.blob();
  return URL.createObjectURL(blob);
};