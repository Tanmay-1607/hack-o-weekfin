import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult, Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function extractCalendarInfo(base64Image: string, mimeType: string): Promise<ExtractionResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `Extract all courses and events from this calendar image. 
          Return a JSON object with:
          - courses: array of { id, name, code, instructor, location }
          - events: array of { id, title, date, time, courseId, type, description }
          - summary: a brief summary of the schedule.
          
          Types for events should be one of: 'lecture', 'exam', 'assignment', 'other'.
          If a courseId is not obvious, leave it null.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          courses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                code: { type: Type.STRING },
                instructor: { type: Type.STRING },
                location: { type: Type.STRING },
              },
              required: ["id", "name"],
            },
          },
          events: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                date: { type: Type.STRING },
                time: { type: Type.STRING },
                courseId: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["id", "title", "date", "type"],
            },
          },
          summary: { type: Type.STRING },
        },
        required: ["courses", "events", "summary"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function chatWithSchedule(messages: Message[], context: ExtractionResult): Promise<string> {
  const systemInstruction = `You are a helpful academic assistant. 
  You have access to the following extracted schedule information:
  
  COURSES:
  ${JSON.stringify(context.courses, null, 2)}
  
  EVENTS:
  ${JSON.stringify(context.events, null, 2)}
  
  SUMMARY:
  ${context.summary}
  
  Answer the user's questions based on this schedule. Be precise about dates and times. 
  If they ask for follow-ups, maintain the context. 
  If you don't know something, be honest and suggest they check the original document.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction,
    },
  });

  return response.text || "I'm sorry, I couldn't process that.";
}
