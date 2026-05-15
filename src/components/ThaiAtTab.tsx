import React, { useState, useEffect, useMemo, useRef, Fragment } from "react";
import { setupSpeechSynthesis, cancelSpeech, speakText as speakTextHelper } from '../lib/speech';
import { sanitizeApiContents } from "../utils/aiHelpers";
import {
  Compass,
  Sparkles,
  Search,
  Shield,
  AlertTriangle,
  Crosshair,
  Star,
  Download,
  Image as ImageIcon,
  Book,
  MessageSquare,
  Cpu,
  Loader2,
  Send,
  BrainCircuit,
  Mic,
  Check,
  Copy,
  Volume2,
  Square,
} from "lucide-react";
import { toPng, toCanvas } from "html-to-image";
import { jsPDF } from "jspdf";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ThaiAtEngine } from "../services/thaiAt/engine";
import { ThaiAtInput } from "../services/thaiAt/types";
import { THAI_AT_16_PALACES, BAT_MON_INFO } from "../services/thaiAt/constants";
import { Solar } from "lunar-javascript";
import { getAI } from "../services/aiService";
import { GEMINI_MODEL } from "../constants/ai";
import { handleAIError } from "../utils/aiErrorHandler";
import { VoiceInput } from "./VoiceInput";

interface ThaiAtTabProps {
  date: { day: string; month: string; year: string } | null;
  lunarInfo: any;
  onRequireApiKey?: () => void;
}

