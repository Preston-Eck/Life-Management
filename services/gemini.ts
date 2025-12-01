
import { GoogleGenAI, Type } from "@google/genai";
import { Task, Urgency, Importance, ReceiptParsedItem, TaskSuggestion } from "../types";

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

export const parseReceipt = async (base64Data: string, mimeType: string = "image/jpeg"): Promise<{ vendor: string; items: ReceiptParsedItem[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
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

// --- Mock Integration for Google Account Scanning ---
export const scanGoogleData = async (accounts: string[]): Promise<TaskSuggestion[]> => {
  // In a real app, this would fetch email headers/calendar events using the Gmail/Calendar APIs.
  // Then it would pass those headers/summaries to Gemini to extract tasks.
  // Here we mock the input data but use Gemini to "Parse" the mock emails.
  
  const mockEmails = [
    "Subject: HOA Meeting on Tuesday\nBody: Don't forget to bring the financial reports for the HOA meeting next Tuesday at 7 PM.",
    "Subject: Car Maintenance\nBody: Your Toyota Highlander is due for a tire rotation in 2 weeks.",
    "Subject: Soccer Practice\nBody: Leo needs new cleats before the season starts next month.",
    "Subject: Flight Confirmed\nBody: Flight to NYC confirmed for Dec 15th."
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze these email snippets and extract potential to-do list tasks. 
      Ignore items that are just information (like Flight Confirmed) unless there is a preparation task.
      Emails: ${JSON.stringify(mockEmails)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
             type: Type.OBJECT,
             properties: {
               title: { type: Type.STRING },
               description: { type: Type.STRING },
               source: { type: Type.STRING, enum: ['Gmail', 'Calendar'] },
               confidence: { type: Type.NUMBER }
             },
             required: ['title', 'description', 'source', 'confidence']
          }
        }
      }
    });

    if (response.text) {
        const raw = JSON.parse(response.text);
        return raw.map((r: any, idx: number) => ({
            id: `sug-${Date.now()}-${idx}`,
            sourceAccount: accounts[0] || 'unknown',
            ...r
        }));
    }
    return [];

  } catch (error) {
    console.error("Gemini Scan Error", error);
    // Fallback Mock Data if API fails
    return [
        { id: 'm1', source: 'Gmail', sourceAccount: accounts[0], title: 'Print HOA Reports', description: 'From Email: HOA Meeting on Tuesday', confidence: 0.9 },
        { id: 'm2', source: 'Gmail', sourceAccount: accounts[0], title: 'Buy Soccer Cleats', description: 'For Leo, before season starts', confidence: 0.95 }
    ];
  }
};
