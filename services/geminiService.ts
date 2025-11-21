
import { GoogleGenAI, Type } from "@google/genai";
import { TicketPriority } from "../types";

// Interface para o resultado
export interface AnalysisResult {
  priority: TicketPriority;
  summary: string;
  category: string;
}

export const analyzeIncident = async (description: string): Promise<AnalysisResult> => {
  try {
    // Initialize inside the function to prevent app crash on load if env is missing
    // This allows the site to render even if API key is not yet configured
    const apiKey = process.env.API_KEY || '';
    
    if (!apiKey) {
      console.warn("API Key do Google Gemini não configurada.");
      return {
        priority: TicketPriority.MEDIUM,
        summary: "Chave de API não configurada. Contate o administrador.",
        category: "Erro de Configuração"
      };
    }

    const ai = new GoogleGenAI({ apiKey });

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
