import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const analyzeProjectDocument = async (fileBuffer: Buffer, mimeType: string, context: any) => {
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        Analyze this construction document (${context.type}).
        Project: ${context.name}.
        Extract key details:
        1. Summary
        2. Action Items
        3. Potential Risks
        4. Date of document
        
        Return JSON.
    `;

    const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: {
            role: 'user',
            parts: [
                { text: prompt },
                { inlineData: { mimeType, data: fileBuffer.toString('base64') } }
            ]
        }
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    // Basic cleanup
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
};
