export const handleAIError = (error: unknown): string => {
    // If it's already a string, check for common patterns
    let errorStr = "";
    if (typeof error === 'string') {
        errorStr = error;
    } else if (error instanceof Error) {
        try {
            const altError: Record<string, unknown> = {};
            for (const prop of Object.getOwnPropertyNames(error)) {
                altError[prop] = (error as any)[prop];
            }
            errorStr = JSON.stringify(altError);
        } catch {
            errorStr = String(error);
        }
    } else {
        try {
            errorStr = JSON.stringify(error);
        } catch {
            errorStr = String(error);
        }
    }
    
    const errObj = error as any;
    const message = errObj?.message || "";
    const status = String(errObj?.status || "").toLowerCase();
    const rawErrorString = `${errorStr} ${message} ${status}`.toLowerCase();

    // 1. QUOTA EXCEEDED (429)
    if (
        rawErrorString.includes("429") || 
        rawErrorString.includes("quota") || 
        rawErrorString.includes("resource_exhausted") || 
        rawErrorString.includes("too many requests") ||
        status.includes("429") ||
        status.includes("resource_exhausted")
    ) {
        return "⚠️ HỆ THỐNG AI ĐÃ HẾT LƯỢT DÙNG (Quota Exceeded).\n\n" +
               "Lượt dùng miễn phí hàng ngày đã hết. Để tiếp tục sử dụng ngay lập tức, bạn có thể tự thiết lập mã API Key cá nhân (Miễn phí từ Google):\n\n" +
               "1. Nhấn vào icon Cài Đặt (⚙️) ở góc màn hình.\n" +
               "2. Truy cập: https://aistudio.google.com/app/apikey để lấy mã.\n" +
               "3. Dán mã API Key của bạn vào phần 'Secrets' hoặc 'API Key' trong menu Settings.\n\n" +
               "Hoặc bạn có thể quay lại vào ngày mai khi lượt dùng được làm mới.";
    }

    // Attempt to parse JSON if the error is a stringified JSON (common with SDK errors)
    let errMsg = message || errorStr;
    try {
        if (typeof errMsg === "string" && (errMsg.includes('{"error"') || errMsg.includes('{"code"'))) {
            const startIndex = errMsg.indexOf('{');
            const possibleJson = errMsg.substring(startIndex);
            try {
                const parsed = JSON.parse(possibleJson);
                if (parsed.error && parsed.error.message) {
                    errMsg = parsed.error.message;
                } else if (parsed.message) {
                    errMsg = parsed.message;
                }
            } catch (e) {
                // Not valid JSON or failed to parse, try regex
                const match = errMsg.match(/{"error":\s*{[^}]*}}/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    if (parsed.error && parsed.error.message) {
                        errMsg = parsed.error.message;
                    }
                }
            }
        }
    } catch {
        // Not valid JSON or failed to parse, try regex
    }

    const lowerErr = String(errMsg).toLowerCase();

    // 2. MISSING API KEY
    if (lowerErr.includes("api_key_missing") || lowerErr.includes("missing api key") || lowerErr.includes("thiếu mã api key")) {
        return "⚠️ THIẾU MÃ API KEY.\n\nVui lòng thiết lập Gemini API Key trong phần Cài Đặt (Settings) để bắt đầu sử dụng tính năng AI.";
    }

    // 3. INVALID API KEY
    if (lowerErr.includes("api key not found") || lowerErr.includes("api_key_invalid") || lowerErr.includes("invalid api key") || lowerErr.includes("400")) {
        if (lowerErr.includes("api key") || lowerErr.includes("apikey")) {
          return "⚠️ MÃ API KEY KHÔNG HỢP LỆ.\n\nMã API Key bạn cung cấp không đúng hoặc đã bị vô hiệu hóa. Vui lòng kiểm tra lại trong phần Cài Đặt.";
        }
    }

    // 4. SAFETY FILTERS
    if (lowerErr.includes("safety") || lowerErr.includes("blocked") || lowerErr.includes("finish_reason_safety")) {
        return "⚠️ NỘI DUNG BỊ CHẶN.\n\nAI từ chối trả lời vì câu hỏi hoặc kết quả vi phạm chính sách an toàn (có thể chứa nội dung nhạy cảm). Vui lòng thử hỏi câu khác.";
    }

    // 5. NETWORK / SERVER ERROR
    if (lowerErr.includes("fetch") || lowerErr.includes("network") || lowerErr.includes("server error") || lowerErr.includes("500") || lowerErr.includes("overloaded") || lowerErr.includes("503")) {
        return "⚠️ LỖI KẾT NỐI AI.\n\nKhông thể kết nối tới máy chủ AI hoặc hệ thống đang quá tải. Vui lòng kiểm tra mạng hoặc thử lại sau vài phút.";
    }

    // DEFAULT
    return `⚠️ LỖI HỆ THỐNG AI:\n${errMsg || "Đã có lỗi không xác định xảy ra khi gọi AI."}`;
};