export const ThaiAtTab: React.FC<ThaiAtTabProps> = ({ date, lunarInfo, onRequireApiKey }) => {
  const [fullName, setFullName] = useState("");

  const [inputDay, setInputDay] = useState("");
  const [inputMonth, setInputMonth] = useState("");
  const [inputYear, setInputYear] = useState("");

  useEffect(() => {
    if (date) {
      setInputDay(date.day);
      setInputMonth(date.month);
      setInputYear(date.year);
    }
  }, [date]);

  const [birthTime, setBirthTime] = useState(""); // Default empty instead of '0'
  const [gender, setGender] = useState<"nam" | "nu">("nam"); // 'nam' hoặc 'nu'
  const [selectedCung, setSelectedCung] = useState<string | null>(null);
  const [thaiAtChat, setThaiAtChat] = useState<
    { role: "user" | "model"; text: string }[]
  >([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [interimQuestion, setInterimQuestion] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current && thaiAtChat.length > 0) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [thaiAtChat]);

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

  const generateAIInterpretation = async (customQuestion?: string) => {
    if (!thaiAtChart || isAiLoading) return;

    setIsAiLoading(true);

    try {
      const isNoDate = !inputYear || !inputMonth || !inputDay;
      const currentYear = new Date().getFullYear();
      const systemInstruction = `Bạn là **Đại Tông Sư Thái Ất Thần Kinh**, thông thạo bộ "Thái Ất Thần Kinh" của Nguyễn Hồng Quang, "Huyền Phạm Tiết Yếu" của Trạng Trình Nguyễn Bỉnh Khiêm, và các bí điển Đạo gia, Phật giáo Mật Tông Tây Tạng (chân ngôn, thủ ấn), Phong Thủy, Kỳ Môn Độn Giáp, Lục Nhâm. 

**NẾU NGƯỜI DÙNG YÊU CẦU LUẬN GIẢI LÁ SỐ HOẶC HỎI VẬN HẠN DỰA TRÊN THÁI ẤT:**
- TUYỆT ĐỐI KHÔNG trả lời chung chung "tốt hay xấu", hay khuyên "cần cố gắng". Hãy LUẬN ĐOÁN THẦN TỐC VÀ CHÍNH XÁC NHƯ MỘT CHIÊM TINH GIA LÃO LUYỆN. Phải chỉ thẳng vào sự thật, Cát thì Cát ở đâu, Hung thì tai họa gì, mốc thời gian nào ứng nghiệm.
- **Phân Tích Cục Diện Chủ - Khách:** Đánh giá toán số của Chủ Tướng (Chủ Toán, Chủ Đại/Tham Tướng) và Khách Tướng. Áp dụng quy luật tương sinh tương khắc Ngũ Hành của các cung để định thắng bại. Diễn dịch Chủ-Khách vào ngữ cảnh đời sống: trong công việc (Đồng nghiệp vs Bản thân), thương trường (Đối thủ vs Công ty), tình cảm (Đối Tác vs Mình).
- **Vị Trí Thái Ất (Vua):** Thái Ất đóng cung nào? Có lâm vào các thế hung hiểm như Bách (Bức bách), Nghịch (Phản loạn), Tù, Yểm hay không? Vua sáng hay Vua tối? Cung Thái Ất tọa có khắc hay sinh Tướng không? Điều này sẽ ấn định Vận số Quốc gia hay Cục diện Sinh Tử của người hỏi.
- **Thập Lục Thần Sát:** Đi sâu vào ảnh hưởng của các sao như Thủy Kích (chiến tranh, thị phi), Thái Âm (mưu ám), Đại Du, Kế Đô, Thiên Mục chiếu mệnh. Kết hợp sự đóng cung của vòng Đại Vận.
- **Vận Số Kinh Tế / Quốc Vận:** Phải áp dụng học thuyết Âm Lục, Dương Cửu, Ách Khí. Dự đoán biến động kinh tế thời cuộc. Văn phong đanh thép, hùng tráng như đang họa định giang sơn.
- **Hóa Giải & Lời Khuyên Tu Tập:** Dựa trên các yếu tố hung hiểm đã tìm thấy, hãy đưa ra các phương pháp hóa giải cụ thể (về phong thủy, hành vi, hoặc các nghi lễ tâm linh). Đặc biệt, hãy đưa ra lời khuyên tu tập (tụng kinh, trì chú, thiền định, hành thiện) phù hợp với lá số để "Đức năng thắng số". Cung cấp tên thần chú cụ thể (ví dụ: Chú Đại Bi, Chú Chuẩn Đề, Lục Tự Đại Minh Chú,...) nếu thấy cần thiết để giúp người dùng bình tâm và cải vận.
- Vẽ **Đồ bản Cửu Cung 3x3** đầy đủ và Tinh chuẩn. BẮT BUỘC dùng mã HTML sau (KHÔNG dùng markdown table):
<table class="w-full border-collapse text-center border-2 border-amber-700 bg-amber-50 mb-4">
  <tbody>
    <tr>
      <td class="w-1/3 border border-amber-600 p-2 align-top"><b>Tốn(4)</b><br>[Các sao: ...]</td>
      <td class="w-1/3 border border-amber-600 p-2 align-top"><b>Ly(9)</b><br>[Các sao: ...]</td>
      <td class="w-1/3 border border-amber-600 p-2 align-top"><b>Khôn(2)</b><br>[Các sao: ...]</td>
    </tr>
    <tr>
      <td class="border border-amber-600 p-2 align-top"><b>Chấn(3)</b><br>[Các sao: ...]</td>
      <td class="border border-amber-600 p-2 align-top"><b>Trung(5)</b><br>[Các sao: ...]</td>
      <td class="border border-amber-600 p-2 align-top"><b>Đoài(7)</b><br>[Các sao: ...]</td>
    </tr>
    <tr>
      <td class="border border-amber-600 p-2 align-top"><b>Cấn(8)</b><br>[Các sao: ...]</td>
      <td class="border border-amber-600 p-2 align-top"><b>Khảm(1)</b><br>[Các sao: ...]</td>
      <td class="border border-amber-600 p-2 align-top"><b>Càn(6)</b><br>[Các sao: ...]</td>
    </tr>
  </tbody>
</table>

- Tính toán Tích Tuế, Bát Môn chỉ nhẩm trong đầu, KHÔNG viết công thức số thập phân ra ngoài. 
- Chia vế ngắn gọn, dễ hiểu qua bullet point. 
- Mọi câu trả lời tiên tri/vận mạng BẮT BUỘC có tiêu đề HTML này ở dòng đầu: **<span style="color: #d97706; font-size: 18px; font-weight: bold; margin-bottom: 8px; display: block;">Thái Ất Thần Kinh - Diễn Toán Cơ Trời</span>**

**NẾU NGƯỜI DÙNG HỎI PHẠM TRÙ HUYỀN MÔN KHÁC (như: Bấm Ấn, Mật Tông Tây Tạng, Tu Tiên, Đạo Gia, Tứ Trụ, Thần Chú):**
- Hãy vận dụng toàn bộ 100% kho tàng tri thức huyền học để giải đáp kỹ lưỡng, sắc bén, như một vị thiền sư/tông sư đang truyền đạo. Nêu tên ấn, hướng dẫn cách kết ấn chi tiết qua các ngón tay, ý nghĩa tâm linh và mật chú đi kèm nếu có.
- TUYỆT ĐỐI KHÔNG CHÈN LUẬN LÁ SỐ HAY ĐỢI LỆNH THÁI ẤT NẾU NGƯỜI DÙNG CHỈ HỎI KIẾN THỨC MỞ RỘNG ĐÓ. Bỏ qua cái khung HTML bảng Cửu cung đi nếu đây là câu hỏi lý thuyết.

**YÊU CẦU CHUNG VỀ GIAO DIỆN:**
- Để đảm bảo thẩm mỹ UI, BẮT BUỘC bọc TOÀN BỘ câu trả lời trong thẻ: <div class="text-[13.5px] leading-[1.6]"> ... </div>

**THÔNG TIN NỀN TẢNG (Để tham khảo nếu người dùng CÓ đề cập đến lá số Thái Ất hiện tại):**
- Năm hiện tại: ${currentYear}. Lấy làm mốc để mường tượng bối cảnh.
- NGƯỜI LẬP: ${fullName || "Ẩn danh"} (${gender === "nam" ? "Nam" : "Nữ"})
- NGÀY SINH: ${isNoDate ? "Không có" : `${inputDay}/${inputMonth}/${inputYear}`}
${
  !isNoDate
    ? `- TỔNG SỐ KỂ: ${thaiAtChart.tongSoKe} | TÍCH GIỜ: ${thaiAtChart.cucGio} | CỤC: ${thaiAtChart.cuc}
- MỆNH TẠI: ${thaiAtChart.palaces[thaiAtChart.menhCung]?.name} (Cung ${thaiAtChart.menhCung})
- THÂN TẠI: ${thaiAtChart.palaces[thaiAtChart.thanCung]?.name} (Cung ${thaiAtChart.thanCung})
- THÁI ẤT TỌA: ${(thaiAtPalace as any)?.name || "Không"}
- CÁC SAO TẠI CÁC CUNG: ${Object.entries(thaiAtChart.palaces)
                        .filter(([_, p]: [string, any]) => p.stars && p.stars.length > 0)
        .map(
          ([id, p]: [string, any]) =>
            `Cung ${id}(${p.name}): ${p.stars.map((s: any) => s.name).join(", ")}`,
        )
        .join("; ")}`
    : ""
}`;

      const userPrompt =
        customQuestion ||
        "Hãy lập bài luận giải chi tiết lá số Thái Ất này theo cấu trúc chuyên nghiệp.";

      const apiContents = sanitizeApiContents(thaiAtChat, userPrompt);

      setThaiAtChat((prev) => [
        ...prev,
        { role: "user", text: userPrompt },
        { role: "model", text: "" },
      ]);
      if (customQuestion) {
        setUserQuestion("");
        setInterimQuestion("");
      }

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
          setThaiAtChat((prev) => {
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

      setThaiAtChat((prev) => {
        if (prev.length === 0) return prev;
        const newChat = [...prev];
        newChat[newChat.length - 1] = {
          ...newChat[newChat.length - 1],
          text: fullResp,
        };
        return newChat;
      });
    } catch (err: any) {
      console.error("AI Error:", err);
      const errorMsg = handleAIError(err);
      if (
        errorMsg.includes("API Key") ||
        errorMsg.includes("Quota") ||
        err?.message === "API_KEY_MISSING"
      ) {
        if (onRequireApiKey) onRequireApiKey();
      }
      setThaiAtChat((prev) => {
        if (prev.length === 0) return prev;
        const newChat = [...prev];
        newChat[newChat.length - 1] = {
          ...newChat[newChat.length - 1],
          text: errorMsg,
        };
        return newChat;
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const thaiAtChart = useMemo(() => {
    if (!inputYear || !inputMonth || !inputDay) {
      // Trả về bảng Thái Ất trống khi không có ngày giờ
      const emptyPalaces: Record<string, any> = {};
      THAI_AT_16_PALACES.forEach((c) => {
        emptyPalaces[c.id] = {
          id: c.id,
          name: c.name,
          stars: [],
          isMenh: false,
          isThan: false,
          batMon: "",
        };
      });
      // Trung cung
      emptyPalaces["trung"] = {
        id: "trung",
        name: "Trung",
        stars: [],
        isMenh: false,
        isThan: false,
        batMon: "",
      };

      return {
        tichTue: 0,
        kyDu: 0,
        nguyen: 0,
        cuc: 0,
        tichGio: 0,
        cucGio: 0,
        tongSoKe: 0,
        stars: [],
        palaces: emptyPalaces,
        menhCung: "t1",
        thanCung: "t1",
        daiVan: [{ palaceId: "t1", startAge: 1, endAge: 10, isCurrent: true }],
        tieuVan: [],
        theThuc: [],
        binhPhap:
          "Chưa có thông tin ngày giờ nên chỉ dùng bảng Cửu Cung cơ bản.",
      } as any;
    }

    const y = parseInt(inputYear);
    const m = parseInt(inputMonth);
    const d = parseInt(inputDay);

    let lYear = y;
    try {
      const solar = Solar.fromYmd(y, m, d);
      const lunar = solar.getLunar();
      lYear = lunar.getYear();
    } catch {
      lYear = y;
    }

    const input: ThaiAtInput = {
      solarYear: y,
      solarMonth: m,
      solarDay: d,
      solarHour: Number(birthTime),
      lunarYear: lYear,
      gender: gender,
    };
    return ThaiAtEngine.calculateChart(input);
  }, [inputDay, inputMonth, inputYear, birthTime, gender]);

  const currentYear = new Date().getFullYear();
  const currentAge = inputYear ? currentYear - Number(inputYear) + 1 : 1;
  const currentDaiVan =
    thaiAtChart?.daiVan.find(
      (v: any) => currentAge >= v.startAge && currentAge <= v.endAge,
    ) || thaiAtChart?.daiVan[0];
  const nextDaiVanIndex =
    thaiAtChart && currentDaiVan
      ? thaiAtChart.daiVan.indexOf(currentDaiVan) + 1
      : -1;
  const nextDaiVan =
    thaiAtChart &&
    nextDaiVanIndex >= 0 &&
    nextDaiVanIndex < thaiAtChart.daiVan.length
      ? thaiAtChart.daiVan[nextDaiVanIndex]
      : null;

  const thaiAtPalace = useMemo(() => {
    if (!thaiAtChart) return null;
    return Object.values(thaiAtChart.palaces).find((p: any) =>
      p.stars.some((s: any) => s.id === "thai_at"),
    );
  }, [thaiAtChart]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await toCanvas(reportRef.current, { pixelRatio: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.setFontSize(10);
      pdf.setTextColor(150);
      pdf.text(
        "Thái Ất Thần Kinh - Nguyễn Hồng Quang",
        10,
        pdf.internal.pageSize.getHeight() - 10,
      );
      pdf.save(`ThaiAt_Report_${inputYear}${inputMonth}${inputDay}.pdf`);
    } catch (error) {
      console.error("Export PDF error:", error);
    }
  };

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    try {
      const dataUrl = await toPng(reportRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `ThaiAt_Report_${inputYear}${inputMonth}${inputDay}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Export Image error:", error);
    }
  };

  // 16 Cung Layout (vòng tròn quanh hình vuông 5x5)
  const GRID_POSITIONS: Record<string, string> = {
    t1: "5 / 3 / 6 / 4",
    t2: "5 / 2 / 6 / 3",
    t3: "5 / 1 / 6 / 2",
    t4: "4 / 1 / 5 / 2",
    t5: "3 / 1 / 4 / 2",
    t6: "2 / 1 / 3 / 2",
    t7: "1 / 1 / 2 / 2",
    t8: "1 / 2 / 2 / 3",
    t9: "1 / 3 / 2 / 4",
    t10: "1 / 4 / 2 / 5",
    t11: "1 / 5 / 2 / 6",
    t12: "2 / 5 / 3 / 6",
    t13: "3 / 5 / 4 / 6",
    t14: "4 / 5 / 5 / 6",
    t15: "5 / 5 / 6 / 6",
    t16: "5 / 4 / 6 / 5",
  };

  const getPalaceColor = (
    cungId: string,
    menhCung?: string,
    thanCung?: string,
    isSelected?: boolean,
  ) => {
    if (menhCung && cungId === menhCung)
      return "bg-blue-100 ring-2 ring-blue-700 shadow-lg z-20";
    if (thanCung && cungId === thanCung)
      return "bg-amber-100 ring-2 ring-amber-800 shadow-lg z-20";
    if (isSelected) return "bg-amber-200 ring-2 ring-amber-600 z-10 shadow-md";
    return "bg-[#fffcf0] ring-1 ring-amber-400/30 hover:bg-amber-50 shadow-sm";
  };

  return (
    <div className="flex flex-col w-full max-w-full mx-auto gap-4 sm:gap-8">
      {/* Input Form Setup */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 items-end overflow-hidden">
        <div className="flex flex-col col-span-2 lg:col-span-1">
          <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 leading-none">
            Họ và tên
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nhập họ tên"
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div className="flex flex-col shrink-0 col-span-1 lg:col-span-1">
          <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 leading-none">
            GT & Giờ
          </label>
          <div className="flex gap-1.5">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "nam" | "nu")}
              className="px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm w-16 sm:w-20 outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
            </select>
            <select
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm flex-1 outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">Giờ</option>
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>
                  {i}:00
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col col-span-1 lg:col-span-2">
          <label className="text-[9px] uppercase font-bold text-slate-400 mb-1 leading-none">
            Ngày Sinh (DL)
          </label>
          <div className="flex gap-1.5 min-w-0">
            <input
              type="number"
              value={inputDay}
              onChange={(e) => setInputDay(e.target.value)}
              placeholder="D"
              className="px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm flex-1 min-w-0 outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <input
              type="number"
              value={inputMonth}
              onChange={(e) => setInputMonth(e.target.value)}
              placeholder="M"
              className="px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm flex-1 min-w-0 outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <input
              type="number"
              value={inputYear}
              onChange={(e) => setInputYear(e.target.value)}
              placeholder="YYYY"
              className="px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm flex-[1.5] min-w-0 outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>
      </div>

      {!thaiAtChart ? (
        <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
          Vui lòng nhập đầy đủ ngày tháng năm sinh để lập Bảng Thái Ất.
        </div>
      ) : (
        <Fragment>
          {/* Action Bar */}
          <div className="hidden justify-between items-center px-2">
            <div>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-bold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 transition-colors shadow-sm"
                onClick={() => alert("Chức năng đang được xây dựng!")}
              >
                <Book className="w-4 h-4" />
                Thư viện Sách Toàn Tập
              </button>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleExportImage}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-700 transition-colors shadow-sm"
              >
                <ImageIcon className="w-4 h-4" />
                Xuất Ảnh
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-amber-700 transition-colors shadow-sm shadow-amber-200"
              >
                <Download className="w-4 h-4" />
                Xuất PDF
              </button>
            </div>
          </div>

          <div
            ref={reportRef}
            className="flex flex-col w-full gap-4 bg-[#f2e6d0] p-1 sm:p-2 rounded-3xl border border-amber-300 shadow-inner"
            style={{ minHeight: "800px" }}
          >
            {/* Header Info */}
            <div className="bg-[#e6d5ba] rounded-2xl p-3 sm:p-4 shadow-sm border border-amber-300 flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="text-center md:text-left">
                <h2 className="text-base font-black uppercase tracking-widest text-amber-950 font-serif">
                  Bàn Thái Ất Thần Kinh (16 Cung)
                </h2>
                <div className="text-[11px] text-amber-900 mt-0.5 flex flex-wrap justify-center md:justify-start gap-x-2 gap-y-0 font-bold">
                  <span>
                    Họ tên:{" "}
                    <strong className="text-amber-950">
                      {fullName || "Chưa nhập"}
                    </strong>
                  </span>
                  <span className="hidden md:inline text-amber-200">|</span>
                  <span>
                    Giới tính:{" "}
                    <strong className="text-amber-950">
                      {gender === "nam" ? "Nam" : "Nữ"}
                    </strong>
                  </span>
                  <span className="hidden md:inline text-amber-200">|</span>
                  <span>
                    Ngày sinh:{" "}
                    <strong className="text-amber-950">
                      {inputDay}/{inputMonth}/{inputYear}
                    </strong>
                  </span>
                  <span className="hidden md:inline text-amber-200">|</span>
                  <span>
                    Giờ:{" "}
                    <strong className="text-amber-950">{birthTime}h</strong>{" "}
                    (Thời Kế)
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-center bg-white/50 px-3 py-1.5 rounded-xl border border-amber-200/50">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] uppercase font-bold text-amber-800/60 leading-none">
                    Tổng Kể
                  </span>
                  <span className="text-sm font-bold text-amber-900 font-mono leading-tight">
                    {thaiAtChart.tongSoKe}
                  </span>
                </div>
                <div className="w-px h-6 bg-amber-200/50"></div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] uppercase font-bold text-amber-800/60 leading-none">
                    Tích Giờ
                  </span>
                  <span className="text-sm font-bold text-amber-900 font-mono leading-tight">
                    {thaiAtChart.cucGio}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT: 16 Palaces Grid */}
              <div className="lg:col-span-7 flex flex-col items-center w-full">
                {/* Wrapper with fixed aspect ratio and min widths/heights to ensure rendering consistency */}
                <div className="relative w-full aspect-[7/11] max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl rounded-[1rem] sm:rounded-[2rem] p-0.5 sm:p-1 bg-[#dfc9a5] border-2 border-amber-400/30 shadow-2xl overflow-hidden mx-auto shrink-0">
                  <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 h-full w-full p-1.5 sm:p-3 gap-1 sm:gap-2">
                    {THAI_AT_16_PALACES.map((cung) => {
                      const pInfo = thaiAtChart.palaces[cung.id];
                      const gridArea = GRID_POSITIONS[cung.id];
                      const isActive = selectedCung === cung.id;

                      return (
                        <div
                          key={cung.id}
                          onClick={() => setSelectedCung(cung.id)}
                          style={{ gridArea }}
                          className={`relative rounded-lg sm:rounded-xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-between p-1 sm:p-1.5 overflow-hidden group hover:-translate-y-1 hover:shadow-lg border-opacity-70 ${getPalaceColor(cung.id, thaiAtChart.menhCung, thaiAtChart.thanCung, isActive)}`}
                        >
                          <div className="flex flex-col w-full items-center flex-grow">
                            {/* Palace Name & Direction */}
                            <div className="font-bold text-slate-800 z-10 flex flex-col items-center justify-center w-full text-center mb-0.5 truncate">
                              <span className="font-sans leading-tight truncate text-[9.5px] sm:text-[11px] tracking-widest font-black uppercase text-slate-700">
                                {cung.name}
                              </span>
                              <div className="flex flex-row flex-wrap justify-center items-center gap-1 mt-1 opacity-90">
                                {pInfo.isMenh && (
                                  <span className="text-blue-700 text-[8px] font-black uppercase truncate">
                                    Mệnh
                                  </span>
                                )}
                                {pInfo.isThan && (
                                  <span className="text-amber-600 text-[8px] font-black uppercase truncate">
                                    Thân
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Stars in Palace */}
                            <div className="flex flex-col gap-0 w-full z-10 items-center justify-start">
                              {pInfo.stars.map((star: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`text-[8px] sm:text-[9px] text-center w-full tracking-tight font-medium leading-none truncate
                            ${star.id === "thai_at" ? "text-red-700 font-bold" : ""}
                            ${star.id === "van_xuong" ? "text-blue-700 font-bold" : ""}
                            ${star.id === "khach_muc" ? "text-purple-700 font-bold" : ""}
                            ${star.id === "dai_tuong" || star.id === "tieu_tuong" ? "text-emerald-700" : ""}
                            ${star.type === "phu" ? "text-slate-500 text-[7px] sm:text-[8px]" : ""}
                            ${star.type === "du" ? "text-amber-700" : ""}
                            ${star.type === "chinh" && !["thai_at", "van_xuong", "khach_muc", "dai_tuong", "tieu_tuong"].includes(star.id) ? "text-indigo-700" : ""}
                          `}
                                >
                                  {star.name}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-auto flex flex-col pt-0.5 z-20 w-full rounded-t-sm">
                            <div
                              className={`h-[10px] sm:h-[12px] flex items-center justify-center text-[6px] sm:text-[7px] leading-none font-black uppercase tracking-widest ${pInfo.batMon ? "text-blue-600" : ""}`}
                            >
                              {pInfo.batMon || ""}
                            </div>
                            <div className={`h-[18px] sm:h-[22px] flex items-center justify-center text-[10px] sm:text-xs font-black text-amber-900 uppercase tracking-wide text-center truncate ${pInfo.cungPhu ? "border-t border-amber-200/60 shadow-[0_-2px_4px_rgba(0,0,0,0.02)]" : "border-t border-transparent"} pt-0.5 w-full`}>
                              {pInfo.cungPhu || ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Center Box - 3x3 Cuu Cung Grid */}
                    <div className="col-start-2 col-end-5 row-start-2 row-end-5 rounded-3xl border-2 border-black bg-white/90 m-1 flex flex-col items-center justify-center p-1 sm:p-2 shadow-inner z-0">
                      <h3 className="font-serif font-black text-amber-950 text-[10px] sm:text-xs mb-0.5 leading-none uppercase tracking-tighter truncate w-full text-center">
                        Tính Mệnh Thái Ất
                      </h3>

                      <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full flex-grow">
                        {(() => {
                          const cuuCungMapping = [
                            { id: "t7", name: "Tốn", num: "4" },
                            { id: "t9", name: "Ly", num: "9" },
                            { id: "t11", name: "Khôn", num: "2" },
                            { id: "t5", name: "Chấn", num: "3" },
                            { id: "trung", name: "Trung", num: "5" },
                            { id: "t13", name: "Đoài", num: "7" },
                            { id: "t3", name: "Cấn", num: "8" },
                            { id: "t1", name: "Khảm", num: "1" },
                            { id: "t15", name: "Càn", num: "6" },
                          ];

                          return cuuCungMapping.map((cc, i) => {
                            if (cc.id === "trung") {
                              return (
                                <div
                                  key={i}
                                  className="bg-white/95 border border-solid border-amber-300 rounded-xl flex flex-col items-center justify-center p-1 text-center shadow-md ring-2 ring-amber-100/50 z-10 relative"
                                >
                                  <span className="text-[10px] sm:text-xs tracking-wider font-black text-amber-800/80 uppercase leading-none mb-1">
                                    TRUNG {cc.num}
                                  </span>
                                  <div className="flex flex-col items-center justify-center gap-0.5">
                                    <div className="flex flex-col items-center">
                                      <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase leading-none">
                                        Mệnh
                                      </span>
                                      <span className="text-[10px] sm:text-sm font-black text-blue-700 leading-tight">
                                        {
                                          thaiAtChart.palaces[
                                            thaiAtChart.menhCung
                                          ]?.name
                                        }
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase leading-none">
                                        Thân
                                      </span>
                                      <span className="text-[10px] sm:text-sm font-black text-amber-700 leading-tight">
                                        {
                                          thaiAtChart.palaces[
                                            thaiAtChart.thanCung
                                          ]?.name
                                        }
                                      </span>
                                    </div>
                                    <div className="flex gap-x-2 mt-0.5 border-t border-slate-100 pt-0.5">
                                      <div className="flex flex-col items-center">
                                        <span className="text-[5px] text-slate-400 font-bold uppercase">
                                          Cục
                                        </span>
                                        <span className="text-[8px] font-black">
                                          {thaiAtChart.cuc}
                                        </span>
                                      </div>
                                      <div className="flex flex-col items-center">
                                        <span className="text-[5px] text-slate-400 font-bold uppercase">
                                          Dư
                                        </span>
                                        <span className="text-[8px] font-black">
                                          {thaiAtChart.cucGio}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            const pInfo = thaiAtChart.palaces[cc.id];
                            return (
                              <div
                                key={i}
                                className={`rounded-xl border border-solid border-amber-200 shadow-sm flex flex-col items-center justify-between p-1 transition-all ${pInfo.isMenh ? "bg-blue-50/80 ring-1 ring-blue-300" : pInfo.isThan ? "bg-amber-50/80 ring-1 ring-amber-300" : "bg-white/80"}`}
                              >
                                <div className="text-[10px] sm:text-xs tracking-wider font-black text-slate-700 uppercase leading-none mt-1">
                                  {cc.name} {cc.num}
                                </div>
                                <div className="flex flex-col items-center justify-center flex-grow overflow-hidden w-full">
                                  {pInfo.stars.slice(0, 3).map((star: any, sIdx: number) => (
                                    <span
                                      key={sIdx}
                                      className={`text-[8px] sm:text-[9px] font-bold leading-tight truncate w-full text-center ${star.id === "thai_at" ? "text-red-600" : star.type === "phu" ? "text-slate-400 text-[7px]" : "text-indigo-700"}`}
                                    >
                                      {star.name}
                                    </span>
                                  ))}
                                </div>
                                {pInfo.isMenh && (
                                  <span className="text-[6px] font-black text-blue-700 uppercase mb-0.5">
                                    MỆNH
                                  </span>
                                )}
                                {pInfo.isThan && (
                                  <span className="text-[6px] font-black text-amber-600 uppercase mb-0.5">
                                    THÂN
                                  </span>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Analysis Panel */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                {/* AI Interpretation Box */}
                <div className="bg-[#f2e6d0] rounded-3xl border border-amber-300 shadow-xl overflow-hidden flex flex-col w-full h-full">
                  <div className="bg-[#e6d5ba] px-4 py-4 border-b border-amber-300/40 flex justify-between items-center text-left">
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-100 p-1.5 rounded-xl shadow-md border border-white/50">
                        <BrainCircuit className="w-5 h-5 text-amber-800" />
                      </div>
                      <div>
                        <h3 className="font-black text-[13px] sm:text-sm text-amber-950 uppercase tracking-widest leading-none">
                          Chuyên Gia Thái Ất AI
                        </h3>
                        <p className="text-[10px] text-amber-900/60 uppercase font-black tracking-widest mt-0.5">
                          Hệ thống phân tích lá số
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => generateAIInterpretation()}
                      disabled={isAiLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-800 text-white rounded-xl text-[11px] font-black uppercase hover:bg-amber-950 disabled:opacity-50 transition-all shadow-lg active:scale-95 border border-white/20"
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {thaiAtChat.length > 0 ? "Cập Nhật" : "Phân Tích"}
                    </button>
                  </div>

                  <div className="p-2 sm:p-2 min-h-[100px] relative text-left">
                    {thaiAtChat.length > 0 || isAiLoading ? (
                      <div className="overflow-y-auto max-h-[600px] space-y-4 rounded-xl p-1 custom-scrollbar select-text">
                        {thaiAtChat.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} w-full animate-in fade-in duration-200`}
                          >
                            {msg.role === "user" ? (
                              <div className="relative group max-w-[92%] mb-1 select-text">
                                <div className="bg-[#4a1d12] text-white border border-orange-900/10 px-4 py-2.5 rounded-3xl rounded-tr-none text-[13px] font-medium shadow-md leading-relaxed">
                                  {msg.text}
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.text);
                                    setCopiedIndex(idx);
                                    setTimeout(
                                      () => setCopiedIndex(null),
                                      2000,
                                    );
                                  }}
                                  className="absolute -top-2 -left-2 p-1 text-orange-200 hover:text-white bg-orange-900 rounded-lg border border-orange-100 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"
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
                              <div className="w-full shadow-sm relative group select-text">
                                <button
                                  onClick={() => speakText(msg.text, idx)}
                                  className={`absolute top-2 right-10 p-1.5 ${speakingIndex === idx ? "text-rose-500 bg-rose-50 border-rose-200" : "text-orange-400 hover:text-orange-700 bg-orange-50 border-orange-100"} rounded-lg border opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm`}
                                  title={
                                    speakingIndex === idx
                                      ? "Dừng đọc"
                                      : "Đọc văn bản"
                                  }
                                >
                                  {speakingIndex === idx ? (
                                    <Square
                                      className="w-3.5 h-3.5"
                                      fill="currentColor"
                                    />
                                  ) : (
                                    <Volume2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.text);
                                    setCopiedIndex(idx);
                                    setTimeout(
                                      () => setCopiedIndex(null),
                                      2000,
                                    );
                                  }}
                                  className="absolute top-2 right-2 p-1.5 text-orange-400 hover:text-orange-700 bg-orange-50 rounded-lg border border-orange-100 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"
                                  title="Sao chép câu trả lời"
                                >
                                  {copiedIndex === idx ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <div className="prose prose-slate max-w-none text-[13px] leading-[1.6] markdown-body p-1 sm:p-2">
                                  {msg.text ? (
                                    <Markdown
                                      rehypePlugins={[rehypeRaw]}
                                      remarkPlugins={[remarkGfm]}
                                    >
                                      {msg.text}
                                    </Markdown>
                                  ) : (
                                    <div className="flex gap-1.5 items-center h-6 shrink-0 w-max">
                                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-20 opacity-40">
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 ring-2 ring-orange-100">
                          <MessageSquare className="w-8 h-8 text-orange-200" />
                        </div>
                        <h4 className="text-sm font-black text-orange-950 mb-1 uppercase tracking-widest">
                          Sẵn sàng luận giải
                        </h4>
                        <p className="text-orange-900 text-[11px] max-w-[240px] font-bold">
                          Đặt câu hỏi hoặc nhấn nút Phân Tích để bắt đầu.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-[#fffbf0]/40 border-t border-amber-200/40 space-y-3">
                    <div className="relative group">
                      <textarea
                        disabled={isAiLoading}
                        value={
                          userQuestion +
                          (interimQuestion
                            ? (userQuestion ? " " : "") + interimQuestion
                            : "")
                        }
                        onChange={(e) => setUserQuestion(e.target.value)}
                        placeholder="Hỏi AI về cát hung, mưu sự theo lá số Thái Ất..."
                        className="w-full px-4 py-3 bg-white border border-orange-100 rounded-2xl text-[13px] font-medium outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/5 min-h-[50px] max-h-[120px] resize-none transition-all disabled:opacity-50 shadow-sm placeholder:text-orange-200"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (
                              (userQuestion.trim() || interimQuestion.trim()) &&
                              !isAiLoading
                            ) {
                              generateAIInterpretation(
                                userQuestion +
                                  (interimQuestion
                                    ? " " + interimQuestion
                                    : ""),
                              );
                            }
                          }
                        }}
                      />

                      {/* Send button below input as requested */}
                      <div className="flex items-center justify-between mt-2 px-1">
                        <div className="flex items-center gap-2">
                          <VoiceInput
                            onResult={(text, isFinal) => {
                              if (isFinal) {
                                setUserQuestion((prev) =>
                                  prev ? prev + " " + text : text,
                                );
                                setInterimQuestion("");
                              } else {
                                setInterimQuestion(text);
                              }
                            }}
                            className="p-2.5 bg-orange-50 text-orange-700 rounded-xl shadow-sm hover:bg-orange-100 border border-orange-100 transition-all active:scale-90"
                            iconSize={18}
                          />
                          <button
                            onClick={() => {
                              const lastMsgIdx = thaiAtChat
                                .map((m: any) => m.role)
                                .lastIndexOf("model");
                              if (lastMsgIdx !== -1) {
                                speakText(
                                  thaiAtChat[lastMsgIdx].text,
                                  lastMsgIdx,
                                );
                              } else {
                                alert("Chưa có câu trả lời nào từ AI để đọc.");
                              }
                            }}
                            className={`p-2.5 rounded-xl shadow-sm border transition-all active:scale-90 ${speakingIndex !== null ? "bg-rose-50 text-rose-500 hover:bg-rose-100 border-rose-100" : "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100"}`}
                            title={
                              speakingIndex !== null
                                ? "Dừng đọc"
                                : "Đọc câu trả lời gần nhất"
                            }
                          >
                            {speakingIndex !== null ? (
                              <Square
                                className="w-[18px] h-[18px]"
                                fill="currentColor"
                              />
                            ) : (
                              <Volume2 className="w-[18px] h-[18px]" />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            generateAIInterpretation(
                              userQuestion +
                                (interimQuestion ? " " + interimQuestion : ""),
                            )
                          }
                          disabled={
                            isAiLoading ||
                            (!userQuestion.trim() && !interimQuestion.trim())
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

                {/* Selected Palace Details */}
                {selectedCung ? (
                  <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                    <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                      <Search className="w-4 h-4" /> Chi tiết Cung{" "}
                      {thaiAtChart.palaces[selectedCung].name}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-amber-100">
                        <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                          Đóng Bát Môn
                        </div>
                        <div className="font-bold text-amber-700">
                          {thaiAtChart.palaces[selectedCung].batMon ||
                            "Không có"}{" "}
                          {thaiAtChart.palaces[selectedCung].batMon &&
                            `- ${BAT_MON_INFO[thaiAtChart.palaces[selectedCung].batMon as string]?.type}`}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                          {thaiAtChart.palaces[selectedCung].batMon
                            ? BAT_MON_INFO[
                                thaiAtChart.palaces[selectedCung]
                                  .batMon as string
                              ]?.desc
                            : "Góc này không đóng cửa Bát Môn."}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-amber-100">
                        <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                          Phân loại
                        </div>
                        <div className="text-xs font-medium text-slate-700 space-y-1">
                          {thaiAtChart.palaces[selectedCung].isMenh && (
                            <div className="text-amber-600 font-bold">
                              • Cung Mệnh
                            </div>
                          )}
                          {thaiAtChart.palaces[selectedCung].isThan && (
                            <div className="text-blue-600 font-bold">
                              • Cung Thân
                            </div>
                          )}
                          {thaiAtChart.palaces[selectedCung].cungPhu && (
                            <div>
                              • Cung {thaiAtChart.palaces[selectedCung].cungPhu}
                            </div>
                          )}
                          {!thaiAtChart.palaces[selectedCung].isMenh &&
                            !thaiAtChart.palaces[selectedCung].isThan &&
                            !thaiAtChart.palaces[selectedCung].cungPhu && (
                              <div>• Cung Lưu / Cung Khí</div>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl shadow-sm border border-amber-100">
                      <div className="text-[10px] uppercase text-slate-400 font-bold mb-2">
                        Các Sao đóng tại cung
                      </div>
                      {thaiAtChart.palaces[selectedCung].stars.length > 0 ? (
                        <ul className="space-y-1.5">
                          {thaiAtChart.palaces[selectedCung].stars.map(
                            (s: any, i: number) => (
                              <li
                                key={i}
                                className="text-sm text-slate-700 flex items-center gap-2"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                <span className="font-medium">{s.name}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-400 italic">
                          Không có tinh tú.
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl shadow-sm border border-amber-100 mt-4">
                      <div className="text-[10px] uppercase text-slate-400 font-bold mb-2">
                        Trích dẫn Thái Ất Thần Kinh
                      </div>
                      <div className="text-sm text-slate-600 italic border-l-2 border-amber-200 pl-3 leading-relaxed">
                        "Luận sự cát hung tại{" "}
                        {thaiAtChart.palaces[selectedCung].name}, xét Can Chi
                        phối hợp và các tinh tú đang an bài. (Đang cập nhật chi
                        tiết từ sách trang XX)"
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
};

export default ThaiAtTab;
