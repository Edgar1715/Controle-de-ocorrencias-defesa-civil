import { GoogleGenAI, Type } from "@google/genai";
import { TicketPriority } from "../types";

// NOTE: In a real application, never expose API keys in the frontend code.
// This should be proxied through a backend.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AnalysisResult {
  priority: TicketPriority;
  summary: string;
  category: string;
}

export const analyzeIncident = async (description: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analise o seguinte relato de incidente da Defesa Civil e forneça um JSON com a prioridade sugerida (Baixa, Média, Alta, Crítica), um resumo curto e uma categoria (ex: Alagamento, Deslizamento, Incêndio). Relato: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: { type: Type.STRING, enum: ["Baixa", "Média", "Alta", "Crítica"] },
            summary: { type: Type.STRING },
            category: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const json = JSON.parse(text);
    
    // Map string back to Enum safely
    let priorityEnum = TicketPriority.MEDIUM;
    switch(json.priority) {
      case "Baixa": priorityEnum = TicketPriority.LOW; break;
      case "Alta": priorityEnum = TicketPriority.HIGH; break;
      case "Crítica": priorityEnum = TicketPriority.CRITICAL; break;
    }

    return {
      priority: priorityEnum,
      summary: json.summary,
      category: json.category
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      priority: TicketPriority.MEDIUM,
      summary: "Análise automática indisponível.",
      category: "Geral"
    };
  }
};