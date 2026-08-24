import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface CurrencyInsight {
  title: string;
  analysis: string;
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high';
  trend: 'up' | 'down' | 'stable';
}

export async function getCurrencyIntelligence(baseCurrency: string, rates: Record<string, number>): Promise<CurrencyInsight | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const prompt = `Analyze the current exchange rates for a professional business context.
  Base Currency: ${baseCurrency}
  Rates: ${JSON.stringify(rates)}
  
  Provide a strategic financial analysis and recommendation for a shop manager.
  Respond in French.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Tu es un expert financier et conseiller stratégique pour les entreprises internationales. Ta mission est d'analyser les taux de change et de donner des conseils proactifs.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            analysis: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
            trend: { type: Type.STRING, enum: ['up', 'down', 'stable'] }
          },
          required: ['title', 'analysis', 'recommendation', 'riskLevel', 'trend']
        }
      }
    });

    return JSON.parse(response.text) as CurrencyInsight;
  } catch (error) {
    console.error('Gemini Currency Service Error:', error);
    return null;
  }
}
