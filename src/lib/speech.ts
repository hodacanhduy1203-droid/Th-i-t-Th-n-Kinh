export const setupSpeechSynthesis = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Warm up voices
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
};

export const cancelSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const speakText = (
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (e: any) => void
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    alert("Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.");
    return;
  }

  cancelSpeech();

  // Clean text from markdown and html
  const plainText = text
    .replace(/#{1,6}\s?/g, '')
    .replace(/[*_`\[\]]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/(\r\n|\n|\r)/gm, ' ')
    .replace(/\((.*?)\)/g, '$1')
    .trim();

  // If text is empty, just end
  if (!plainText) {
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(plainText);

  // Fallback to getting voices directly if onvoiceschanged hasn't fired
  const voices = window.speechSynthesis.getVoices();
  const viVoice = voices.find((v) => v.lang.toLowerCase().includes("vi"));
  if (viVoice) {
    utterance.voice = viVoice;
  }
  
  utterance.lang = "vi-VN";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  utterance.onstart = () => {
    // Already called before speak, but can be a safety fallback
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.error("Speech Error:", e);
    onError?.(e);
    onEnd?.(); // Ensure UI resets
  };

  onStart?.(); // Instant UI feedback
  window.speechSynthesis.speak(utterance);
};
