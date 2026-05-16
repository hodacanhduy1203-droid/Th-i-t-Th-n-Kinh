import { handleAIError } from "../utils/aiErrorHandler";
import { sanitizeApiContents } from "../utils/aiHelpers";
import React, { useState, useMemo, useEffect } from "react";
import {
  Shield,
  Sparkles,
  BrainCircuit,
  Calendar,
  Info,
  Clock,
  Compass,
  RefreshCw,
  Send,
  Copy,
  Check,
  MessageSquareShare,
  Loader2,
  Volume2,
  Square,
} from "lucide-react";
import { VoiceInput } from "./VoiceInput";
import { useLanguage } from "../contexts/LanguageContext";
import { setupSpeechSynthesis, cancelSpeech, speakText as speakTextHelper } from '../lib/speech';
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { getAI } from "../services/aiService";
import { GEMINI_MODEL } from "../constants/ai";
import { Solar, Lunar } from "lunar-javascript";
import { Compass24 } from "./Compass24";

interface Props {
  onRequireApiKey?: () => void;
}

export default function PTDonGiapTab({ onRequireApiKey }: Props) {
  const { t } = useLanguage();
  const [question, setQuestion] = useState("");
  const [interimQuestion, setInterimQuestion] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chat, setChat] = useState<
    { role: "user" | "model"; text: string }[]
  >([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setupSpeechSynthesis();
    return () => cancelSpeech();
  }, []);

  const speakText = (text: string, index: number) => {
    if (speakingIndex === index) {
      cancelSpeech();
      setSpeakingIndex(null);
      return;
    }
    speakTextHelper(text, () => setSpeakingIndex(index), () => setSpeakingIndex(null), () => setSpeakingIndex(null));
  };

  useEffect(() => {
    if (chatEndRef.current && chat.length > 0) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat]);

  const getLocalISOString = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const [selectedDate, setSelectedDate] = useState(() => getLocalISOString(new Date()));
  const [isAutoTime, setIsAutoTime] = useState(true);

  useEffect(() => {
    if (!isAutoTime) return;
    const timer = setInterval(() => {
      setSelectedDate(getLocalISOString(new Date()));
    }, 15000);
    return () => clearInterval(timer);
  }, [isAutoTime]);

  const handleAnalyze = async (customQuestion?: string) => {
    const questionToUse = customQuestion || question;
    if (!questionToUse.trim() || isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const systemInstruction = `Bạn là Đại Tông Sư uyên bác về **Kỳ Môn Độn Giáp**, tinh thông các bí điển: "Kỳ Môn Độn Giáp Bí Tí Toàn Thư" (Khổng Minh - Lưu Bá Ôn).
Hãy đưa ra luận giải chi tiết cho người hỏi dựa trên thời điểm hiện tại. Trình bày rõ ràng, mạch lạc, chia thành các gạch đầu dòng ngắn gọn.`;

      const userPrompt = questionToUse;
      const apiContents = sanitizeApiContents(chat, userPrompt);

      setChat((prev) => [...prev, { role: "user", text: userPrompt }, { role: "model", text: "" }]);
      setQuestion("");
      setInterimQuestion("");

      const aiInstance = getAI();
      const stream = await aiInstance.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: apiContents,
        config: { systemInstruction: systemInstruction },
      });

      let fullResp = "";
      let lastUpdate = Date.now();
      for await (const chunk of stream) {
        fullResp += chunk.text || "";
        if (Date.now() - lastUpdate > 50) {
          setChat((prev) => {
            if (prev.length === 0) return prev;
            const newChat = [...prev];
            newChat[newChat.length - 1] = { ...newChat[newChat.length - 1], text: fullResp };
            return newChat;
          });
          lastUpdate = Date.now();
        }
      }
      setChat((prev) => {
        if (prev.length === 0) return prev;
        const newChat = [...prev];
        newChat[newChat.length - 1] = { ...newChat[newChat.length - 1], text: fullResp };
        return newChat;
      });
    } catch (error: any) {
      console.error("PTDonGiap AI Analysis Error:", error);
      const errorMsg = handleAIError(error);
      if (
        errorMsg.includes("API Key") ||
        errorMsg.includes("Quota") ||
        error?.message === "API_KEY_MISSING"
      ) {
        if (onRequireApiKey) onRequireApiKey();
      }
      setChat((prev) => {
        if (prev.length === 0) return prev;
        const newChat = [...prev];
        newChat[newChat.length - 1] = { ...newChat[newChat.length - 1], text: errorMsg };
        return newChat;
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-full mx-auto gap-4 animate-in fade-in duration-700">
      <div className="bg-[#f2f8f1] rounded-3xl p-1.5 sm:p-4 shadow-xl border border-emerald-100 flex flex-col sm:flex-row justify-between items-center gap-4 overflow-hidden relative">
        <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center shrink-0 shadow-inner">
            <Compass className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-emerald-950 tracking-tight leading-tight uppercase font-serif">
              PT Độn Giáp
            </h2>
            <p className="text-emerald-800/40 text-xs flex items-center gap-2 mt-0.5 truncate uppercase tracking-widest font-black">
              Phân Tích Độn Giáp Kỳ Môn
            </p>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center mb-2">
        <Compass24 />
      </div>

      <div className="w-full">
        <div className="bg-[#e6f7eb] rounded-2xl p-1 shadow-xl border border-emerald-200 flex flex-col relative overflow-hidden">
          <div className="bg-[#f0fcf4] rounded-3xl border border-emerald-200/50 overflow-hidden shadow-sm flex flex-col h-full min-h-[400px]">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3 px-1 text-left">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-100 p-1.5 rounded-xl shadow-sm">
                    <BrainCircuit className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[12px] sm:text-sm text-emerald-950 uppercase tracking-widest leading-none">
                      Luận Giải PT Độn Giáp AI
                    </h3>
                  </div>
                </div>
              </div>

              {(chat.length > 0 || isAnalyzing) && (
                <div className="overflow-y-auto max-h-[600px] space-y-3 rounded-xl bg-transparent p-1 custom-scrollbar select-text mb-3">
                  {chat.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} w-full`}>
                      {msg.role === "user" ? (
                        <div className="bg-[#124a2e] text-white px-3 py-2 rounded-2xl text-[12px] shadow-md">{msg.text}</div>
                      ) : (
                        <div className="prose prose-stone text-[14px] leading-[1.6]">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              <div className="relative group">
                <textarea
                  disabled={isAnalyzing}
                  className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-[13px] font-medium outline-none h-min-[50px] shadow-sm placeholder:text-emerald-900/20"
                  placeholder="Hỏi AI về cát hung, mưu sự..."
                  value={question + (interimQuestion ? (question ? " " : "") + interimQuestion : "")}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAnalyze(question + (interimQuestion ? " " + interimQuestion : ""));
                    }
                  }}
                />
                <div className="flex items-center justify-between mt-2 px-1">
                  <VoiceInput onResult={(t, f) => f ? setQuestion(p => p ? p + " " + t : t) : setInterimQuestion(t)} className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl" iconSize={18} />
                  <button onClick={() => handleAnalyze()} disabled={isAnalyzing || (!question && !interimQuestion)} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-800 text-white rounded-xl shadow-lg">
                    <Send className="w-3.5 h-3.5" /> Gửi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
