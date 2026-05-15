import { GoogleGenAI } from "@google/genai";
import { getLunarInfoTool, getTuViTool, executeGetLunarInfo, executeGetTuVi } from "../lib/geminiTools";
import { GEMINI_MODEL } from "../constants/ai";
import { getAI } from "./aiService";
import { handleAIError } from "../utils/aiErrorHandler";

export class GeminiService {
  private history: any[] = [];
  private lastApiKey: string | null = null; 
  private currentContextStr: string = "";
  
  constructor() {}

  async sendMessage(message: string, context?: any): Promise<string> {
    try {
      const ai = getAI();
      
      // We don't really need the raw API key here anymore as getAI() handles the caching and instance management.
      // But we can still keep track of "cache identity" if needed. 
      // For simplicity, we'll just check if the model is initialized.
      
      if (this.history.length === 0) {
        const currentDate = new Date();
        let contextStr = "";
        if (context) {
          contextStr = `\nTHÔNG TIN NGƯỜI DÙNG:
- Họ tên: ${context.name || "Hội viên"}
- Ngày sinh: ${context.day}/${context.month}/${context.year} ${context.hour}h
- Giới tính: ${context.gender === "male" ? "Nam" : "Nữ"}`;
        }
        this.currentContextStr = contextStr;
      }

      const systemInstruction = `Bạn là 'Chuyên gia phong thủy AI', một hệ thống trí tuệ nhân tạo chuyên sâu về huyền học phương Đông, đại diện cho tất cả sức mạnh của ứng dụng này.
Bạn có khả năng gọi các công cụ (tools) để tính toán lá số Tử Vi hoặc tra cứu Lịch Âm Dương, Bát Tự, Trực, Tú.
Hôm nay là: ${new Date().getHours()}:${new Date().getMinutes()} Ngày ${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}.${this.currentContextStr}

MỆNH LỆNH CỐT LÕI MỚI:
1. Khi có câu hỏi về vận mệnh, đánh giá sự việc, hoặc "giờ này làm gì"... BẠN BẮT BUỘC phải gọi 'get_lunar_info'. Nếu có thông tin người dùng, hãy dùng thông tin đó để gọi 'get_tu_vi'.
2. Phải tổng hợp đa môn: Kỳ Môn, Thái Ất, Bát Quái, Tứ Trụ để đưa ra đáp án "chuẩn nhất" như người dùng yêu cầu.
3. Luôn giữ phong thái đại sư: Uyên bác, súc tích, dứt khoát.`;

      // Add user message
      this.history.push({ role: 'user', parts: [{ text: message }] });

      const config = {
        systemInstruction,
        tools: [{ functionDeclarations: [getLunarInfoTool, getTuViTool] }]
      };

      let result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: this.history,
        config
      });

      // Append assistant's response part (including function calls)
      if (result.candidates && result.candidates.length > 0 && result.candidates[0].content) {
         this.history.push(result.candidates[0].content);
      }

      // Prevent history from growing infinitely which causes token limits and out of memory.
      // We clear it entirely to avoid breaking user/model alternating constraints.
      // Reduced to 20 for more aggressive cleanup to save tokens/quota
      if (this.history.length > 20) {
        // Keep only top instructions vibes and last few messages
        const lastFew = this.history.slice(-10);
        this.history = lastFew;
      }

      // Handle function calls loop
      let loopCount = 0;
      while (result.candidates && result.candidates[0].content.parts.some((p: any) => p.functionCall) && loopCount < 5) {
        loopCount++;
        const calls = result.candidates[0].content.parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall!);
        
        const functionResponses = calls.map((call: any) => {
          let resultJson = "";
          if (call.name === "get_lunar_info") {
             resultJson = executeGetLunarInfo(call.args as any);
          } else if (call.name === "get_tu_vi") {
             resultJson = executeGetTuVi(call.args as any);
          } else {
             resultJson = JSON.stringify({ error: "Unknown function" });
          }
          
          let parsedResult;
          try {
             parsedResult = JSON.parse(resultJson);
          } catch(e) {
             parsedResult = { error: resultJson };
          }

          return {
            functionResponse: {
              name: call.name,
              response: parsedResult
            }
          };
        });
        
        // Push user function response
        this.history.push({ role: 'user', parts: functionResponses });

        // Send the function responses back to the model
        result = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: this.history,
          config
        });

        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content) {
            this.history.push(result.candidates[0].content);
        }
      }

      return result.text || "";
    } catch (error: any) {
      const errorMsg = handleAIError(error);
      if (errorMsg.includes("API Key") || errorMsg.includes("Quota") || error?.message === 'API_KEY_MISSING') {
        if (typeof window !== "undefined" && (window as any).aistudio?.openSelectKey) {
          setTimeout(() => {
            (window as any).aistudio.openSelectKey();
          }, 500);
        }
      }
      return errorMsg;
    }
  }

  clearHistory() {
    this.history = [];
  }
}

export const geminiService = new GeminiService();
