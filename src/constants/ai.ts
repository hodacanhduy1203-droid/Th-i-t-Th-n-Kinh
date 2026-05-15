export const RECOMMENDED_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest"
];

const getInitialModel = () => {
  try {
    if (typeof localStorage === "undefined") return "gemini-3-flash-preview";
    const stored = localStorage.getItem("user_gemini_model");
    if (stored && RECOMMENDED_MODELS.includes(stored)) return stored;
  } catch {
    // Silence error
  }
  return "gemini-3-flash-preview";
};

export const GEMINI_MODEL = getInitialModel();
export const PRO_MODEL = "gemini-3.1-pro-preview";
