import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onResult: (text: string, isFinal?: boolean) => void;
  lang?: string;
  className?: string;
  iconSize?: number;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, lang = 'vi-VN', className, iconSize = 16 }) => {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = React.useRef(false);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);
  
  const [recognition, setRecognition] = useState<any>(null);
  const isStartedRef = React.useRef(false);
  const isTransitioningRef = React.useRef(false);
  const lastToggleTime = React.useRef(0);

  const onResultRef = React.useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    let activeRecognition: any = null;
    if (SpeechRecognition) {
      activeRecognition = new SpeechRecognition();
      const recognitionInstance = activeRecognition;
      recognitionInstance.continuous = false; // Using false + onend auto-restart for better compatibility
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = lang;
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        const results = event.results;
        
        for (let i = event.resultIndex; i < results.length; i++) {
          const transcript = results[i][0].transcript;
          if (results[i].isFinal) {
            if (transcript && transcript.trim()) {
              onResultRef.current(transcript.trim(), true);
            }
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (interimTranscript) {
          onResultRef.current(interimTranscript, false);
        }
      };

      recognitionInstance.onstart = () => {
        setIsListening(true);
        isStartedRef.current = true;
        isTransitioningRef.current = false;
      };

      recognitionInstance.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          console.warn('Microphone permission denied. Please allow microphone access in your browser settings.');
          alert('🚫 Trình duyệt (Zalo/Messenger/Facebook) đang CHẶN micro. \n\n👉 Bạn hãy nhấn vào nút 3 chấm [ ⋮ ] ở góc trên cùng bên phải \n👉 Chọn "Mở bằng trình duyệt" (Safari hoặc Chrome) để có thể sử dụng giọng nói.');
        }
        
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }

        setIsListening(false);
        isStartedRef.current = false;
        isTransitioningRef.current = false;
      };

      recognitionInstance.onend = () => {
        if (isStartedRef.current && isListeningRef.current) {
          setTimeout(() => {
            if (isStartedRef.current && isListeningRef.current) {
              try {
                recognitionInstance.start();
              } catch (e) {
                console.error("Recognition restart failed", e);
                setIsListening(false);
                isStartedRef.current = false;
              }
            }
          }, 100);
          return;
        }
        
        setIsListening(false);
        isStartedRef.current = false;
        isTransitioningRef.current = false;
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      isStartedRef.current = false;
      isTransitioningRef.current = false;
      if (activeRecognition) {
          try {
             activeRecognition.abort();
          } catch(e) {}
      }
    };
  }, [lang]);

  const toggleListening = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isTransitioningRef.current) return;

    const now = Date.now();
    if (now - lastToggleTime.current < 400) return; 
    lastToggleTime.current = now;

    if (!recognition) return;

    if (isStartedRef.current) {
      isTransitioningRef.current = true;
      setIsListening(false);
      isStartedRef.current = false;
      try {
        recognition.stop();
      } catch (err) {
        console.error("Error stopping recognition:", err);
        try { recognition.abort(); } catch(e) {}
        isTransitioningRef.current = false;
      }
    } else {
      isTransitioningRef.current = true;
      try {
        recognition.start();
      } catch (err: any) {
        isTransitioningRef.current = false;
        console.error("Trình duyệt từ chối hoặc lỗi khi bật Micro:", err);
        if (err?.name === 'InvalidStateError' || err?.message?.includes('already started')) {
           setIsListening(true);
           isStartedRef.current = true;
        } else {
           setIsListening(false);
           isStartedRef.current = false;
           alert('Trình duyệt không hỗ trợ ghi âm hoặc quyền truy cập bị từ chối. Vui lòng mở bằng Chrome/Safari ở Tab mới.');
        }
      }
    }
  }, [recognition]);

  if (!recognition) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          alert('⛔ Tính năng Nhập Giọng Nói không được hỗ trợ trên trình duyệt này.\n\n👉 Nếu bạn dùng iPhone/iPad: Vui lòng mở bằng trình duyệt SAFARI.\n👉 Nếu bạn dùng Android: Vui lòng mở bằng trình duyệt CHROME.\n👉 Tránh mở link trực tiếp trong Zalo, Messenger, Facebook.');
        }}
        className={`flex items-center justify-center p-3 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed ${className || ''}`}
        title="Trình duyệt không hỗ trợ"
      >
        <MicOff style={{ width: iconSize, height: iconSize }} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`flex items-center justify-center p-3 rounded-2xl transition-all duration-300 shadow-sm active:scale-90 ${
        isListening 
          ? 'bg-rose-600 text-white ring-4 ring-rose-500/20 animate-pulse' 
          : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100'
      } ${className}`}
      title={isListening ? 'Đang ghi âm... Bấm để dừng' : 'Nhập bằng giọng nói'}
    >
      <Mic style={{ width: iconSize, height: iconSize }} className={isListening ? 'animate-bounce' : ''} />
      {isListening && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
        </span>
      )}
    </button>
  );
};
