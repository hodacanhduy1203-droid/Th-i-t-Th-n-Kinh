import { handleAIError } from '../utils/aiErrorHandler';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, Bot, Sparkles, RefreshCw, Mic, Volume2, Square } from 'lucide-react';
import { VoiceInput } from './VoiceInput';
import { geminiService } from '../services/geminiService';
import { GEMINI_MODEL } from '../constants/ai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { setupSpeechSynthesis, cancelSpeech, speakText as speakTextHelper } from '../lib/speech';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface AIChatAssistantProps {
  userProfile?: {
    name: string;
    year: string | number;
    month: string | number;
    day: string | number;
    hour: string | number;
    gender: string;
  };
  onRequireApiKey?: () => void;
}

export const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ userProfile, onRequireApiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [interimInput, setInterimInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', text: 'Xin chào, tôi là **Chuyên gia phong thủy AI**. Tôi được tích hợp sức mạnh của toàn bộ công cụ trong ứng dụng (Xem Ngày, Tử Vi, Kỳ Môn, Thái Ất). Bạn muốn hỏi về vấn đề gì?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setupSpeechSynthesis();
    return () => cancelSpeech();
  }, []);

  const speakText = (text: string, id: string) => {
    if (speakingId === id) {
      cancelSpeech();
      setSpeakingId(null);
      return;
    }

    speakTextHelper(
      text,
      () => setSpeakingId(id),
      () => setSpeakingId(null),
      () => setSpeakingId(null)
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setInterimInput('');
    setIsLoading(true);

    try {
      const response = await geminiService.sendMessage(userMessage.text, userProfile);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error(error);
      const errorMsg = handleAIError(error);
      if (errorMsg.includes("API Key") || errorMsg.includes("Quota") || error?.message === 'API_KEY_MISSING') {
        if (onRequireApiKey) onRequireApiKey();
      }
      setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          text: errorMsg 
        }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    geminiService.clearHistory();
    setMessages([{ id: '1', role: 'assistant', text: 'Hệ thống đã được làm mới. Bạn muốn tìm hiểu về quẻ dịch hay phong thủy nào tiếp theo?' }]);
  };

  return (
    <motion.div 
      drag
      dragMomentum={false}
      initial={{ x: 0, y: 0 }}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden cursor-move"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when interacting with chat
            className="mb-4 w-[90vw] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 shadow-inner backdrop-blur-sm">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Chuyên gia phong thủy AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[10px] text-blue-100">AI Engine: {GEMINI_MODEL}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={clearChat}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="Reset hệ thống"
                >
                  <RefreshCw className="w-4 h-4 text-blue-100 hover:text-white" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-blue-100 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-[13px] shadow-sm relative group ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => speakText(m.text, m.id)}
                        className={`absolute -top-3 -right-3 p-1.5 rounded-lg border transition-all shadow-md z-10 ${speakingId === m.id ? 'bg-rose-50 text-rose-500 border-rose-200' : 'bg-white text-blue-500 hover:text-blue-600 border-slate-200'}`}
                        title={speakingId === m.id ? "Dừng đọc" : "Đọc văn bản"}
                      >
                        {speakingId === m.id ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <div className="prose prose-slate prose-sm max-w-none">
                      <Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm rounded-tl-none animate-pulse flex items-center gap-2 w-max">
                    <div className="flex gap-1 shrink-0">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                    </div>
                    <span className="text-xs text-slate-500 italic whitespace-nowrap shrink-0 my-0 leading-none">Đang phân tích dữ liệu...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={input + (interimInput ? (input ? ' ' : '') + interimInput : '')}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend(input + (interimInput ? (input ? ' ' : '') + interimInput : ''))}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
              <VoiceInput 
                onResult={(text, isFinal) => {
                  if (isFinal) {
                    setInput(prev => prev + (prev ? ' ' : '') + text);
                    setInterimInput('');
                  } else {
                    setInterimInput(text);
                  }
                }}
                className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                iconSize={20}
              />
              <button
                onClick={() => handleSend(input + (interimInput ? (input ? ' ' : '') + interimInput : ''))}
                disabled={(!input.trim() && !interimInput.trim()) || isLoading}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg group"
              >
                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-colors border-2 border-white/20 active:cursor-grabbing"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <Bot className="w-7 h-7" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 border-2 border-white rounded-full animate-pulse" />
          </div>
        )}
      </motion.button>
    </motion.div>
  );
};
