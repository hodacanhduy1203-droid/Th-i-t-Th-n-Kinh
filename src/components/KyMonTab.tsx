import { handleAIError } from "../utils/aiErrorHandler";
import { sanitizeApiContents } from "../utils/aiHelpers";
import React, { useState, useMemo, useEffect } from "react";
import {
  Shield,
  Sparkles,
  BrainCircuit,
  Hammer,
  Calendar,
  Info,
  Clock,
  Compass,
  RefreshCw,
  Play,
  Send,
  Copy,
  Check,
  MessageSquareShare,
  Mic,
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
import { GEMINI_MODEL, PRO_MODEL } from "../constants/ai";
import { Solar, Lunar } from "lunar-javascript";

const JIE_QI_VIET: Record<string, string> = {
  冬至: "Đông Chí",
  DONG_ZHI: "Đông Chí",
  小寒: "Tiểu Hàn",
  XIAO_HAN: "Tiểu Hàn",
  大寒: "Đại Hàn",
  DA_HAN: "Đại Hàn",
  立春: "Lập Xuân",
  LI_CHUN: "Lập Xuân",
  雨水: "Vũ Thủy",
  YU_SHUI: "Vũ Thủy",
  惊蛰: "Kinh Trập",
  JING_ZHE: "Kinh Trập",
  春分: "Xuân Phân",
  CHUN_FEN: "Xuân Phân",
  清明: "Thanh Minh",
  QING_MING: "Thanh Minh",
  谷雨: "Cốc Vũ",
  GU_YU: "Cốc Vũ",
  立夏: "Lập Hạ",
  LI_XIA: "Lập Hạ",
  小满: "Tiểu Mãn",
  XIAO_MAN: "Tiểu Mãn",
  芒种: "Mang Chủng",
  MANG_ZHONG: "Mang Chủng",
  芒種: "Mang Chủng",
  夏至: "Hạ Chí",
  XIA_ZHI: "Hạ Chí",
  小暑: "Tiểu Thử",
  XIAO_SHU: "Tiểu Thử",
  大暑: "Đại Thử",
  DA_SHU: "Đại Thử",
  立秋: "Lập Thu",
  LI_QIU: "Lập Thu",
  处暑: "Xử Thử",
  CHU_SHU: "Xử Thử",
  白露: "Bạch Lộ",
  BAI_LU: "Bạch Lộ",
  秋分: "Thu Phân",
  QIU_FEN: "Thu Phân",
  寒露: "Hàn Lộ",
  HAN_LU: "Hàn Lộ",
  霜降: "Sương Giáng",
  SHUANG_JIANG: "Sương Giáng",
  立冬: "Lập Đông",
  LI_DONG: "Lập Đông",
  小雪: "Tiểu Tuyết",
  XIAO_XUE: "Tiểu Tuyết",
  大雪: "Đại Tuyết",
  DA_XUE: "Đại Tuyết",
};

const GAN_VIET: Record<string, string> = {
  甲: "Giáp",
  乙: "Ất",
  丙: "Bính",
  丁: "Đinh",
  戊: "Mậu",
  己: "Kỷ",
  庚: "Canh",
  辛: "Tân",
  壬: "Nhâm",
  癸: "Quý",
};
const ZHI_VIET: Record<string, string> = {
  子: "Tý",
  丑: "Sửu",
  寅: "Dần",
  卯: "Mão",
  辰: "Thìn",
  巳: "Tỵ",
  午: "Ngọ",
  未: "Mùi",
  申: "Thân",
  酉: "Dậu",
  戌: "Tuất",
  亥: "Hợi",
};

const QIMEN_JU_MAP: Record<string, { type: "Yang" | "Yin"; ju: number[] }> = {
  "Đông Chí": { type: "Yang", ju: [1, 7, 4] },
  "Tiểu Hàn": { type: "Yang", ju: [2, 8, 5] },
  "Đại Hàn": { type: "Yang", ju: [3, 9, 6] },
  "Lập Xuân": { type: "Yang", ju: [8, 5, 2] },
  "Vũ Thủy": { type: "Yang", ju: [9, 6, 3] },
  "Kinh Trập": { type: "Yang", ju: [1, 7, 4] },
  "Xuân Phân": { type: "Yang", ju: [3, 9, 6] },
  "Thanh Minh": { type: "Yang", ju: [4, 1, 7] },
  "Cốc Vũ": { type: "Yang", ju: [5, 8, 2] },
  "Lập Hạ": { type: "Yang", ju: [4, 1, 7] },
  "Tiểu Mãn": { type: "Yang", ju: [5, 2, 8] },
  "Mang Chủng": { type: "Yang", ju: [6, 3, 9] },
  "Hạ Chí": { type: "Yin", ju: [9, 3, 6] },
  "Tiểu Thử": { type: "Yin", ju: [8, 2, 5] },
  "Đại Thử": { type: "Yin", ju: [7, 1, 4] },
  "Lập Thu": { type: "Yin", ju: [2, 5, 8] },
  "Xử Thử": { type: "Yin", ju: [1, 4, 7] },
  "Bạch Lộ": { type: "Yin", ju: [9, 3, 6] },
  "Thu Phân": { type: "Yin", ju: [7, 1, 4] },
  "Hàn Lộ": { type: "Yin", ju: [6, 9, 3] },
  "Sương Giáng": { type: "Yin", ju: [5, 8, 2] },
  "Lập Đông": { type: "Yin", ju: [6, 9, 3] },
  "Tiểu Tuyết": { type: "Yin", ju: [5, 8, 2] },
  "Đại Tuyết": { type: "Yin", ju: [4, 7, 1] },
};

const SAN_QI_LIU_YI = [
  "Mậu",
  "Kỷ",
  "Canh",
  "Tân",
  "Nhâm",
  "Quý",
  "Đinh",
  "Bính",
  "Ất",
];
const JIU_XING_DEFAULT: Record<number, string> = {
  1: "T.Bồng",
  2: "T.Nhuế",
  3: "T.Xung",
  4: "T.Phụ",
  5: "T.Cầm",
  6: "T.Tâm",
  7: "T.Trụ",
  8: "T.Nhậm",
  9: "T.Anh",
};
const BA_MEN_DEFAULT: Record<number, string> = {
  1: "Hưu",
  2: "Tử",
  3: "Thương",
  4: "Đỗ",
  5: "---",
  6: "Khai",
  7: "Kinh",
  8: "Sinh",
  9: "Cảnh",
};

const GRID_DISPLAY_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];

