import { handleAIError } from "../utils/aiErrorHandler";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Calendar,
  Download,
  BrainCircuit,
  Sparkles,
  RefreshCw,
  MessageSquareShare,
  Send,
  Copy,
  Check,
  Mic,
  Volume2,
  Square,
} from "lucide-react";
import { VoiceInput } from "./VoiceInput";
import jsPDF from "jspdf";
import { toCanvas } from "html-to-image";
import { MEDICAL_DATA } from "../constants/medicalData";
import { Lunar } from "lunar-javascript";
import { getAI } from "../services/aiService";
import { GEMINI_MODEL, PRO_MODEL } from "../constants/ai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const translateGanZhi = (text: string) => {
  const map: Record<string, string> = {
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
  return text
    .split("")
    .map((char) => map[char] || char)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};

const Trigram = ({ values }: { values: boolean[] }) => {
  return (
    <div className="flex flex-col gap-[3px] sm:gap-[4px] md:gap-[6px] w-full">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex justify-between w-full h-[3.5px] sm:h-[4.5px] md:h-[6px] lg:h-[8px] shrink-0"
        >
          {v ? (
            <div className="w-full bg-slate-800 rounded-[1px] shadow-sm"></div>
          ) : (
            <>
              <div className="w-[43%] bg-slate-800 rounded-[1px] shadow-sm"></div>
              <div className="w-[43%] bg-slate-800 rounded-[1px] shadow-sm"></div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

const TRIGRAM_VALUES: Record<string, boolean[]> = {
  Càn: [true, true, true],
  Đoài: [false, true, true],
  Ly: [true, false, true],
  Chấn: [false, false, true],
  Tốn: [true, true, false],
  Khảm: [false, true, false],
  Cấn: [true, false, false],
  Khôn: [false, false, false],
};

const BRANCHES = [
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

const getKhongVong = (gan: string, zhi: string) => {
  const gIdx = GANS.indexOf(gan);
  const zIdx = BRANCHES.indexOf(zhi);
  let res = zIdx - gIdx;
  if (res < 0) res += 12;
  const kv1 = (res + 10) % 12;
  const kv2 = (res + 11) % 12;
  return `${BRANCHES[kv1]} - ${BRANCHES[kv2]}`;
};

const getTriet = (gan: string, zhi: string) => {
  const normGan = gan.normalize("NFC");
  const GANS_NORM = GANS.map((g) => g.normalize("NFC"));
  const ganIdx = GANS_NORM.indexOf(normGan);
  if (ganIdx === 0 || ganIdx === 5) return "Thân - Dậu";
  if (ganIdx === 1 || ganIdx === 6) return "Ngọ - Mùi";
  if (ganIdx === 2 || ganIdx === 7) return "Thìn - Tỵ";
  if (ganIdx === 3 || ganIdx === 8) return "Dần - Mão";
  if (ganIdx === 4 || ganIdx === 9) return "Tý - Sửu";
  return "Không";
};

// Logic: Determine the 60-year cycle start (Giáp Tý), then find position of year/day pillar
const getTuan = (gan: string, zhi: string) => {
  // 0: Giáp, 1: Ất, ..., 9: Quý
  // 0: Tý, 1: Sửu, ..., 11: Hợi
  const gIdx = GANS.indexOf(gan);
  const zIdx = BRANCHES.indexOf(zhi);

  // Difference tells us which group
  let diff = zIdx - gIdx;
  if (diff < 0) diff += 12; // Should be [0, 2, 4, 6, 8, 10]

  const tuanMap: Record<number, string> = {
    0: "Tuất - Hợi",
    2: "Thân - Dậu",
    4: "Ngọ - Mùi",
    6: "Thìn - Tỵ",
    8: "Dần - Mão",
    10: "Tý - Sửu",
  };

  return tuanMap[diff] || "Không";
};

const TuanTrietDisplay = ({
  lunarInfo,
  manualYear,
}: {
  lunarInfo: any;
  manualYear?: string;
}) => {
  let yearGanZhi;
  if (manualYear && !isNaN(Number(manualYear))) {
    const lunar = Lunar.fromYmd(Number(manualYear), 1, 1);
    yearGanZhi = lunar.getYearInGanZhi();
  } else if (lunarInfo?.lunar) {
    yearGanZhi = lunarInfo.lunar.getYearInGanZhi();
  }

  if (!yearGanZhi) return null;

  const translatedYear = translateGanZhi(yearGanZhi);
  const [yearGan, yearZhi] = translatedYear.split(" ");

  // Day pillar only if lunarInfo is available
  const dayPillar = lunarInfo?.lunar?.getDayInGanZhi();
  let dayGan, dayZhi;
  if (dayPillar) {
    const translatedDay = translateGanZhi(dayPillar);
    [dayGan, dayZhi] = translatedDay.split(" ");
  }

  const tuanYear = getTuan(yearGan, yearZhi);
  const trietYear = getTriet(yearGan, yearZhi);

  const tuanDay = dayGan && dayZhi ? getTuan(dayGan, dayZhi) : "Không";
  const trietDay = dayGan && dayZhi ? getTriet(dayGan, dayZhi) : "Không";

  return (
    <div className="grid grid-cols-1 gap-4 text-xs md:text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-4">
      <div>
        <div>
          <span className="text-red-500 font-semibold">Tuần:</span> {tuanYear}
        </div>
        <div>
          <span className="text-red-500 font-semibold">Triệt:</span> {trietYear}
        </div>
      </div>
    </div>
  );
};

const PALACES = [
  "Mệnh",
  "Phụ",
  "Phúc",
  "Điền",
  "Quan",
  "Nô",
  "Di",
  "Ách",
  "Tài",
  "Tử",
  "Thê",
  "Bào",
];

const calculateBatSan = (
  original: boolean[],
  selectedName: string,
  label: string,
) => {
  const selected = TRIGRAM_VALUES[selectedName];
  if (!selected) return "";

  // Bits: Top (0), Mid (1), Bottom (2)
  const b1 = original[0] !== selected[0] ? 1 : 0; // Top
  const b2 = original[1] !== selected[1] ? 1 : 0; // Mid
  const b3 = original[2] !== selected[2] ? 1 : 0; // Bottom

  const diff = (b1 << 2) | (b2 << 1) | b3;

  const mapping: Record<number, string> = {
    0: "PV", // 000
    4: "SK", // 100
    2: "TM", // 010
    6: "NQ", // 110
    1: "HH", // 001
    5: "LS", // 101
    3: "TY", // 011
    7: "PĐ", // 111
  };

  let result = mapping[diff] || "";

  // Special logic for specific labels: Tý Thìn Ngọ Thân Dần Tuất Ngày Tháng
  const specialLabels = [
    "Tý",
    "Thìn",
    "Ngọ",
    "Thân",
    "Dần",
    "Tuất",
    "Ngày - Hỏa",
    "Tháng - Kim",
  ];
  if (specialLabels.includes(label)) {
    const transform: Record<string, string> = {
      TY: "PĐ",
      PĐ: "HH",
      HH: "NQ",
      NQ: "TY",
    };
    if (transform[result]) {
      result = transform[result];
    }
  }

  return result;
};

const TEXT_OPTIONS = ["PV", "SK", "NQ", "PĐ", "LS", "HH", "TY", "TM"];
const NUMBER_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const CustomNumberSelect = ({
  value,
  onChange,
  className,
  displayValue,
  textColorClass,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  displayValue?: string;
  textColorClass?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center shrink-0 ${isOpen ? "z-[1000]" : "z-10"}`}
      ref={containerRef}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-full cursor-pointer flex items-center justify-center select-none hover:bg-slate-50 transition-colors ${className || "text-lg md:text-3xl font-black"} ${textColorClass || "text-slate-600"}`}
      >
        {displayValue ?? (value || "\u00A0")}
      </div>

      {isOpen && (
        <div
          className={`absolute ${containerRef.current && containerRef.current.getBoundingClientRect().top > window.innerHeight / 2 ? "bottom-[100%]" : "top-[100%]"} ${containerRef.current && containerRef.current.getBoundingClientRect().left > window.innerWidth / 2 ? "right-0" : "left-0"} bg-white border border-slate-200 rounded-lg shadow-2xl flex flex-col items-center py-1 w-24 md:w-36 z-[9999] overflow-hidden`}
        >
          <div
            className="w-full text-center hover:bg-slate-50 cursor-pointer py-1 border-b border-slate-50 transition-colors"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            <span className="text-[0.6rem] md:text-lg text-rose-500 font-bold uppercase">
              X
            </span>
          </div>
          <div className="grid grid-cols-2 w-full">
            {NUMBER_OPTIONS.map((opt, i) => (
              <div
                key={i}
                className="cursor-pointer hover:bg-blue-50 active:bg-blue-100 w-full text-center py-2 md:py-4 flex items-center justify-center border-[0.5px] border-slate-50 transition-colors text-lg md:text-3xl font-black text-slate-700"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CustomTextSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${isOpen ? "z-[1000]" : "z-10"}`}
      ref={containerRef}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="border border-slate-200/80 hover:border-blue-400 bg-slate-50 hover:bg-slate-100 rounded-[4px] md:rounded-md px-0.5 w-[38px] md:w-14 h-8 md:h-10 cursor-pointer flex items-center justify-center select-none shadow-sm transition-all text-xs md:text-xl font-black text-slate-700"
      >
        {value || "\u00A0"}
      </div>

      {isOpen && (
        <div
          className={`absolute ${containerRef.current && containerRef.current.getBoundingClientRect().top > window.innerHeight / 2 ? "bottom-[105%]" : "top-[105%]"} ${containerRef.current && containerRef.current.getBoundingClientRect().left > window.innerWidth / 2 ? "right-0" : "left-0"} bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col items-center py-1 w-24 md:w-36 z-[9999] overflow-hidden`}
        >
          <div
            className="w-full text-center hover:bg-slate-50 cursor-pointer py-1.5 md:py-2 border-b border-slate-100 transition-colors"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            <span className="text-[0.6rem] md:text-xs text-rose-500 font-bold uppercase tracking-wider">
              XÓA
            </span>
          </div>
          <div className="grid grid-cols-2 w-full">
            {TEXT_OPTIONS.map((opt, i) => (
              <div
                key={i}
                className="cursor-pointer hover:bg-[#F2F2EB] active:bg-[#EAEADF] w-full text-center py-2 md:py-3 flex items-center justify-center border-[0.5px] border-slate-50 transition-colors text-xs md:text-lg font-black text-slate-700"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CustomSelect = ({
  value,
  onChange,
  isCalculated,
  calculatedSource,
}: {
  value: string;
  onChange: (v: string) => void;
  isCalculated?: boolean;
  calculatedSource?: "black" | "blue";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = Object.keys(TRIGRAM_VALUES).map((k) => ({
    value: k,
    label: k,
  }));

  const calculatedClasses =
    calculatedSource === "blue"
      ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
      : "border-slate-800 bg-slate-200/50 ring-1 ring-slate-800";

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${isOpen ? "z-[100]" : "z-10"}`}
      ref={containerRef}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`border hover:border-blue-400 rounded-[4px] md:rounded-md px-0.5 w-[30px] sm:w-[36px] md:w-[48px] h-7 md:h-10 cursor-pointer flex items-center justify-center select-none shadow-sm transition-all ${isCalculated ? calculatedClasses : "bg-slate-50 hover:bg-slate-100 border-slate-200/80"}`}
      >
        {value ? (
          <div className="w-full scale-[0.65] md:scale-110">
            <Trigram values={TRIGRAM_VALUES[value]} />
          </div>
        ) : (
          "\u00A0"
        )}
      </div>

      {isOpen && (
        <div className="absolute top-[105%] left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col items-center py-1 w-24 sm:w-32 md:w-48 z-[1000] overflow-hidden">
          <div
            className="w-full text-center hover:bg-slate-50 cursor-pointer py-1.5 md:py-2 border-b border-slate-100 transition-colors"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            <span className="text-[0.6rem] md:text-xs text-rose-500 font-bold uppercase tracking-wider">
              XÓA {isCalculated ? "(SỬ DỤNG LẠI GIÁ TRỊ TỰ ĐỘNG)" : ""}
            </span>
          </div>
          <div className="grid grid-cols-2 w-full">
            {options.map((opt, i) => (
              <div
                key={i}
                className="cursor-pointer hover:bg-[#F2F2EB] active:bg-[#EAEADF] w-full text-center py-2 md:py-3 flex flex-col items-center justify-center px-1 border-[0.5px] border-slate-50 transition-colors gap-1"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <div className="w-[80%] md:w-full">
                  <Trigram values={TRIGRAM_VALUES[opt.value]} />
                </div>
                <span className="text-[0.4rem] md:text-[0.6rem] font-bold text-slate-500 uppercase tracking-tighter">
                  {opt.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CungSelect = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (disabled)
    return (
      <div className="relative flex items-center justify-center shrink-0 z-10 pointer-events-none opacity-0">
        <div className="border border-slate-200/80 rounded-[4px] md:rounded-md px-0.5 w-[30px] sm:w-[36px] md:w-[48px] text-[0.45rem] sm:text-[0.65rem] md:text-xl font-bold text-slate-700 h-7 md:h-10 flex items-center justify-center select-none text-center leading-tight transition-all shadow-sm">
          {"\u00A0"}
        </div>
      </div>
    );

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${isOpen ? "z-[100]" : "z-10"}`}
      ref={containerRef}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="border border-slate-200/80 hover:border-blue-400 bg-slate-50 hover:bg-slate-100 rounded-[4px] md:rounded-md px-0.5 w-[30px] sm:w-[36px] md:w-[48px] text-[0.45rem] sm:text-[0.65rem] md:text-xl font-bold text-slate-700 h-7 md:h-10 cursor-pointer flex items-center justify-center select-none text-center leading-tight transition-all shadow-sm"
      >
        {value || "\u00A0"}
      </div>

      {isOpen && (
        <div className="absolute top-[105%] left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col items-center py-1 w-18 sm:w-24 md:w-40 z-[1000] overflow-hidden">
          <div
            className="w-full text-center hover:bg-slate-50 cursor-pointer py-1.5 md:py-2 border-b border-slate-100 transition-colors"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            <span className="text-[0.6rem] md:text-xs text-rose-500 font-bold uppercase tracking-wider">
              XÓA
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 w-full">
            {PALACES.map((opt, i) => (
              <div
                key={i}
                className="text-[0.6rem] sm:text-[0.7rem] md:text-base font-bold text-slate-700 cursor-pointer hover:bg-[#F2F2EB] active:bg-[#EAEADF] w-full text-center py-2 md:py-3 flex items-center justify-center border-[0.5px] border-slate-50 transition-colors"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MedicalModal = ({
  info,
  onClose,
}: {
  info: { title: string; content: string };
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden border border-slate-200/60"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            {info.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-5 sm:p-6 md:p-8 overflow-y-auto text-slate-700 leading-relaxed text-[15px] sm:text-base whitespace-pre-line font-medium">
          {info.content}
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
          >
            Đóng
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const InputRow = ({
  label,
  originalTrigram,
  palace,
  onPalaceChange,
  onShowMedical,
  selected,
  onSelectedChange,
  calculatedTrigramName,
  calculatedTrigramSource,
  isTuan,
  isTriet,
  isYang,
}: {
  label: string;
  originalTrigram: boolean[];
  palace: string;
  onPalaceChange: (v: string) => void;
  onShowMedical: (info: { title: string; content: string }) => void;
  selected?: string;
  onSelectedChange?: (v: string) => void;
  calculatedTrigramName?: string;
  calculatedTrigramSource?: "black" | "blue";
  isTuan?: boolean;
  isTriet?: boolean;
  isYang?: boolean;
}) => {
  const activeTrigram = selected || calculatedTrigramName || "";
  const batSan = calculateBatSan(originalTrigram, activeTrigram, label);
  const isGood = ["SK", "PĐ", "PV", "TY"].includes(batSan);
  const isCalculated = !selected && !!calculatedTrigramName;

  const handleClickBatSan = () => {
    if (!batSan) return;
    const data = MEDICAL_DATA[label];
    if (data && data.descriptions[batSan]) {
      onShowMedical({
        title: `${data.title} - ${batSan}`,
        content: data.descriptions[batSan],
      });
    }
  };

  const organName = ORGAN_MAPPING[label];

  return (
    <div className="grid grid-cols-[1fr_30px_65px] sm:grid-cols-[1fr_36px_90px] md:grid-cols-[1fr_48px_120px] items-center w-full gap-1 sm:gap-2 group">
      {/* Địa Chi + Organ Column */}
      <div className="flex flex-col items-start min-w-0 pr-0.5">
        <div
          className={`text-[0.6rem] sm:text-base md:text-xl lg:text-2xl font-bold leading-tight w-full truncate ${isTuan || isTriet ? "text-red-700" : "text-slate-900"}`}
        >
          {label}
        </div>
        {organName && (
          <div className="text-[0.4rem] sm:text-[0.6rem] md:text-sm text-slate-500 font-medium leading-none mt-0.5 w-full uppercase tracking-tighter truncate">
            {organName}
          </div>
        )}
      </div>

      {/* Trigram Select Column */}
      <div className="flex items-center justify-center shrink-0">
        <CustomSelect
          value={activeTrigram}
          onChange={(v) => onSelectedChange?.(v)}
          isCalculated={isCalculated}
          calculatedSource={calculatedTrigramSource}
        />
      </div>

      {/* Selects & Results Column */}
      <div className="grid grid-cols-2 gap-1 sm:gap-1.5 md:gap-2 shrink-0">
        <CungSelect
          value={palace}
          onChange={onPalaceChange}
          disabled={!BRANCHES.includes(label)}
        />
        <div
          onClick={handleClickBatSan}
          className={`w-[30px] sm:w-[36px] md:w-[48px] h-7 md:h-10 border border-slate-200/80 bg-slate-50 hover:bg-slate-100 rounded-[4px] md:rounded-md shrink-0 flex items-center justify-center text-[0.55rem] sm:text-sm md:text-xl font-black cursor-pointer shadow-sm transition-all ${isGood ? "text-rose-600 hover:text-rose-700 hover:border-rose-300" : "text-slate-700"}`}
        >
          {batSan}
        </div>
      </div>
    </div>
  );
};

const ORGAN_MAPPING: Record<string, string> = {
  Tỵ: "Tim",
  Ngọ: "Tiểu Trường",
  Dậu: "Phổi",
  Thân: "Đại Trường",
  Sửu: "Tỳ",
  Thìn: "Vị",
  Mão: "Gan",
  Dần: "Mật",
  Hợi: "Thận Thủy",
  Tý: "Bàng Quang",
  Mùi: "Thận hỏa",
  Tuất: "Tam Tiêu",
  "Năm - Thủy": "Huyết",
  "Tháng - Kim": "Tinh",
  "Giờ - Mộc": "Khí",
  "Ngày - Hỏa": "Thần",
};

const CellContent = ({
  rows,
  originalTrigram,
  getPalace,
  onPalaceChange,
  onShowMedical,
  getCalculatedTrigram,
  selectedTrigrams,
  onSelectedChange,
  tuanBranches = [],
  trietBranches = [],
}: {
  rows: { label: string }[];
  originalTrigram: boolean[];
  getPalace: (l: string) => string;
  onPalaceChange: (l: string, v: string) => void;
  onShowMedical: (info: { title: string; content: string }) => void;
  getCalculatedTrigram?: (
    l: string,
  ) => { value: string; source: "black" | "blue" } | null;
  selectedTrigrams: Record<string, string>;
  onSelectedChange: (l: string, v: string) => void;
  tuanBranches: string[];
  trietBranches: string[];
}) => (
  <div className="flex flex-col justify-center gap-1 sm:gap-3 md:gap-6 text-slate-900 font-bold w-full relative">
    {rows.map((r, i) => {
      const calcData = getCalculatedTrigram?.(r.label);
      const isTuan = tuanBranches
        .map((b) => b.normalize("NFC"))
        .includes(r.label.normalize("NFC"));
      const isTriet = trietBranches
        .map((b) => b.normalize("NFC"))
        .includes(r.label.normalize("NFC"));
      const yangBranches = ["Tý", "Dần", "Thìn", "Ngọ", "Thân", "Tuất"].map(
        (b) => b.normalize("NFC"),
      );
      const isYang = yangBranches.includes(r.label.normalize("NFC"));

      return (
        <InputRow
          key={i}
          label={r.label}
          originalTrigram={originalTrigram}
          palace={getPalace(r.label)}
          onPalaceChange={(v) => onPalaceChange(r.label, v)}
          onShowMedical={onShowMedical}
          selected={selectedTrigrams[r.label]}
          onSelectedChange={(v) => onSelectedChange(r.label, v)}
          calculatedTrigramName={calcData?.value}
          calculatedTrigramSource={calcData?.source}
          isTuan={isTuan}
          isTriet={isTriet}
          isYang={isYang}
        />
      );
    })}
  </div>
);

const getRemainder = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === "") return "--";
  const val = Number(num);
  if (isNaN(val)) return "--";
  return val % 8;
};

export function ThaiToTab({
  date,
  lunarInfo,
  manualYear,
  onChange,
  onAutoUpdateChange,
  isAutoUpdate,
  renderColoredCanChi,
  onRequireApiKey,
}: {
  date: any;
  lunarInfo: any;
  manualYear?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAutoUpdateChange: (val: boolean) => void;
  isAutoUpdate: boolean;
  renderColoredCanChi: (val: string | undefined) => React.ReactNode;
  onRequireApiKey?: () => void;
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [localManualYear, setLocalManualYear] = useState(
    manualYear || date?.year?.toString() || new Date().getFullYear().toString(),
  );

  useEffect(() => {
    if (manualYear) {
      setLocalManualYear(manualYear);
    } else if (date?.year) {
      setLocalManualYear(date.year.toString());
    }
  }, [manualYear, date?.year]);

  const [palaceStart, setPalaceStart] = useState<{
    branch: string;
    palace: string;
  } | null>(null);
  const [explicitPalaces, setExplicitPalaces] = useState<
    Record<string, string>
  >({});
  const [explicitCalculatedTrigrams, setExplicitCalculatedTrigrams] = useState<
    Record<string, { value: string; source: "black" | "blue" }>
  >({});
  const [manualTrigrams, setManualTrigrams] = useState<Record<string, string>>(
    {},
  );
  const [medicalInfo, setMedicalInfo] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const yearGanZhiRaw = localManualYear
    ? Lunar.fromYmd(Number(localManualYear), 1, 1).getYearInGanZhi()
    : lunarInfo?.lunar?.getYearInGanZhi();
  const yearGanZhi = yearGanZhiRaw ? translateGanZhi(yearGanZhiRaw) : "";
  const [yearGan, yearZhi] = yearGanZhi ? yearGanZhi.split(" ") : ["", ""];
  const tuan = getTuan(yearGan, yearZhi);
  const triet = getTriet(yearGan, yearZhi);
  const tuanBranches = tuan === "Không" ? [] : tuan.split(" - ");
  const trietBranches = triet === "Không" ? [] : triet.split(" - ");

  const [name, setName] = useState("");
  const [customTrigrams, setCustomTrigrams] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [gridMiddleData, setGridMiddleData] = useState<string[][][]>(
    Array(3)
      .fill(null)
      .map(() =>
        Array(3)
          .fill(null)
          .map(() => Array(4).fill("")),
      ),
  );
  const [gridExtraData, setGridExtraData] = useState<string[][][]>(
    Array(3)
      .fill(null)
      .map(() =>
        Array(3)
          .fill(null)
          .map(() => Array(4).fill("")),
      ),
  );
  const [gridNumberLeftData, setGridNumberLeftData] = useState<string[][]>(
    Array(3)
      .fill(null)
      .map(() => Array(3).fill("")),
  );
  const [showRightTrigrams, setShowRightTrigrams] = useState(false);

  // AI Chat States
  const [thaiToChat, setThaiToChat] = useState<
    { role: "user" | "model"; text: string }[]
  >([]);
  const [thaiToQuestion, setThaiToQuestion] = useState("");
  const [interimThaiToQuestion, setInterimThaiToQuestion] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Warm up voices
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string, index: number) => {
    if (!("speechSynthesis" in window)) {
      alert("Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.");
      return;
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    } else {
      window.speechSynthesis.cancel();
      const plainText = text
        .replace(/[*_#`\[\]]/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/(\r\n|\n|\r)/gm, " ")
        .trim();

      const utterance = new SpeechSynthesisUtterance(plainText);

      // Select Vietnamese voice if available
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
        setSpeakingIndex(index);
      };

      utterance.onend = () => {
        setSpeakingIndex(null);
      };

      utterance.onerror = (e) => {
        console.error("Speech Error:", e);
        setSpeakingIndex(null);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (chatEndRef.current && thaiToChat.length > 0) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [thaiToChat]);

  const analyzeThaiTo = async (customQuestion?: string) => {
    const questionToUse = customQuestion || thaiToQuestion;
    if (!questionToUse.trim() && !customQuestion) {
      if (!thaiToQuestion.trim()) return;
    }

    setIsAnalyzing(true);
    try {
      // Calculate Bát San for all organs to provide to AI
      const pulseDetails = rows
        .flatMap((row) => row)
        .flatMap((cell) => cell.labels)
        .map((label) => {
          // Find original trigram for this label
          const rowData = rows
            .flat()
            .find((r) => r.labels.includes(label));
          const originalTrigram = rowData?.trigram || [true, true, true];

          const calcData = explicitCalculatedTrigrams[label];
          const activeTrigram =
            manualTrigrams[label] || calcData?.value || "";
          const batSan = calculateBatSan(originalTrigram, activeTrigram, label);
          const organ = ORGAN_MAPPING[label] || "";

          return `- Bộ mạch ${label} (${organ}): Trạng thái Bát San là ${batSan || "Chưa xác định"}.`;
        })
        .join("\n");

      const systemInstruction = `Bạn là Chuyên gia Mạch Thái Tử Dịch hàng đầu. Bạn có khả năng luận đoán tình trạng sức khỏe và tạng phủ thông qua các bộ mạch và trạng thái Bát San.

YÊU CẦU BẮT BUỘC:
1. Bắt đầu mọi câu trả lời bằng: **Mạch Thái Tử Dịch - Luận đoán Tạng Phủ**
2. Phân tích các bộ mạch được cung cấp (Tỵ, Ngọ, Dậu, Thân, Sửu, Thìn, Mão, Dần, Hợi, Tý, Mùi, Tuất và các mạch Năm, Tháng, Ngày, Giờ).
3. Tập trung vào các mạch có Bát San xấu: LS (Lục Sát), NQ (Ngũ Quỷ), TM (Tuyệt Mệnh), HH (Họa Hại).
4. Đối với mỗi mạch bị lỗi (Bát San xấu), hãy ghi rõ tạng phủ tương ứng bị bệnh và tính chất của bệnh đó dựa trên lý thuyết Mạch Thái Tử Dịch.
5. Luôn nhắc nhở "Đức năng thắng số" và khuyên người dùng thăm khám y tế chuyên khoa khi có dấu hiệu bất thường.
6. Ngôn ngữ: Trang nghiêm, súc tích, chuyên nghiệp bằng Tiếng Việt.

DỮ LIỆU MẠCH HIỆN TẠI:
${pulseDetails}`;

      const userPrompt =
        questionToUse || "Hãy luận giải tổng quan về bộ mạch hiện tại.";
      const displayUserMsg =
        questionToUse || "Luận giải tổng quan đồ bản hiện tại.";

      const apiContents = thaiToChat.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));
      apiContents.push({ role: "user", parts: [{ text: userPrompt }] });

      setThaiToChat((prev) => [
        ...prev,
        { role: "user", text: displayUserMsg },
        { role: "model", text: "" },
      ]);
      setThaiToQuestion("");
      setInterimThaiToQuestion("");

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
          setThaiToChat((prev) => {
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
      setThaiToChat((prev) => {
        if (prev.length === 0) return prev;
        const newChat = [...prev];
        newChat[newChat.length - 1] = {
          ...newChat[newChat.length - 1],
          text: fullResp,
        };
        return newChat;
      });
    } catch (error: any) {
      console.error(error);
      const errorMsg = handleAIError(error);
      if (
        errorMsg.includes("API Key") ||
        errorMsg.includes("Quota") ||
        error?.message === "API_KEY_MISSING"
      ) {
        if (onRequireApiKey) onRequireApiKey();
      }
      setThaiToChat((prev) => {
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

  const resolveTrigramValue = (
    val: string,
    r?: number,
    c?: number,
    sideIdx?: number,
    extraData?: string[][][],
  ) => {
    if (
      val === "5" &&
      r !== undefined &&
      c !== undefined
    ) {
      if (r === 1 && c === 1) return val; // Center cell 5 stays 5
      const centerNum = gridNumberLeftData[1]?.[1];
      if (["1", "3", "6", "8"].includes(centerNum)) {
        return "8";
      } else if (["2", "4", "7", "9"].includes(centerNum)) {
        return "2";
      }
    }
    return val;
  };

  const getTrigramDisplay = (
    val: string,
    r?: number,
    c?: number,
    sideIdx?: number,
    extraData?: string[][][],
  ) => {
    const resolvedVal = resolveTrigramValue(val, r, c, sideIdx, extraData);
    const mapping: Record<string, string> = {
      "1": "☵",
      "2": "☷",
      "3": "☳",
      "4": "☴",
      "5": "",
      "6": "☰",
      "7": "☱",
      "8": "☶",
      "9": "☲",
    };
    return resolvedVal ? mapping[resolvedVal] || resolvedVal : "";
  };

  const TRIGRAM_BITS: Record<string, number> = {
    "1": 0b010, // Khảm
    "2": 0b000, // Khôn
    "3": 0b001, // Chấn
    "4": 0b110, // Tốn
    "6": 0b111, // Càn
    "7": 0b011, // Đoài
    "8": 0b100, // Cấn
    "9": 0b101, // Ly
  };

  const getRootPalaceTrigram = (uVal: string, lVal: string) => {
    if (!uVal || !lVal || uVal === "5" || lVal === "5") return "";
    const U = TRIGRAM_BITS[uVal];
    const L = TRIGRAM_BITS[lVal];
    if (U === undefined || L === undefined) return "";
    const diff = U ^ L;
    let rootBits;
    switch (diff) {
      case 0:
      case 1:
      case 3:
      case 7:
        rootBits = U;
        break;
      case 6:
        rootBits = U ^ 1; // 1 is 0b001
        break;
      case 4:
        rootBits = U ^ 3; // 3 is 0b011
        break;
      case 5:
        rootBits = U ^ 2; // 2 is 0b010
        break;
      case 2:
        rootBits = L;
        break;
      default:
        return "";
    }
    for (const [key, val] of Object.entries(TRIGRAM_BITS)) {
      if (val === rootBits) return key;
    }
    return "";
  };

  const getBatSanTrigram = (uVal: string, lVal: string) => {
    if (!uVal || !lVal || uVal === "5" || lVal === "5") return "";
    const U = TRIGRAM_BITS[uVal];
    const L = TRIGRAM_BITS[lVal];
    if (U === undefined || L === undefined) return "";
    const diff = U ^ L;
    const XOR_TO_BAT_SAN: Record<number, string> = {
      0: "1",
      7: "9",
      2: "7",
      4: "6",
      3: "4",
      5: "3",
      6: "2",
      1: "8",
    };
    return XOR_TO_BAT_SAN[diff] || "";
  };

  const handleExport = async () => {
    if (exportRef.current) {
      // Wait a small amount to ensure rendering is settled
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const canvas = await toCanvas(exportRef.current, { pixelRatio: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`MachThaiTuDich_${name || "Thanchu"}.pdf`);
      } catch (err) {
        console.error("Export error", err);
      }
    }
  };

  const getPalaceForBranch = (branchLabel: string) => {
    if (explicitPalaces[branchLabel]) return explicitPalaces[branchLabel];
    if (!palaceStart) return "";
    const branchIdx = BRANCHES.indexOf(branchLabel);
    if (branchIdx === -1) return "";

    const startBranchIdx = BRANCHES.indexOf(palaceStart.branch);
    const startPalaceIdx = PALACES.indexOf(palaceStart.palace);

    const offset = (branchIdx - startBranchIdx + 12) % 12;
    const currentPalaceIdx = (startPalaceIdx + offset) % 12;
    return PALACES[currentPalaceIdx];
  };

  const handlePalaceChange = (branch: string, palace: string) => {
    if (!palace) {
      setPalaceStart(null);
      setExplicitPalaces({});
    } else {
      setPalaceStart({ branch, palace });
      setExplicitPalaces({});
    }
  };

  const getCalculatedTrigramName = (label: string): string => {
    let r = -1,
      c = -1,
      topBot = -1;
    switch (label) {
      case "Tỵ":
        r = 1;
        c = 0;
        topBot = 0;
        break;
      case "Ngọ":
        r = 1;
        c = 0;
        topBot = 1;
        break;
      case "Dậu":
        r = 1;
        c = 2;
        topBot = 0;
        break;
      case "Thân":
        r = 1;
        c = 2;
        topBot = 1;
        break;
      case "Sửu":
        r = 2;
        c = 0;
        topBot = 0;
        break;
      case "Thìn":
        r = 2;
        c = 0;
        topBot = 1;
        break;
      case "Mão":
        r = 0;
        c = 0;
        topBot = 0;
        break;
      case "Dần":
        r = 0;
        c = 0;
        topBot = 1;
        break;
      case "Hợi":
        r = 2;
        c = 1;
        topBot = 0;
        break;
      case "Tý":
        r = 2;
        c = 1;
        topBot = 1;
        break;
      case "Mùi":
        r = 0;
        c = 1;
        topBot = 0;
        break;
      case "Tuất":
        r = 0;
        c = 1;
        topBot = 1;
        break;
      case "Năm - Thủy":
        r = 2;
        c = 2;
        topBot = 0;
        break;
      case "Tháng - Kim":
        r = 2;
        c = 2;
        topBot = 1;
        break;
      case "Giờ - Mộc":
        r = 0;
        c = 2;
        topBot = 0;
        break;
      case "Ngày - Hỏa":
        r = 0;
        c = 2;
        topBot = 1;
        break;
    }
    if (r === -1) return "";
    const idx1 = topBot === 0 ? 0 : 2;
    const idx2 = topBot === 0 ? 1 : 3;
    const tNum = getRootPalaceTrigram(
      resolveTrigramValue(gridExtraData[r][c][idx1], r, c, idx1, gridExtraData),
      resolveTrigramValue(gridExtraData[r][c][idx2], r, c, idx2, gridExtraData),
    );
    if (!tNum) return "";

    const map: Record<string, string> = {
      "1": "Khảm",
      "2": "Khôn",
      "3": "Chấn",
      "4": "Tốn",
      "6": "Càn",
      "7": "Đoài",
      "8": "Cấn",
      "9": "Ly",
    };
    return map[tNum] || "";
  };

  const getCalculatedVanQueName = (label: string): string => {
    let r = -1,
      c = -1,
      topBot = -1;
    switch (label) {
      case "Tỵ":
        r = 1;
        c = 0;
        topBot = 0;
        break;
      case "Ngọ":
        r = 1;
        c = 0;
        topBot = 1;
        break;
      case "Dậu":
        r = 1;
        c = 2;
        topBot = 0;
        break;
      case "Thân":
        r = 1;
        c = 2;
        topBot = 1;
        break;
      case "Sửu":
        r = 2;
        c = 0;
        topBot = 0;
        break;
      case "Thìn":
        r = 2;
        c = 0;
        topBot = 1;
        break;
      case "Mão":
        r = 0;
        c = 0;
        topBot = 0;
        break;
      case "Dần":
        r = 0;
        c = 0;
        topBot = 1;
        break;
      case "Hợi":
        r = 2;
        c = 1;
        topBot = 0;
        break;
      case "Tý":
        r = 2;
        c = 1;
        topBot = 1;
        break;
      case "Mùi":
        r = 0;
        c = 1;
        topBot = 0;
        break;
      case "Tuất":
        r = 0;
        c = 1;
        topBot = 1;
        break;
      case "Năm - Thủy":
        r = 2;
        c = 2;
        topBot = 0;
        break;
      case "Tháng - Kim":
        r = 2;
        c = 2;
        topBot = 1;
        break;
      case "Giờ - Mộc":
        r = 0;
        c = 2;
        topBot = 0;
        break;
      case "Ngày - Hỏa":
        r = 0;
        c = 2;
        topBot = 1;
        break;
    }
    if (r === -1) return "";
    const idx1 = topBot === 0 ? 0 : 2;
    const idx2 = topBot === 0 ? 1 : 3;
    const tNum = getBatSanTrigram(
      resolveTrigramValue(gridExtraData[r][c][idx1], r, c, idx1, gridExtraData),
      resolveTrigramValue(gridExtraData[r][c][idx2], r, c, idx2, gridExtraData),
    );
    if (!tNum) return "";

    const map: Record<string, string> = {
      "1": "Khảm",
      "2": "Khôn",
      "3": "Chấn",
      "4": "Tốn",
      "6": "Càn",
      "7": "Đoài",
      "8": "Cấn",
      "9": "Ly",
    };
    return map[tNum] || "";
  };

  const handleBlackButtonClick = () => {
    const newTrigrams: Record<
      string,
      { value: string; source: "black" | "blue" }
    > = {};
    const branchesToUpdate = [
      "Tỵ",
      "Ngọ",
      "Dậu",
      "Thân",
      "Sửu",
      "Thìn",
      "Mão",
      "Dần",
      "Hợi",
      "Tý",
      "Mùi",
      "Tuất",
      "Năm - Thủy",
      "Tháng - Kim",
      "Giờ - Mộc",
      "Ngày - Hỏa",
    ];
    branchesToUpdate.forEach((b) => {
      const val = getCalculatedTrigramName(b);
      if (val) {
        newTrigrams[b] = { value: val, source: "black" };
      }
    });
    setExplicitCalculatedTrigrams(newTrigrams);
  };

  const handleBlueButtonClick = () => {
    const newTrigrams: Record<
      string,
      { value: string; source: "black" | "blue" }
    > = {};
    const branchesToUpdate = [
      "Tỵ",
      "Ngọ",
      "Dậu",
      "Thân",
      "Sửu",
      "Thìn",
      "Mão",
      "Dần",
      "Hợi",
      "Tý",
      "Mùi",
      "Tuất",
      "Năm - Thủy",
      "Tháng - Kim",
      "Giờ - Mộc",
      "Ngày - Hỏa",
    ];
    branchesToUpdate.forEach((b) => {
      const val = getCalculatedVanQueName(b);
      if (val) {
        newTrigrams[b] = { value: val, source: "blue" };
      }
    });
    setExplicitCalculatedTrigrams(newTrigrams);
  };

  const rows = [
    [
      {
        labels: ["Tỵ", "Ngọ"],
        trigram: [false, false, true],
        content: (
          <CellContent
            rows={[{ label: "Tỵ" }, { label: "Ngọ" }]}
            originalTrigram={[false, false, true]}
            getPalace={getPalaceForBranch}
            onPalaceChange={handlePalaceChange}
            onShowMedical={setMedicalInfo}
            getCalculatedTrigram={(l) => explicitCalculatedTrigrams[l] || ""}
            selectedTrigrams={manualTrigrams}
            onSelectedChange={(l, v) =>
              setManualTrigrams((prev) => ({ ...prev, [l]: v }))
            }
            tuanBranches={tuanBranches}
            trietBranches={trietBranches}
          />
        ),
      },
      {
        labels: ["Dậu", "Thân"],
        trigram: [false, true, true],
        content: (
          <CellContent
            rows={[{ label: "Dậu" }, { label: "Thân" }]}
            originalTrigram={[false, true, true]}
            getPalace={getPalaceForBranch}
            onPalaceChange={handlePalaceChange}
            onShowMedical={setMedicalInfo}
            getCalculatedTrigram={(l) => explicitCalculatedTrigrams[l] || ""}
            selectedTrigrams={manualTrigrams}
            onSelectedChange={(l, v) =>
              setManualTrigrams((prev) => ({ ...prev, [l]: v }))
            }
            tuanBranches={tuanBranches}
            trietBranches={trietBranches}
          />
        ),
      },
    ],
    [
      {
        labels: ["Sửu", "Thìn"],
        trigram: [true, false, false],
        content: (
          <CellContent
            rows={[{ label: "Sửu" }, { label: "Thìn" }]}
            originalTrigram={[true, false, false]}
            getPalace={getPalaceForBranch}
            onPalaceChange={handlePalaceChange}
            onShowMedical={setMedicalInfo}
            getCalculatedTrigram={(l) => explicitCalculatedTrigrams[l] || ""}
            selectedTrigrams={manualTrigrams}
            onSelectedChange={(l, v) =>
              setManualTrigrams((prev) => ({ ...prev, [l]: v }))
            }
            tuanBranches={tuanBranches}
            trietBranches={trietBranches}
          />
        ),
      },
      {
        labels: ["Mão", "Dần"],
        trigram: [true, true, false],
        content: (
          <CellContent
            rows={[{ label: "Mão" }, { label: "Dần" }]}
            originalTrigram={[true, true, false]}
            getPalace={getPalaceForBranch}
            onPalaceChange={handlePalaceChange}
            onShowMedical={setMedicalInfo}
            getCalculatedTrigram={(l) => explicitCalculatedTrigrams[l] || ""}
            selectedTrigrams={manualTrigrams}
            onSelectedChange={(l, v) =>
              setManualTrigrams((prev) => ({ ...prev, [l]: v }))
            }
            tuanBranches={tuanBranches}
            trietBranches={trietBranches}
          />
        ),
      },
    ],
    [
      {
        labels: ["Hợi", "Tý"],
        trigram: [false, true, false],
        content: (
          <CellContent
            rows={[{ label: "Hợi" }, { label: "Tý" }]}
            originalTrigram={[false, true, false]}
            getPalace={getPalaceForBranch}
            onPalaceChange={handlePalaceChange}
            onShowMedical={setMedicalInfo}
            getCalculatedTrigram={(l) => explicitCalculatedTrigrams[l] || ""}
            selectedTrigrams={manualTrigrams}
            onSelectedChange={(l, v) =>
              setManualTrigrams((prev) => ({ ...prev, [l]: v }))
            }
            tuanBranches={tuanBranches}
            trietBranches={trietBranches}
          />
        ),
      },
      {
        labels: ["Mùi", "Tuất"],
        trigram: [true, false, true],
        content: (
          <CellContent
            rows={[{ label: "Mùi" }, { label: "Tuất" }]}
            originalTrigram={[true, false, true]}
            getPalace={getPalaceForBranch}
            onPalaceChange={handlePalaceChange}
            onShowMedical={setMedicalInfo}
            getCalculatedTrigram={(l) => explicitCalculatedTrigrams[l] || ""}
            selectedTrigrams={manualTrigrams}
            onSelectedChange={(l, v) =>
              setManualTrigrams((prev) => ({ ...prev, [l]: v }))
            }
            tuanBranches={tuanBranches}
            trietBranches={trietBranches}
          />
        ),
      },
    ],
    [
      {
        labels: ["Năm - Thủy", "Tháng - Kim"],
        trigram: [true, true, true],
        content: (
          <CellContent
            rows={[{ label: "Năm - Thủy" }, { label: "Tháng - Kim" }]}
            originalTrigram={[true, true, true]}
            getPalace={getPalaceForBranch}
            onPalaceChange={handlePalaceChange}
            onShowMedical={setMedicalInfo}
            getCalculatedTrigram={(l) => explicitCalculatedTrigrams[l] || ""}
            selectedTrigrams={manualTrigrams}
            onSelectedChange={(l, v) =>
              setManualTrigrams((prev) => ({ ...prev, [l]: v }))
            }
            tuanBranches={tuanBranches}
            trietBranches={trietBranches}
          />
        ),
      },
      {
        labels: ["Giờ - Mộc", "Ngày - Hỏa"],
        trigram: [false, false, false],
        content: (
          <CellContent
            rows={[{ label: "Giờ - Mộc" }, { label: "Ngày - Hỏa" }]}
            originalTrigram={[false, false, false]}
            getPalace={getPalaceForBranch}
            onPalaceChange={handlePalaceChange}
            onShowMedical={setMedicalInfo}
            getCalculatedTrigram={(l) => explicitCalculatedTrigrams[l] || ""}
            selectedTrigrams={manualTrigrams}
            onSelectedChange={(l, v) =>
              setManualTrigrams((prev) => ({ ...prev, [l]: v }))
            }
            tuanBranches={tuanBranches}
            trietBranches={trietBranches}
          />
        ),
      },
    ],
  ];

  return (
    <div className="w-full py-4 sm:py-6 md:py-8" ref={exportRef}>
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 md:gap-8">
        {/* Profile Info Section */}
        <div className="bg-white p-3 sm:p-4 md:p-5 rounded-xl md:rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] w-full max-w-3xl mx-auto flex flex-col gap-2 sm:gap-4 relative">
          <button
            onClick={handleExport}
            className="absolute top-4 right-4 p-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 font-bold text-sm"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
            <div className="p-2 bg-gradient-to-tr from-amber-100 to-orange-50 rounded-xl">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Thông tin thân chủ
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-sm font-bold text-slate-700">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ tên..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-slate-50 transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">
                Thời gian (Âm lịch sẽ tự động tính)
              </span>
              {isAutoUpdate !== undefined && (
                <button
                  onClick={() => onAutoUpdateChange(!isAutoUpdate)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full text-center leading-tight transition-all ${
                    isAutoUpdate
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {isAutoUpdate ? "Tự động giờ h.tại" : "Đang nhập thủ công"}
                </button>
              )}
            </div>

            <div className="w-full pt-1">
              <div className="w-full">
                <div className="grid grid-cols-[40px_1fr_1fr_1fr_1.5fr] items-stretch border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-sm">
                  {/* Headers */}
                  <div className="bg-slate-100 border-r border-slate-200"></div>
                  <div className="bg-slate-100 text-slate-500 text-[10px] sm:text-xs uppercase tracking-wider py-1.5 sm:py-2 text-center font-bold border-r border-slate-200">
                    Dương
                  </div>
                  <div className="bg-slate-100 text-slate-500 text-[10px] sm:text-xs uppercase tracking-wider py-1.5 sm:py-2 text-center font-bold border-r border-slate-200">
                    Âm
                  </div>
                  <div className="bg-slate-100 text-slate-500 text-[10px] sm:text-xs uppercase tracking-wider py-1.5 sm:py-2 text-center font-bold border-r border-slate-200">
                    Số dư
                  </div>
                  <div className="bg-slate-100 text-slate-500 text-[10px] sm:text-xs uppercase tracking-wider py-1.5 sm:py-2 text-center font-bold">
                    Can Chi
                  </div>

                  {/* Năm */}
                  <div className="bg-slate-100 text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest py-1 md:py-2 text-center flex items-center justify-center border-t border-slate-200">
                    Năm
                  </div>
                  <div className="p-0.5 sm:p-1 border-t border-r border-slate-200 bg-white flex items-center justify-center">
                    <input
                      type="number"
                      name="year"
                      value={date?.year || ""}
                      onChange={onChange}
                      className="bg-transparent text-slate-900 text-xs sm:text-sm py-1 font-mono font-medium focus:outline-none w-full text-center"
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-mono text-center p-0.5 sm:p-1 border-t border-r border-slate-200 bg-white flex items-center justify-center font-bold">
                    {date?.year ? lunarInfo?.lunarYear || date.year : "--"}
                  </div>
                  <div className="text-xs sm:text-sm text-amber-700 font-bold text-center p-0.5 sm:p-1 border-t border-r border-slate-200 bg-white flex items-center justify-center">
                    {getRemainder(
                      date?.year
                        ? lunarInfo?.lunarYear || date.year
                        : undefined,
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-black whitespace-nowrap text-center p-0.5 sm:p-1 border-t border-slate-200 bg-white flex flex-col items-center justify-center">
                    {date?.year
                      ? lunarInfo?.lunarYearName
                        ? renderColoredCanChi(lunarInfo?.lunarYearName)
                        : "--"
                      : "--"}
                    {date?.year && (
                      <div className="flex flex-col gap-0.5 mt-1 text-[10px] sm:text-xs">
                        <div className="flex gap-1 items-center justify-center">
                          <span className="text-red-500 font-bold">Tuần:</span>
                          <span className="text-slate-700">{tuan || "--"}</span>
                        </div>
                        <div className="flex gap-1 items-center justify-center">
                          <span className="text-red-600 font-bold">Triệt:</span>
                          <span className="text-slate-700">
                            {triet || "--"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tháng */}
                  <div className="bg-slate-100 text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest py-1 md:py-2 text-center flex items-center justify-center border-t border-slate-200">
                    Tháng
                  </div>
                  <div className="p-0.5 sm:p-1 border-t border-r border-slate-200 bg-white flex items-center justify-center">
                    <input
                      type="number"
                      name="month"
                      min="1"
                      max="12"
                      value={date?.month || ""}
                      onChange={onChange}
                      className="bg-transparent text-slate-900 text-xs sm:text-sm py-1 font-mono font-medium focus:outline-none w-full text-center"
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-mono text-center p-0.5 sm:p-1 border-t border-r border-slate-200 bg-white flex items-center justify-center font-bold">
                    {date?.month ? lunarInfo?.lunarMonth || "--" : "--"}
                  </div>
                  <div className="text-xs sm:text-sm text-amber-700 font-bold text-center p-0.5 sm:p-1 border-t border-r border-slate-200 bg-white flex items-center justify-center">
                    {getRemainder(
                      date?.month ? lunarInfo?.lunarMonth : undefined,
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-black whitespace-nowrap text-center p-0.5 sm:p-1 border-t border-slate-200 bg-white flex items-center justify-center">
                    {date?.month
                      ? lunarInfo?.lunarMonthName
                        ? renderColoredCanChi(lunarInfo?.lunarMonthName)
                        : "--"
                      : "--"}
                  </div>

                  {/* Ngày */}
                  <div className="bg-slate-100 text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest py-1 md:py-2 text-center flex items-center justify-center border-t border-slate-200">
                    Ngày
                  </div>
                  <div className="p-0.5 sm:p-1 border-t border-r border-slate-200 bg-white flex items-center justify-center">
                    <input
                      type="number"
                      name="day"
                      min="1"
                      max="31"
                      value={date?.day || ""}
                      onChange={onChange}
                      className="bg-transparent text-slate-900 text-xs sm:text-sm py-1 font-mono font-medium focus:outline-none w-full text-center"
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-mono text-center p-0.5 sm:p-1 border-t border-r border-slate-200 bg-white flex items-center justify-center font-bold">
                    {date?.day ? lunarInfo?.lunarDay || "--" : "--"}
                  </div>
                  <div className="text-xs sm:text-sm text-amber-700 font-bold text-center p-0.5 sm:p-1 border-t border-r border-slate-200 bg-white flex items-center justify-center">
                    {getRemainder(date?.day ? lunarInfo?.lunarDay : undefined)}
                  </div>
                  <div className="text-xs sm:text-sm font-black whitespace-nowrap text-center p-0.5 sm:p-1 border-t border-slate-200 bg-white flex items-center justify-center">
                    {date?.day
                      ? lunarInfo?.lunarDayName
                        ? renderColoredCanChi(lunarInfo?.lunarDayName)
                        : "--"
                      : "--"}
                  </div>

                  {/* Giờ */}
                  <div className="bg-slate-100 text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest py-1 md:py-2 text-center flex items-center justify-center border-t border-slate-200">
                    Giờ
                  </div>
                  <div className="p-0.5 sm:p-1 border-t border-r border-slate-200 bg-white flex items-center justify-center">
                    <input
                      type="number"
                      name="hour"
                      min="0"
                      max="23"
                      value={date?.hour ?? ""}
                      onChange={onChange}
                      className="bg-transparent text-slate-900 text-xs sm:text-sm py-1 font-mono font-medium focus:outline-none w-full text-center"
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-mono text-center p-0.5 sm:p-1 border-t border-r border-slate-200 bg-white flex items-center justify-center font-bold">
                    {date?.hour !== "" && date?.hour !== undefined
                      ? lunarInfo?.lunarHourIndex || "--"
                      : "--"}
                  </div>
                  <div className="text-xs sm:text-sm text-amber-700 font-bold text-center p-0.5 sm:p-1 border-t border-r border-slate-200 bg-white flex items-center justify-center">
                    {getRemainder(
                      date?.hour !== "" && date?.hour !== undefined
                        ? lunarInfo?.lunarHourIndex
                        : undefined,
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-black whitespace-nowrap text-center p-0.5 sm:p-1 border-t border-slate-200 bg-white flex items-center justify-center">
                    {date?.hour !== "" && date?.hour !== undefined
                      ? lunarInfo?.lunarHourName
                        ? renderColoredCanChi(lunarInfo?.lunarHourName)
                        : "--"
                      : "--"}
                  </div>
                </div>

                {/* Separate Custom Trigrams Column aligned with the first column */}
                <div className="mt-2 ml-[1px]">
                  <div className="flex gap-2">
                    {/* The main column of 4 */}
                    <div className="flex flex-col gap-1 w-[38px] md:w-[40px]">
                      {[0, 1, 2, 3].map((idx) => (
                        <CustomSelect
                          key={idx}
                          value={customTrigrams[idx]}
                          onChange={(v) => {
                            const next = [...customTrigrams];
                            next[idx] = v;
                            setCustomTrigrams(next);
                          }}
                        />
                      ))}
                    </div>

                    {/* The 3 additional cells positioned horizontally next to the gaps */}
                    <div className="flex flex-col gap-1 w-[38px] md:w-[40px]">
                      {/* Cell 4 (Upper gap) */}
                      <div className="mt-[18px] md:mt-[20px]">
                        <CustomSelect
                          value={customTrigrams[4]}
                          onChange={(v) => {
                            const next = [...customTrigrams];
                            next[4] = v;
                            setCustomTrigrams(next);
                          }}
                        />
                      </div>
                      {/* Cell 6 and 7 (Middle gap) - Two text selection cells horizontally */}
                      <div className="mt-1 md:mt-1.5 flex gap-1">
                        <CustomTextSelect
                          value={customTrigrams[6]}
                          onChange={(v) => {
                            const next = [...customTrigrams];
                            next[6] = v;
                            setCustomTrigrams(next);
                          }}
                        />
                        <CustomSelect
                          value={customTrigrams[7]}
                          onChange={(v) => {
                            const next = [...customTrigrams];
                            next[7] = v;
                            setCustomTrigrams(next);
                          }}
                        />
                      </div>
                      {/* Cell 5 (Lower gap) */}
                      <div className="mt-1 md:mt-1.5">
                        <CustomSelect
                          value={customTrigrams[5]}
                          onChange={(v) => {
                            const next = [...customTrigrams];
                            next[5] = v;
                            setCustomTrigrams(next);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3x3 Table Section */}
                <div className="mt-4 w-full flex flex-col items-center">
                  <div className="flex justify-between items-center w-full px-2 mb-2">
                    <div className="flex gap-2">
                      <button
                        onClick={handleBlackButtonClick}
                        className="w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded border border-slate-900 shadow-sm hover:bg-slate-700 active:scale-95 active:translate-y-px transition-all flex items-center justify-center text-white text-xs md:text-sm font-bold"
                        title="Nhập họ quẻ vào địa chi"
                      >
                        H
                      </button>
                      <button
                        onClick={handleBlueButtonClick}
                        className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded border border-blue-600 shadow-sm hover:bg-blue-400 active:scale-95 active:translate-y-px transition-all flex items-center justify-center text-white text-xs md:text-sm font-bold"
                        title="Nhập vận quẻ vào địa chi"
                      >
                        V
                      </button>
                    </div>
                    <button
                      onClick={() => setShowRightTrigrams(!showRightTrigrams)}
                      className="text-xs px-3 py-1.5 md:px-4 md:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-bold transition-all active:scale-95 active:translate-y-px shadow-sm"
                    >
                      {showRightTrigrams
                        ? "Hiển thị số (cột 4 ô)"
                        : "Hiển thị quẻ (cột 4 ô)"}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 aspect-[100/130] w-full sm:w-[65%] md:w-[55%] lg:w-[45%] xl:w-[38%] border-2 border-slate-400 rounded-xl md:rounded-3xl shadow-sm bg-white">
                    {[0, 1, 2].map((rowIndex) => (
                      <React.Fragment key={rowIndex}>
                        {[0, 1, 2].map((colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`border-slate-400 flex items-center justify-center relative
                              ${rowIndex !== 2 ? "border-b-2" : ""} 
                              ${colIndex !== 2 ? "border-r-2" : ""}`}
                          >
                            {/* Left Number Selection Cell (1-9) */}
                            <div className="w-[28%] h-full flex flex-col justify-center border-r border-slate-200">
                              <div className="h-full w-full">
                                <CustomNumberSelect
                                  value={gridNumberLeftData[rowIndex][colIndex]}
                                  onChange={(v) => {
                                    const newData = [
                                      ...gridNumberLeftData.map((row) => [
                                        ...row,
                                      ]),
                                    ];
                                    newData[rowIndex][colIndex] = v;

                                    if (
                                      rowIndex === 1 &&
                                      colIndex === 1 &&
                                      (!v || v === "")
                                    ) {
                                      setGridNumberLeftData(
                                        Array(3)
                                          .fill(null)
                                          .map(() => Array(3).fill("")),
                                      );
                                      return;
                                    }

                                    let filledCellsCount = 0;
                                    for (let r = 0; r < 3; r++) {
                                      for (let c = 0; c < 3; c++) {
                                        if (
                                          newData[r][c] &&
                                          newData[r][c] !== ""
                                        )
                                          filledCellsCount++;
                                      }
                                    }

                                    if (filledCellsCount === 3) {
                                      const rotatePath = (p: number[][]) =>
                                        p.map(([r, c]) => [c, 2 - r]);
                                      let f: number[][] = [
                                        [1, 1],
                                        [2, 2],
                                        [1, 2],
                                        [2, 0],
                                        [0, 1],
                                        [2, 1],
                                        [0, 2],
                                        [1, 0],
                                        [0, 0],
                                      ];
                                      let b: number[][] = [
                                        [1, 1],
                                        [2, 2],
                                        [2, 1],
                                        [0, 2],
                                        [1, 0],
                                        [1, 2],
                                        [2, 0],
                                        [0, 1],
                                        [0, 0],
                                      ];
                                      const paths: number[][][] = [];
                                      for (let i = 0; i < 4; i++) {
                                        paths.push(f);
                                        f = rotatePath(f);
                                      }
                                      for (let i = 0; i < 4; i++) {
                                        paths.push(b);
                                        b = rotatePath(b);
                                      }
                                      for (const path of paths) {
                                        const [r0, c0] = path[0];
                                        const [r1, c1] = path[1];
                                        const [r2, c2] = path[2];
                                        if (
                                          newData[r0][c0] &&
                                          newData[r1][c1] &&
                                          newData[r2][c2]
                                        ) {
                                          const v0 = parseInt(
                                            newData[r0][c0],
                                            10,
                                          );
                                          const v1 = parseInt(
                                            newData[r1][c1],
                                            10,
                                          );
                                          const v2 = parseInt(
                                            newData[r2][c2],
                                            10,
                                          );
                                          if (
                                            !isNaN(v0) &&
                                            !isNaN(v1) &&
                                            !isNaN(v2)
                                          ) {
                                            const diff1 = (v1 - v0 + 9) % 9;
                                            const diff2 = (v2 - v1 + 9) % 9;
                                            if (
                                              diff1 === diff2 &&
                                              (diff1 === 1 || diff1 === 8)
                                            ) {
                                              const step = diff1 === 1 ? 1 : -1;
                                              let currentVal = v0;
                                              for (
                                                let i = 0;
                                                i < path.length;
                                                i++
                                              ) {
                                                const [r, c] = path[i];
                                                newData[r][c] =
                                                  currentVal.toString();
                                                currentVal += step;
                                                if (currentVal > 9)
                                                  currentVal = 1;
                                                if (currentVal < 1)
                                                  currentVal = 9;
                                              }
                                              break;
                                            }
                                          }
                                        }
                                      }
                                    }

                                    setGridNumberLeftData(newData);
                                  }}
                                  className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800"
                                />
                              </div>
                            </div>

                            {/* Main large input area */}
                            <div className="w-[42%] h-full flex flex-col border-r border-slate-200">
                              {[0, 1, 2, 3].map((midIdx) => {
                                let calculatedValue = "";
                                if (midIdx === 0) {
                                  calculatedValue = getRootPalaceTrigram(
                                    resolveTrigramValue(
                                      gridExtraData[rowIndex][colIndex][0],
                                      rowIndex,
                                      colIndex,
                                      0,
                                      gridExtraData,
                                    ),
                                    resolveTrigramValue(
                                      gridExtraData[rowIndex][colIndex][1],
                                      rowIndex,
                                      colIndex,
                                      1,
                                      gridExtraData,
                                    ),
                                  );
                                } else if (midIdx === 1) {
                                  calculatedValue = getBatSanTrigram(
                                    resolveTrigramValue(
                                      gridExtraData[rowIndex][colIndex][0],
                                      rowIndex,
                                      colIndex,
                                      0,
                                      gridExtraData,
                                    ),
                                    resolveTrigramValue(
                                      gridExtraData[rowIndex][colIndex][1],
                                      rowIndex,
                                      colIndex,
                                      1,
                                      gridExtraData,
                                    ),
                                  );
                                } else if (midIdx === 2) {
                                  calculatedValue = getRootPalaceTrigram(
                                    resolveTrigramValue(
                                      gridExtraData[rowIndex][colIndex][2],
                                      rowIndex,
                                      colIndex,
                                      2,
                                      gridExtraData,
                                    ),
                                    resolveTrigramValue(
                                      gridExtraData[rowIndex][colIndex][3],
                                      rowIndex,
                                      colIndex,
                                      3,
                                      gridExtraData,
                                    ),
                                  );
                                } else if (midIdx === 3) {
                                  calculatedValue = getBatSanTrigram(
                                    resolveTrigramValue(
                                      gridExtraData[rowIndex][colIndex][2],
                                      rowIndex,
                                      colIndex,
                                      2,
                                      gridExtraData,
                                    ),
                                    resolveTrigramValue(
                                      gridExtraData[rowIndex][colIndex][3],
                                      rowIndex,
                                      colIndex,
                                      3,
                                      gridExtraData,
                                    ),
                                  );
                                }
                                const displayString =
                                  getTrigramDisplay(calculatedValue);

                                return (
                                  <div
                                    key={midIdx}
                                    className={`h-1/4 w-full relative flex items-center justify-center bg-slate-50 ${midIdx !== 3 ? "border-b border-slate-200" : ""}`}
                                  >
                                    <span
                                      className={`text-slate-800 ${displayString && calculatedValue !== "5" ? "text-2xl md:text-[2rem] lg:text-[2.5rem] font-bold leading-none" : "text-lg md:text-2xl lg:text-3xl font-black"} transition-colors`}
                                    >
                                      {displayString}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Column of 4 small cells on the right */}
                            <div className="w-[30%] h-full flex flex-col">
                              {[0, 1, 2, 3].map((sideIdx) => (
                                <div
                                  key={sideIdx}
                                  className={`w-full h-1/4 ${sideIdx !== 3 ? "border-b border-slate-300" : ""}`}
                                >
                                  <CustomNumberSelect
                                    value={
                                      gridExtraData[rowIndex][colIndex][sideIdx]
                                    }
                                    displayValue={
                                      showRightTrigrams
                                        ? getTrigramDisplay(
                                            gridExtraData[rowIndex][colIndex][
                                              sideIdx
                                            ],
                                            rowIndex,
                                            colIndex,
                                            sideIdx,
                                            gridExtraData,
                                          )
                                        : gridExtraData[rowIndex][colIndex][
                                              sideIdx
                                            ] === "5"
                                          ? resolveTrigramValue(
                                              gridExtraData[rowIndex][colIndex][
                                                sideIdx
                                              ],
                                              rowIndex,
                                              colIndex,
                                              sideIdx,
                                              gridExtraData,
                                            )
                                          : undefined
                                    }
                                    className={`w-full h-full ${showRightTrigrams && gridExtraData[rowIndex][colIndex][sideIdx] !== "" && gridExtraData[rowIndex][colIndex][sideIdx] !== "5" ? "text-2xl md:text-[2.2rem] lg:text-[2.5rem] font-bold leading-none" : "text-lg md:text-2xl lg:text-3xl font-black"}`}
                                    textColorClass={
                                      !showRightTrigrams &&
                                      gridExtraData[rowIndex][colIndex][
                                        sideIdx
                                      ] === "5" &&
                                      resolveTrigramValue(
                                        gridExtraData[rowIndex][colIndex][
                                          sideIdx
                                        ],
                                        rowIndex,
                                        colIndex,
                                        sideIdx,
                                        gridExtraData,
                                      ) !== "5"
                                        ? "text-red-500"
                                        : "text-slate-800"
                                    }
                                    onChange={(v) => {
                                      const newData = [
                                        ...gridExtraData.map((r) =>
                                          r.map((c) => [...c]),
                                        ),
                                      ];
                                      newData[rowIndex][colIndex][sideIdx] = v;

                                      if (
                                        rowIndex === 1 &&
                                        colIndex === 1 &&
                                        (!v || v === "")
                                      ) {
                                        for (let r = 0; r < 3; r++) {
                                          for (let c = 0; c < 3; c++) {
                                            newData[r][c][sideIdx] = "";
                                          }
                                        }
                                        setGridExtraData(newData);
                                        return;
                                      }

                                      let filledCellsCount = 0;
                                      for (let r = 0; r < 3; r++) {
                                        for (let c = 0; c < 3; c++) {
                                          if (
                                            newData[r][c][sideIdx] &&
                                            newData[r][c][sideIdx] !== ""
                                          )
                                            filledCellsCount++;
                                        }
                                      }

                                      if (filledCellsCount === 3) {
                                        const rotatePath = (p: number[][]) =>
                                          p.map(([r, c]) => [c, 2 - r]);
                                        let f: number[][] = [
                                          [1, 1],
                                          [2, 2],
                                          [1, 2],
                                          [2, 0],
                                          [0, 1],
                                          [2, 1],
                                          [0, 2],
                                          [1, 0],
                                          [0, 0],
                                        ];
                                        let b: number[][] = [
                                          [1, 1],
                                          [2, 2],
                                          [2, 1],
                                          [0, 2],
                                          [1, 0],
                                          [1, 2],
                                          [2, 0],
                                          [0, 1],
                                          [0, 0],
                                        ];
                                        const paths: number[][][] = [];
                                        for (let i = 0; i < 4; i++) {
                                          paths.push(f);
                                          f = rotatePath(f);
                                        }
                                        for (let i = 0; i < 4; i++) {
                                          paths.push(b);
                                          b = rotatePath(b);
                                        }
                                        for (const path of paths) {
                                          const [r0, c0] = path[0];
                                          const [r1, c1] = path[1];
                                          const [r2, c2] = path[2];
                                          if (
                                            newData[r0][c0][sideIdx] &&
                                            newData[r1][c1][sideIdx] &&
                                            newData[r2][c2][sideIdx]
                                          ) {
                                            const v0 = parseInt(
                                              newData[r0][c0][sideIdx],
                                              10,
                                            );
                                            const v1 = parseInt(
                                              newData[r1][c1][sideIdx],
                                              10,
                                            );
                                            const v2 = parseInt(
                                              newData[r2][c2][sideIdx],
                                              10,
                                            );
                                            if (
                                              !isNaN(v0) &&
                                              !isNaN(v1) &&
                                              !isNaN(v2)
                                            ) {
                                              const diff1 = (v1 - v0 + 9) % 9;
                                              const diff2 = (v2 - v1 + 9) % 9;
                                              if (
                                                diff1 === diff2 &&
                                                (diff1 === 1 || diff1 === 8)
                                              ) {
                                                const step =
                                                  diff1 === 1 ? 1 : -1;
                                                let currentVal = v0;
                                                for (
                                                  let i = 0;
                                                  i < path.length;
                                                  i++
                                                ) {
                                                  const [r, c] = path[i];
                                                  newData[r][c][sideIdx] =
                                                    currentVal.toString();
                                                  currentVal += step;
                                                  if (currentVal > 9)
                                                    currentVal = 1;
                                                  if (currentVal < 1)
                                                    currentVal = 9;
                                                }
                                                break;
                                              }
                                            }
                                          }
                                        }
                                      }

                                      setGridExtraData(newData);
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8">
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-8 lg:gap-10"
            >
              {row.map((cell: any, j) => {
                const b1 = cell.labels?.[0];
                const b2 = cell.labels?.[1];

                const checkHas = (branch: string, listStr: string) => {
                  if (!branch || !listStr || listStr === "Không") return false;
                  const b = branch.normalize("NFC").split(" ")[0]; // Lấy chữ cái đầu (vd: Mão)
                  return listStr.normalize("NFC").includes(b);
                };

                const b1Tuan = checkHas(b1, tuan);
                const b1Triet = checkHas(b1, triet);
                const b2Tuan = checkHas(b2, tuan);
                const b2Triet = checkHas(b2, triet);

                return (
                  <div
                    key={j}
                    className="flex bg-white p-2 sm:p-4 md:p-6 lg:p-8 rounded-xl md:rounded-3xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] items-center gap-2 sm:gap-4 md:gap-6 hover:shadow-[0_4px_15px_rgba(0,0,0,0.06)] transition-all relative group"
                  >
                    <div className="w-[1.2rem] sm:w-[1.5rem] md:w-[2.2rem] lg:w-[4rem] shrink-0 relative flex flex-col items-center h-full min-h-[4.5rem] sm:min-h-[6.5rem]">
                      {/* Top slot for Branch 1 T/R - Aligned with first row */}
                      <div className="h-5 sm:h-7 flex items-center justify-center shrink-0">
                        {b1Tuan && (
                          <div
                            className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-amber-200 bg-white shadow-sm flex items-center justify-center text-red-600 font-black text-[9px] sm:text-xs"
                            title="Tuần"
                          >
                            T
                          </div>
                        )}
                        {b1Triet && (
                          <div
                            className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-rose-200 bg-white shadow-sm flex items-center justify-center text-red-700 font-black text-[9px] sm:text-xs"
                            title="Triệt"
                          >
                            R
                          </div>
                        )}
                      </div>

                      {/* Middle slot for Trigram - Always centered */}
                      <div className="w-full flex-1 flex items-center justify-center py-1 sm:py-2">
                        <Trigram values={cell.trigram} />
                      </div>

                      {/* Bottom slot for Branch 2 T/R - Aligned with second row */}
                      <div className="h-5 sm:h-7 flex items-center justify-center shrink-0">
                        {b2Tuan && (
                          <div
                            className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-amber-200 bg-white shadow-sm flex items-center justify-center text-red-600 font-black text-[9px] sm:text-xs"
                            title="Tuần"
                          >
                            T
                          </div>
                        )}
                        {b2Triet && (
                          <div
                            className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-rose-200 bg-white shadow-sm flex items-center justify-center text-red-700 font-black text-[9px] sm:text-xs"
                            title="Triệt"
                          >
                            R
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 relative">{cell.content}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="mt-10 max-w-7xl mx-auto w-full px-4">
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col relative overflow-hidden ring-1 ring-slate-50">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-2xl shadow-sm">
                <BrainCircuit className="w-6 h-6 text-indigo-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg sm:text-xl">
                  Luận Giải Bộ Mạch AI
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Expert Thai To
                  Engine
                </p>
              </div>
            </div>

            {thaiToChat.length === 0 && (
              <button
                onClick={() => analyzeThaiTo()}
                disabled={isAnalyzing}
                className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${isAnalyzing ? "bg-slate-100 text-slate-400" : "bg-slate-900 text-white hover:bg-indigo-600 hover:scale-[1.02] shadow-indigo-200 active:scale-95"}`}
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                {isAnalyzing ? "Đang Giải Mã..." : "Luận Giải Đồ Bản"}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-col gap-3">

            {(thaiToChat.length > 0 || isAnalyzing) && (
              <div className="flex-1 overflow-y-auto max-h-[600px] space-y-6 rounded-3xl bg-slate-50/50 p-4 sm:p-6 border border-slate-100 shadow-inner custom-scrollbar">
                {thaiToChat.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-full animate-in fade-in slide-in-from-bottom-2 duration-500`}
                  >
                    {msg.role === "user" ? (
                      <div className="bg-slate-900 text-white px-6 py-3.5 rounded-3xl rounded-tr-sm text-sm font-bold max-w-[85%] shadow-xl">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="bg-white text-slate-800 p-3 sm:p-4 rounded-3xl rounded-tl-sm border border-slate-100 w-full prose prose-indigo max-w-none text-[14px] leading-relaxed markdown-body shadow-sm relative group">
                        {msg.text && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 transition-all">
                            <button
                              onClick={() => speakText(msg.text, idx)}
                              className={`p-2 rounded-xl transition-all shadow-sm border ${speakingIndex === idx ? "bg-indigo-100 text-indigo-600 border-indigo-200" : "bg-white/80 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 border-slate-100"}`}
                              title={
                                speakingIndex === idx
                                  ? "Dừng đọc"
                                  : "Đọc văn bản"
                              }
                            >
                              {speakingIndex === idx ? (
                                <Square className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text);
                                setCopiedIndex(idx);
                                setTimeout(() => setCopiedIndex(null), 2000);
                              }}
                              className="p-2 bg-white/80 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-slate-100"
                              title="Sao chép"
                            >
                              {copiedIndex === idx ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
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
                          <div className="flex flex-row items-center h-8 space-x-3">
                            <div className="flex space-x-1.5 pl-1">
                              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></div>
                            </div>
                            <div className="text-xs font-black uppercase text-indigo-500 tracking-wider whitespace-nowrap">
                              Đang phân giải đồ bản...
                            </div>
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
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 min-h-[100px] max-h-[200px] resize-none shadow-inner transition-all disabled:opacity-50"
                  placeholder="Hỏi AI về cát hung, thời cơ hoặc đại hạn dựa trên đồ bản hiện tại..."
                  value={
                    thaiToQuestion +
                    (interimThaiToQuestion
                      ? (thaiToQuestion ? " " : "") + interimThaiToQuestion
                      : "")
                  }
                  onChange={(e) => setThaiToQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (
                        (thaiToQuestion.trim() ||
                          interimThaiToQuestion.trim()) &&
                        !isAnalyzing
                      ) {
                        analyzeThaiTo(
                          thaiToQuestion +
                            (interimThaiToQuestion
                              ? " " + interimThaiToQuestion
                              : ""),
                        );
                      }
                    }
                  }}
                />
                <div className="flex items-center gap-2 mt-2">
                  <VoiceInput
                    onResult={(text, isFinal) => {
                      if (isFinal) {
                        setThaiToQuestion((prev) =>
                          prev ? prev + " " + text : text,
                        );
                        setInterimThaiToQuestion("");
                      } else {
                        setInterimThaiToQuestion(text);
                      }
                    }}
                    className="p-3 bg-slate-100 text-slate-600 rounded-2xl shadow-sm hover:bg-slate-200"
                    iconSize={20}
                  />
                  {(thaiToQuestion.trim() || interimThaiToQuestion.trim()) &&
                    !isAnalyzing && (
                      <button
                        onClick={() =>
                          analyzeThaiTo(
                            thaiToQuestion +
                              (interimThaiToQuestion
                                ? " " + interimThaiToQuestion
                                : ""),
                          )
                        }
                        className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-90"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {medicalInfo && (
          <MedicalModal
            info={medicalInfo}
            onClose={() => setMedicalInfo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
