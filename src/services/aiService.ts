import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "../constants/ai";

const MAX_RETRIES = 5;
const INITIAL_BACKOFF = 5000;

let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 1;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 15000; // Increased to 15 seconds to be safer for Pro model limits

// Simple request queue to avoid polling
const requestQueue: (() => void)[] = [];
let isCooldown = false;

async function waitForTurn() {
	return new Promise<void>((resolve) => {
		requestQueue.push(resolve);
		processQueue();
	});
}

function processQueue() {
	if (activeRequests >= MAX_CONCURRENT_REQUESTS || isCooldown) return;
	
	const now = Date.now();
	const timeSinceLast = now - lastRequestTime;
	
	if (timeSinceLast < MIN_REQUEST_INTERVAL) {
		const nextWait = MIN_REQUEST_INTERVAL - timeSinceLast;
		setTimeout(processQueue, nextWait);
		return;
	}

	const next = requestQueue.shift();
	if (next) {
		activeRequests++;
		lastRequestTime = Date.now();
		next();
	}
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 0): Promise<T> {
	if (retries === 0) {
		await waitForTurn();
	}

	try {
		lastRequestTime = Date.now(); // Update on every attempt
		return await fn();
	} catch (err: unknown) {
		const error = err as any;
		const message = error.message || "";
		const status = error.status || "";
		
		const isQuotaError = 
			message.includes("429") || 
			message.includes("RESOURCE_EXHAUSTED") ||
			message.includes("limit exceeded") ||
			message.includes("Resource has been exhausted") ||
			message.includes("Quota") ||
			String(status).includes("429");
			
		if (isQuotaError) {
			// If we hit a quota error, trigger a global cooldown for a bit
			if (!isCooldown) {
				isCooldown = true;
				console.warn("Global AI Cooldown initiated due to quota error.");
				setTimeout(() => {
					isCooldown = false;
					processQueue();
				}, 30000); // 30 second global pause on 429
			}

			if (retries < MAX_RETRIES) {
				const delay = INITIAL_BACKOFF * Math.pow(3, retries) + (Math.random() * 10000); 
				console.warn(`AI Quota exceeded. Retrying in ${Math.round(delay)}ms (attempt ${retries + 1}/${MAX_RETRIES})...`);
				await new Promise(resolve => setTimeout(resolve, delay));
				return callWithRetry(fn, retries + 1);
			}
			
			throw new Error("QUOTA_EXHAUSTED_AFTER_RETRIES");
		}
		
		throw err;
	} finally {
		if (retries === 0) {
			activeRequests = Math.max(0, activeRequests - 1);
			// Trigger next in queue after checking interval
			setTimeout(processQueue, 1000);
		}
	}
}

let cachedAI: GoogleGenAI | null = null;
let cachedKey = "";

export const getAI = (): GoogleGenAI => {
	// 1. Check for platform-provided key (most reliable in AI Studio Build)
	let apiKey = "";

	try {
		// Use process.env as standard in this environment
		apiKey = (process.env as any).GEMINI_API_KEY || "";
	} catch (e) {}

	// 2. Fallback to Vite env variables if not found
	if (!apiKey) {
		try {
			if (typeof import.meta !== "undefined" && "env" in import.meta) {
				apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
			}
		} catch (e) {}
	}

	// 3. User can override via localStorage (Settings)
	let userKey = "";
	try {
		userKey = (typeof localStorage !== "undefined" ? localStorage.getItem("user_gemini_key") : "") || "";
	} catch (e) {}

	if (userKey) {
		apiKey = userKey;
	}

	apiKey = (apiKey || "").trim();

	if (!apiKey) {
		throw new Error("API_KEY_MISSING");
	}

	if (cachedAI && cachedKey === apiKey) {
		return cachedAI;
	}

	const ai = new GoogleGenAI({ apiKey });

	// The @google/genai SDK does not use getGenerativeModel on the top level ai instance.
	// We wrap ai.models.generateContent and ai.models.generateContentStream directly.
	if ((ai as any).models) {
		const models = (ai as any).models;
		
		const genContent = models.generateContent;
		const originalGenerateContent = typeof genContent === 'function' ? genContent.bind(models) : null;
		if (originalGenerateContent) {
			models.generateContent = async (params: any) => {
				return callWithRetry(() => originalGenerateContent(params));
			};
		}

		const genContentStream = models.generateContentStream;
		const originalGenerateContentStream = typeof genContentStream === 'function' ? genContentStream.bind(models) : null;
		if (originalGenerateContentStream) {
			models.generateContentStream = async (params: any) => {
				return callWithRetry(() => originalGenerateContentStream(params));
			};
		}
	}

	cachedAI = ai;
	cachedKey = apiKey;
	return ai;
};

