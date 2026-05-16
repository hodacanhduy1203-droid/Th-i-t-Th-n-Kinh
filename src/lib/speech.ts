export const setupSpeechSynthesis = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Warm up voices
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
};

let currentChunks: string[] = [];
let currentChunkIndex = 0;
let globalEndCallback: (() => void) | undefined;
let globalErrorCallback: ((e: any) => void) | undefined;

export const cancelSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentChunks = [];
  currentChunkIndex = 0;
};

const speakNextChunk = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  if (currentChunkIndex >= currentChunks.length) {
    globalEndCallback?.();
    return;
  }

  const textChunk = currentChunks[currentChunkIndex];
  const utterance = new SpeechSynthesisUtterance(textChunk);

  const voices = window.speechSynthesis.getVoices();
  const viVoice = voices.find((v) => v.lang.toLowerCase().includes("vi"));
  if (viVoice) {
    utterance.voice = viVoice;
  }
  
  utterance.lang = "vi-VN";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  utterance.onend = () => {
    currentChunkIndex++;
    // Small delay between chunks to prevent clipping and allow garbage collection
    setTimeout(speakNextChunk, 50);
  };

  utterance.onerror = (e) => {
    console.error("Speech Error on chunk:", e);
    // Ignore interrupted errors, they happen on natural cancel
    if (e.error !== 'interrupted' && e.error !== 'canceled') {
        globalErrorCallback?.(e);
    }
    globalEndCallback?.(); // Ensure UI resets
    cancelSpeech();
  };

  window.speechSynthesis.speak(utterance);
}

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
    .replace(/\n\n/g, ' . ') // Ensure paragraphs have a pause
    .replace(/(\r\n|\n|\r)/gm, ' ')
    .replace(/\((.*?)\)/g, '$1')
    .trim();

  // If text is empty, just end
  if (!plainText) {
    onEnd?.();
    return;
  }

  // Split into chunks based on punctuation (. ! ?) to avoid the 15-second / length limit of SpeechSynthesis
  // We match sentences up to ~200 chars.
  const regex = /([^.!?]+[.!?]+)|([^.!?]+$)/g;
  const chunksMatch = plainText.match(regex);
  
  if (!chunksMatch) {
    currentChunks = [plainText];
  } else {
    currentChunks = chunksMatch.map(c => c.trim()).filter(c => c.length > 0);
  }

  currentChunkIndex = 0;
  globalEndCallback = onEnd;
  globalErrorCallback = onError;

  onStart?.(); // Instant UI feedback
  speakNextChunk();
};
