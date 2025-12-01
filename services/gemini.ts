import { GoogleGenAI, Type } from "@google/genai";
import { Task, Urgency, Importance, ReceiptParsedItem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateSubtasks = async (taskTitle: string, taskDescription: string): Promise<{ title: string; description: string }[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Break down the following task into 3-5 concrete, actionable subtasks. 
      Task: ${taskTitle}
      Description: ${taskDescription}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["title", "description"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const estimateMaterials = async (taskTitle: string): Promise<{ name: string; quantity: number; unit: string; estimatedPrice: number }[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `List the likely materials and estimated costs needed for this task: "${taskTitle}". Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              estimatedPrice: { type: Type.NUMBER, description: "Unit price estimate in USD" },
            },
            required: ["name", "quantity", "unit", "estimatedPrice"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Gemini Materials Error:", error);
    return [];
  }
};

export const parseReceiptImage = async (base64Image: string): Promise<{ vendor: string; items: ReceiptParsedItem[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Analyze this receipt. Extract the vendor name and a list of all items purchased with their quantities and prices. Return JSON." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vendor: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  totalPrice: { type: Type.NUMBER }
                },
                required: ["name", "quantity", "unitPrice", "totalPrice"]
              }
            }
          },
          required: ["vendor", "items"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return { vendor: "Unknown", items: [] };
  } catch (error) {
    console.error("Gemini Receipt Error:", error);
    return { vendor: "Error", items: [] };
  }
};