const XUN_SHOU_MAP: Record<string, string> = {
  GiápTý: "Mậu",
  GiápTuất: "Kỷ",
  GiápThân: "Canh",
  GiápNgọ: "Tân",
  GiápThìn: "Nhâm",
  GiápDần: "Quý",
};

const GANS = [
  "Giáp",
  "Ất",
  "Bính",
  "Đinh",
  "Mậu",
  "Kỷ",
  "Canh",
  "Tân",
  "Nhâm",
  "Quý",
];
const ZHIS = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
];

const GAN_CHI_60 = Array.from(
  { length: 60 },
  (_, i) => GANS[i % 10] + ZHIS[i % 12],
);

const getXunShou = (can: string, zhi: string) => {
  const bazi = can + zhi;
  const idx = GAN_CHI_60.indexOf(bazi);
  if (idx === -1) return "GiápTý";
  const xunIdx = Math.floor(idx / 10) * 10;
  return GAN_CHI_60[xunIdx];
};

interface Props {
  onRequireApiKey?: () => void;
}

export default function KyMonTab({ onRequireApiKey }: Props) {
  const { t } = useLanguage();
  const [kyMonQuestion, setKyMonQuestion] = useState("");
  const [interimKyMonQuestion, setInterimKyMonQuestion] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [kyMonChat, setKyMonChat] = useState<
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

    speakTextHelper(
      text,
      () => setSpeakingIndex(index),
      () => setSpeakingIndex(null),
      () => setSpeakingIndex(null)
    );
  };

  useEffect(() => {
    if (chatEndRef.current && kyMonChat.length > 0) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [kyMonChat]);

  const getLocalISOString = (date: Date) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const [selectedDate, setSelectedDate] = useState(() =>
    getLocalISOString(new Date()),
  );
  const [isAutoTime, setIsAutoTime] = useState(true);

  useEffect(() => {
    if (!isAutoTime) return;
    const timer = setInterval(() => {
      setSelectedDate(getLocalISOString(new Date()));
    }, 15000);
    return () => clearInterval(timer);
  }, [isAutoTime]);

  const qmdgData = useMemo(() => {
    const now = new Date(selectedDate);
    const solar = Solar.fromDate(now);
    const lunar = Lunar.fromSolar(solar);
    const eightChar = lunar.getEightChar();

    const hCanRaw = eightChar.getTimeGan();
    const hZhiRaw = eightChar.getTimeZhi();
    const hourCan = GAN_VIET[hCanRaw] || hCanRaw;
    const hourZhi = ZHI_VIET[hZhiRaw] || hZhiRaw;
    const hourBazi = `${hourCan}${hourZhi}`;

    const dayCanRaw = eightChar.getDayGan();
    const dayZhiRaw = eightChar.getDayZhi();
    const dayCan = GAN_VIET[dayCanRaw] || dayCanRaw;
    const dayZhi = ZHI_VIET[dayZhiRaw] || dayZhiRaw;
    const dayBazi = `${dayCan}${dayZhi}`;

    const jieQiTable = lunar.getJieQiTable();
    let currentJieQi = "";
    let latestJieDate = new Date(0);

    Object.entries(jieQiTable).forEach(([name, time]) => {
      const vietName = JIE_QI_VIET[name];
      if (vietName && QIMEN_JU_MAP[vietName]) {
        const jieDate = new Date(
          (time as any).getYear(),
          (time as any).getMonth() - 1,
          (time as any).getDay(),
          (time as any).getHour(),
          (time as any).getMinute(),
          (time as any).getSecond(),
        );
        if (jieDate <= now && jieDate > latestJieDate) {
          latestJieDate = jieDate;
          currentJieQi = vietName;
        }
      }
    });

    if (!currentJieQi) currentJieQi = "Đông Chí";
    const jieQi = currentJieQi;

    let yuanIdx = 0;
    if (["Tý", "Ngọ", "Mão", "Dậu"].includes(dayZhi)) yuanIdx = 0;
    else if (["Dần", "Thân", "Tỵ", "Hợi"].includes(dayZhi)) yuanIdx = 1;
    else yuanIdx = 2;

    const yuanName = yuanIdx === 0 ? "Thượng" : yuanIdx === 1 ? "Trung" : "Hạ";
    const type = QIMEN_JU_MAP[jieQi]?.type || "Yang";
    const ju = QIMEN_JU_MAP[jieQi]?.ju[yuanIdx] || 1;

    const diaBan: Record<number, string> = {};
    for (let i = 0; i < 9; i++) {
      const can = SAN_QI_LIU_YI[i];
      let pos;
      if (type === "Yang") {
        pos = ((ju + i - 1) % 9) + 1;
      } else {
        pos = ((ju - i - 1 + 18) % 9) + 1;
      }
      diaBan[pos] = can;
    }

    const xunShouBazi = getXunShou(hourCan, hourZhi);
    const xunShouCan = XUN_SHOU_MAP[xunShouBazi];

    let xunShouPos = 1;
    for (let p = 1; p <= 9; p++) {
      if (diaBan[p] === xunShouCan) {
        xunShouPos = p;
        break;
      }
    }

    const originPosForStar = xunShouPos === 5 ? 2 : xunShouPos;
    const zhiFuStarIdentity = JIU_XING_DEFAULT[originPosForStar];
    const zhiShiGateIdentity = BA_MEN_DEFAULT[originPosForStar];

    const STAR_HOUSES = [1, 8, 3, 4, 9, 2, 7, 6];
    const thienBan: Record<number, string> = {};
    const cuuTinh: Record<number, string> = {};

    let hourCanGroundPos = 1;
    for (let p = 1; p <= 9; p++) {
      if (diaBan[p] === hourCan) {
        hourCanGroundPos = p;
        break;
      }
    }
    if (hourCan === "Giáp") {
      hourCanGroundPos = xunShouPos;
    }

    const targetStarPos = hourCanGroundPos === 5 ? 2 : hourCanGroundPos;
    const startIdx = STAR_HOUSES.indexOf(originPosForStar);
    const endIdx = STAR_HOUSES.indexOf(targetStarPos);

    if (startIdx !== -1 && endIdx !== -1) {
      const offset = (endIdx - startIdx + 8) % 8;
      STAR_HOUSES.forEach((p, i) => {
        const sourceP = STAR_HOUSES[(i - offset + 8) % 8];
        cuuTinh[p] = JIU_XING_DEFAULT[sourceP];
        thienBan[p] = diaBan[sourceP];
      });
    } else {
      STAR_HOUSES.forEach((p) => {
        cuuTinh[p] = JIU_XING_DEFAULT[p];
        thienBan[p] = diaBan[p];
      });
    }
    thienBan[5] = diaBan[5];
    cuuTinh[5] = JIU_XING_DEFAULT[5];

    const xunZhi = xunShouBazi.substring(4);
    const xunZhiIdx = ZHIS.indexOf(xunZhi);
    const hZhiIdx = ZHIS.indexOf(hourZhi);
    const hourSteps = (hZhiIdx - xunZhiIdx + 12) % 12;

    let zhiShiPos = xunShouPos;
    for (let s = 0; s < hourSteps; s++) {
      if (type === "Yang") {
        zhiShiPos++;
        if (zhiShiPos > 9) zhiShiPos = 1;
      } else {
        zhiShiPos--;
        if (zhiShiPos < 1) zhiShiPos = 9;
      }
    }
    const finalGatePos =
      zhiShiPos === 5 ? (type === "Yang" ? 2 : 8) : zhiShiPos;

    const batMon: Record<number, string> = {};
    const gStartIdx = STAR_HOUSES.indexOf(originPosForStar);
    const gEndIdx = STAR_HOUSES.indexOf(finalGatePos);

    if (gStartIdx !== -1 && gEndIdx !== -1) {
      const offset = (gEndIdx - gStartIdx + 8) % 8;
      STAR_HOUSES.forEach((p, i) => {
        const sourceP = STAR_HOUSES[(i - offset + 8) % 8];
        batMon[p] = BA_MEN_DEFAULT[sourceP];
      });
    } else {
      STAR_HOUSES.forEach((p) => (batMon[p] = BA_MEN_DEFAULT[p]));
    }

    const batThan: Record<number, string> = {};
    const thanOrder = ["T.Phù", "Xà", "Âm", "Hợp", "Hổ", "Vũ", "Địa", "Thiên"];
    const tStartIdx = STAR_HOUSES.indexOf(targetStarPos);

    if (tStartIdx !== -1) {
      STAR_HOUSES.forEach((p, i) => {
        const pIdx = STAR_HOUSES.indexOf(p);
        let thanIdx;
        if (type === "Yang") thanIdx = (pIdx - tStartIdx + 8) % 8;
        else thanIdx = (tStartIdx - pIdx + 8) % 8;
        batThan[p] = thanOrder[thanIdx];
      });
    }

    return {
      lunar,
      solar,
      eightChar,
      jieQi,
      type,
      ju,
      xunShou: xunShouBazi,
      zhiFu: zhiFuStarIdentity,
      zhiShi: zhiShiGateIdentity,
      diaBan,
      thienBan,
      cuuTinh,
      batMon,
      batThan,
      now,
      hourBazi,
      dayBazi,
      yuanName,
    };
  }, [selectedDate]);

  const handleAnalyze = async (customQuestion?: string) => {
    const questionToUse = customQuestion || kyMonQuestion;
    if (!questionToUse.trim() || isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const systemInstruction = `Bạn là một chuyên gia uyên bác về **Kỳ Môn Độn Giáp**. 

**QUY TẮC LAYOUT BẮT BUỘC (RẤT QUAN TRỌNG):**
- Toàn bộ nội dung trả lời phải TRÀN VIỀN TỐI ĐA, không có lề trái-phải (margin: 0).
- LUÔN bọc phần nội dung chính trong khối HTML sau:
  <div class="m-0 py-1 px-0.5 w-full box-border text-[#451a03] text-[12.5px] leading-relaxed font-sans">
- Dùng bullet, bảng cực kỳ ngắn gọn để tiết kiệm diện tích bề ngang.

**THÔNG TIN BÀN KỲ MÔN:** 
- THỜI ĐIỂM: ${qmdgData.now.toLocaleString()} (Giờ ${qmdgData.hourBazi} - Ngày ${qmdgData.dayBazi})
- TIẾT KHÍ: ${qmdgData.jieQi}
- ĐỘN: ${qmdgData.type === "Yang" ? "Dương" : "Âm"} ${qmdgData.yuanName} ${qmdgData.ju} Cục
- TUẦN THỦ: ${qmdgData.xunShou} 
- TRỰC PHÙ: ${qmdgData.zhiFu} 
- TRỰC SỬ: ${qmdgData.zhiShi}

**YÊU CẦU NỘI DUNG:**
1. Hãy xuất kết quả phân tích thật chi tiết, có tâm, logic và có cấu trúc rõ ràng.
2. Luận giải dùng thuật ngữ chuyên môn: Dụng Thần, Hưu, Sinh, Khai, Cảnh, Tử, Kinh, Đỗ, Thương, Trực Phù, Trực Sử...
3. Ngôn ngữ: Trang nghiêm, chân thực, uyên bác. Luôn kết thúc bằng việc nhắc nhở về sự linh hoạt và đức độ của con người (Dịch lý tùy thời).</div>`;

      const userPrompt = questionToUse;

      const apiContents = sanitizeApiContents(kyMonChat, userPrompt);

      setKyMonChat((prev) => [
        ...prev,
        { role: "user", text: userPrompt },
        { role: "model", text: "" },
      ]);
      setKyMonQuestion("");
      setInterimKyMonQuestion("");

      const aiInstance = getAI();
      const stream = await aiInstance.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: apiContents,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      let fullResp = "";
      let lastUpdate = Date.now();
      for await (const chunk of stream) {
        fullResp += chunk.text || "";
        if (Date.now() - lastUpdate > 50) {
          setKyMonChat((prev) => {
            if (prev.length === 0) return prev;
            const newChat = [...prev];
            newChat[newChat.length - 1] = {
              ...newChat[newChat.length - 1],
              text: fullResp,
            };
            return newChat;
          });
          lastUpdate = Date.now();
        }
      }
      // final update
      setKyMonChat((prev) => {
        if (prev.length === 0) return prev;
        const newChat = [...prev];
        newChat[newChat.length - 1] = {
          ...newChat[newChat.length - 1],
          text: fullResp,
        };
        return newChat;
      });
    } catch (error: any) {
      console.error("Qi Men AI Analysis Error:", error);
      const errorMsg = handleAIError(error);
      if (
        errorMsg.includes("API Key") ||
        errorMsg.includes("Quota") ||
        error?.message === "API_KEY_MISSING"
      ) {
        if (onRequireApiKey) onRequireApiKey();
      }
      setKyMonChat((prev) => {
        if (prev.length === 0) return prev;
        const newChat = [...prev];
        newChat[newChat.length - 1] = {
          ...newChat[newChat.length - 1],
          text: errorMsg,
        };
        return newChat;
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-full mx-auto gap-4 animate-in fade-in duration-700">
      {/* Header Banner */}
      <div className="bg-[#fcf8f1] rounded-3xl p-1.5 sm:p-4 shadow-xl border border-amber-100 flex flex-col sm:flex-row justify-between items-center gap-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-200/10 rounded-full blur-3xl opacity-50" />
        <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center shrink-0 shadow-inner">
            <Shield className="w-7 h-7 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-amber-950 tracking-tight leading-tight uppercase font-serif">
              Kỳ Môn Độn Giáp
            </h2>
            <p className="text-amber-800/40 text-xs flex items-center gap-2 mt-0.5 truncate uppercase tracking-widest font-black">
              <Compass className="w-3 h-3 text-amber-500/60" /> Bát Trận Chi Đồ
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 relative z-10 w-full sm:w-auto justify-center sm:justify-end">
          <div className="px-3 py-2 bg-white rounded-xl border border-amber-100 flex items-center gap-2 w-full sm:w-auto justify-center shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-600/50" />
            <input
              type="datetime-local"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setIsAutoTime(false);
              }}
              className="text-xs font-bold text-amber-900 bg-transparent outline-none cursor-pointer font-mono"
            />
          </div>
          <div className="px-3 py-2 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3 w-full sm:w-auto justify-center min-w-[140px] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-amber-700 uppercase leading-tight">
                {qmdgData.jieQi}
              </span>
              <span className="text-[9px] font-bold text-amber-800/40 uppercase leading-tight tracking-tighter">
                {qmdgData.type === "Yang" ? "Dương" : "Âm"} {qmdgData.yuanName}{" "}
                {qmdgData.ju} Cục
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-2">
        <div className="space-y-6">
          <div className="bg-[#fefaf3] rounded-3xl p-2 sm:p-6 shadow-xl border border-amber-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="grid grid-cols-3 gap-2 sm:gap-4 aspect-square w-full max-w-[450px] sm:max-w-[360px] md:max-w-[320px] mx-auto relative z-10">
              {GRID_DISPLAY_ORDER.map((pos) => (
                <div
                  key={pos}
                  className="bg-white/90 backdrop-blur-sm border border-amber-200 rounded-2xl p-2 sm:p-3 flex flex-col justify-between hover:bg-amber-50 transition-all duration-300 group shadow-md ring-1 ring-amber-200"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[8px] sm:text-[9px] font-bold text-amber-900/60 font-mono tracking-tighter">
                      {pos}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-black text-amber-900/60 uppercase tracking-widest leading-none">
                      {pos === 1
                        ? "Khảm"
                        : pos === 2
                          ? "Khôn"
                          : pos === 3
                            ? "Chấn"
                            : pos === 4
                              ? "Tốn"
                              : pos === 9
                                ? "Ly"
                                : pos === 7
                                  ? "Đoài"
                                  : pos === 6
                                    ? "Càn"
                                    : pos === 8
                                      ? "Cấn"
                                      : "Trung"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5 relative">
                    <span className="text-[10px] sm:text-[11px] font-black text-amber-800 uppercase tracking-widest h-3.5 mb-1 text-center scale-90 sm:scale-100 drop-shadow-sm">
                      {qmdgData.batThan[pos] || "---"}
                    </span>

                    <div className="flex items-center justify-center w-full px-5 sm:px-7 relative">
                      <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 flex items-center justify-center w-8">
                        <span className="text-[10px] sm:text-[11px] font-black text-amber-900/60 rotate-[-90deg] origin-center whitespace-nowrap uppercase tracking-tighter">
                          {qmdgData.cuuTinh[pos] || "---"}
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-0 min-w-[28px]">
                        <span className="text-xl sm:text-2xl font-black text-black leading-none drop-shadow-sm font-serif">
                          {qmdgData.thienBan[pos] || "---"}
                        </span>
                        <div className="w-6 h-[1px] bg-amber-200 my-1" />
                        <span className="text-[14px] sm:text-[15px] font-black text-amber-800/70 font-serif lowercase">
                          {qmdgData.diaBan[pos]}
                        </span>
                      </div>

                      <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 flex items-center justify-center w-8">
                        <span className="text-[10px] sm:text-[11px] font-black text-emerald-700 rotate-[90deg] origin-center whitespace-nowrap uppercase tracking-tighter">
                          {qmdgData.batMon[pos] || "---"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[640px] mx-auto">
              {[
                { l: "Trực Phù", v: qmdgData.zhiFu },
                { l: "Trực Sử", v: qmdgData.zhiShi },
                { l: "Ngày", v: qmdgData.dayBazi },
                { l: "Tuần Thủ", v: qmdgData.xunShou },
              ].map((i, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-2xl border border-amber-100 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-all"
                >
                  <span className="text-[8px] font-bold text-amber-900/40 uppercase tracking-widest leading-none mb-1.5">
                    {i.l}
                  </span>
                  <span className="text-[14px] font-black text-amber-950 font-serif">
                    {i.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="bg-[#f7f1e6] rounded-2xl p-1 shadow-xl border border-amber-200 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />

          <div className="bg-[#fffcf0] rounded-3xl border border-orange-200/50 overflow-hidden shadow-sm flex flex-col h-full min-h-[400px]">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3 px-1 text-left">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-100 p-1.5 rounded-xl shadow-sm">
                    <BrainCircuit className="w-4 h-4 text-orange-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[12px] sm:text-sm text-orange-950 uppercase tracking-widest leading-none">
                      Luận Giải Kỳ Môn AI
                    </h3>
                    <p className="text-[9px] text-orange-800/60 uppercase font-bold tracking-widest opacity-60">
                      Cát hung & Mưu sự
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 text-white rounded-xl text-[11px] font-black uppercase hover:bg-orange-800 disabled:opacity-50 transition-all shadow-md shadow-orange-200 active:scale-95"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {kyMonChat.length > 0 ? "Cập Nhật" : "Phân Tích"}
                </button>
              </div>

              <div className="flex flex-col gap-2 mb-3 px-1">
                <div className="relative md:col-span-1">
                  <select
                    className="w-full bg-white border border-orange-100 text-orange-950 rounded-xl p-2.5 text-[11px] font-bold outline-none focus:ring-4 focus:ring-orange-500/5 transition-all cursor-pointer shadow-sm appearance-none"
                    onChange={(e) => {
                      if (e.target.value) {
                        setKyMonQuestion(e.target.value);
                      }
                    }}
                    value=""
                  >
                    <option value="" disabled>
                      Chọn việc cần xem...
                    </option>
                    <option value="Cầu tài, làm ăn, kinh doanh">
                      Cầu tài, làm ăn, kinh doanh
                    </option>
                    <option value="Xuất hành, đi xa, chuyển nhà">
                      Xuất hành, đi xa, chuyển nhà
                    </option>
                    <option value="Hôn nhân, tình cảm">
                      Hôn nhân, tình cảm
                    </option>
                    <option value="Thi cử, thi tuyển, tranh đấu">
                      Thi cử, thi tuyển, tranh đấu
                    </option>
                    <option value="Bệnh tật, chữa bệnh">
                      Bệnh tật, chữa bệnh
                    </option>
                    <option value="Kiện tụng, tranh chấp">
                      Kiện tụng, tranh chấp
                    </option>
                    <option value="Chọn hướng nhà, hướng bàn làm việc">
                      Chọn hướng nhà, hướng bàn làm việc
                    </option>
                    <option value="Chọn ngày giờ làm việc lớn">
                      Chọn ngày giờ làm việc lớn
                    </option>
                  </select>
                </div>

              </div>

              {(kyMonChat.length > 0 || isAnalyzing) && (
                <div className="overflow-y-auto max-h-[600px] space-y-3 rounded-xl bg-transparent p-1 custom-scrollbar select-text">
                  {kyMonChat.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} w-full animate-in fade-in duration-200`}
                    >
                      {msg.role === "user" ? (
                        <div className="relative group max-w-[92%] mb-1 select-text">
                          <div className="bg-[#4a1d12] text-white border border-orange-900/10 px-3 py-2 rounded-2xl rounded-tr-none text-[12px] font-medium shadow-md leading-relaxed">
                            {msg.text}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.text);
                              setCopiedIndex(idx);
                              setTimeout(() => setCopiedIndex(null), 2000);
                            }}
                            className="absolute -top-1 -left-1 p-0.5 text-orange-200 hover:text-white bg-orange-900 rounded border border-orange-100 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"
                            title="Sao chép câu hỏi"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="bg-transparent text-amber-950 p-0.5 rounded-lg rounded-tl-none w-full prose prose-stone max-w-none text-[14px] leading-[1.6] markdown-body relative group mb-2 select-text">
                          {msg.text && (
                            <div className="absolute top-0.5 right-0.5 flex items-center gap-1 transition-all z-10">
                              <button
                                onClick={() => speakText(msg.text, idx)}
                                className={`p-1 rounded border transition-all shadow-sm ${speakingIndex === idx ? "bg-orange-100 text-orange-600 border-orange-200" : "bg-orange-50/80 text-orange-400 hover:text-orange-700 border-orange-100"}`}
                                title={
                                  speakingIndex === idx
                                    ? "Dừng đọc"
                                    : "Đọc văn bản"
                                }
                              >
                                {speakingIndex === idx ? (
                                  <Square className="w-3 h-3 fill-current" />
                                ) : (
                                  <Volume2 className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.text);
                                  setCopiedIndex(idx);
                                  setTimeout(() => setCopiedIndex(null), 2000);
                                }}
                                className="p-1 bg-orange-50/80 text-orange-400 hover:text-orange-700 rounded border border-orange-100 shadow-sm transition-all"
                                title="Sao chép"
                              >
                                {copiedIndex === idx ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {msg.text ? (
                            <Markdown
                              rehypePlugins={[rehypeRaw]}
                              remarkPlugins={[remarkGfm]}
                            >
                              {msg.text}
                            </Markdown>
                          ) : (
                            <div className="flex gap-1.5 items-center h-5">
                              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                            </div>
                          )}
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
                    className="w-full px-4 py-3 bg-white border border-orange-100 rounded-2xl text-[13px] font-medium focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/5 min-h-[44px] max-h-[120px] resize-none shadow-sm transition-all disabled:opacity-50 placeholder:text-orange-900/20"
                    placeholder="Hỏi AI về cát hung, mưu sự..."
                    value={
                      kyMonQuestion +
                      (interimKyMonQuestion
                        ? (kyMonQuestion ? " " : "") + interimKyMonQuestion
                        : "")
                    }
                    onChange={(e) => setKyMonQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (
                          (kyMonQuestion.trim() ||
                            interimKyMonQuestion.trim()) &&
                          !isAnalyzing
                        ) {
                          handleAnalyze(
                            kyMonQuestion +
                              (interimKyMonQuestion
                                ? " " + interimKyMonQuestion
                                : ""),
                          );
                        }
                      }
                    }}
                  />
                  <div className="flex items-center justify-between mt-2 px-1">
                    <VoiceInput
                      onResult={(text, isFinal) => {
                        if (isFinal) {
                          setKyMonQuestion((prev) =>
                            prev ? prev + " " + text : text,
                          );
                          setInterimKyMonQuestion("");
                        } else {
                          setInterimKyMonQuestion(text);
                        }
                      }}
                      className="p-2.5 bg-orange-50 text-orange-700 rounded-xl shadow-sm hover:bg-orange-100 border border-orange-100 transition-all active:scale-90"
                      iconSize={18}
                    />
                    <button
                      onClick={() =>
                        handleAnalyze(
                          kyMonQuestion +
                            (interimKyMonQuestion
                              ? " " + interimKyMonQuestion
                              : ""),
                        )
                      }
                      disabled={
                        isAnalyzing ||
                        (!kyMonQuestion.trim() && !interimKyMonQuestion.trim())
                      }
                      className="flex items-center gap-2 px-6 py-2.5 bg-orange-800 text-white rounded-xl shadow-lg shadow-orange-100 hover:bg-orange-950 transition-all active:scale-90 disabled:opacity-30 text-xs font-black uppercase tracking-wider"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Gửi câu hỏi
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
