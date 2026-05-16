import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Solar, Lunar, LunarUtil } from "lunar-javascript";
import { GenerateContentResponse } from "@google/genai";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HEXAGRAM_MEANINGS } from "./hexagramMeanings";
import { TRIGRAM_NATURES, HEXAGRAM_RELATIONS } from "./hexagramDetails";
import {
  Heart,
  Calendar,
  Info,
  ChevronDown,
  Sparkles,
  User,
  UserCircle,
  Clock,
  Globe,
  CircleDot,
  AlertCircle,
  BrainCircuit,
  MessageSquareShare,
  Send,
  Zap,
  Copy,
  Check,
  Save,
  Users,
  Trash2,
  FolderOpen,
  Plus,
  KeyRound,
  Settings,
  Book,
  Hand,
  Compass,
  Menu,
  RefreshCw,
  Download,
} from "lucide-react";
import { TuViTab } from "./components/TuViTab";
import { XemNgayTab } from "./components/XemNgayTab";
import { ThaiToTab } from "./components/ThaiToTab";
import KyMonTab from "./components/KyMonTab";
import { ThaiAtApp } from "./components/ThaiAt/ThaiAtApp";
import { AIChatAssistant } from "./components/AIChatAssistant";

import { TuTruTab } from "./components/Tabs/TuTruTab";
import { HonNhanTab } from "./components/Tabs/HonNhanTab";
import AdminModal from "./components/AdminModal";
import { handleAIError } from "./utils/aiErrorHandler";
import { sanitizeApiContents } from "./utils/aiHelpers";
import { getAI } from "./services/aiService";
import { GEMINI_MODEL, RECOMMENDED_MODELS } from "./constants/ai";
import { auth } from "./services/firebaseService";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

// Helper to get Gemini AI instance with the correct key

function sumDigits(num: number): number {
  let current = num;
  while (current >= 10) {
    current = String(current)
      .split("")
      .reduce((acc, digit) => acc + Number(digit), 0);
  }
  return current;
}

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

const GAN_INFO: Record<string, { element: string; polarity: "Yang" | "Yin" }> =
  {
    Giáp: { element: "Mộc", polarity: "Yang" },
    Ất: { element: "Mộc", polarity: "Yin" },
    Bính: { element: "Hỏa", polarity: "Yang" },
    Đinh: { element: "Hỏa", polarity: "Yin" },
    Mậu: { element: "Thổ", polarity: "Yang" },
    Kỷ: { element: "Thổ", polarity: "Yin" },
    Canh: { element: "Kim", polarity: "Yang" },
    Tân: { element: "Kim", polarity: "Yin" },
    Nhâm: { element: "Thủy", polarity: "Yang" },
    Quý: { element: "Thủy", polarity: "Yin" },
  };

const ZHI_INFO: Record<string, { element: string; polarity: "Yang" | "Yin" }> =
  {
    Tý: { element: "Thủy", polarity: "Yang" },
    Sửu: { element: "Thổ", polarity: "Yin" },
    Dần: { element: "Mộc", polarity: "Yang" },
    Mão: { element: "Mộc", polarity: "Yin" },
    Thìn: { element: "Thổ", polarity: "Yang" },
    Tỵ: { element: "Hỏa", polarity: "Yin" },
    Ngọ: { element: "Hỏa", polarity: "Yang" },
    Mùi: { element: "Thổ", polarity: "Yin" },
    Thân: { element: "Kim", polarity: "Yang" },
    Dậu: { element: "Kim", polarity: "Yin" },
    Tuất: { element: "Thổ", polarity: "Yang" },
    Hợi: { element: "Thủy", polarity: "Yin" },
  };

const TANG_DON: Record<string, string[]> = {
  Tý: ["Quý"],
  Sửu: ["Kỷ", "Quý", "Tân"],
  Dần: ["Giáp", "Bính", "Mậu"],
  Mão: ["Ất"],
  Thìn: ["Mậu", "Ất", "Quý"],
  Tỵ: ["Bính", "Canh", "Mậu"],
  Ngọ: ["Đinh", "Kỷ"],
  Mùi: ["Kỷ", "Đinh", "Ất"],
  Thân: ["Canh", "Nhâm", "Mậu"],
  Dậu: ["Tân"],
  Tuất: ["Mậu", "Tân", "Đinh"],
  Hợi: ["Nhâm", "Giáp"],
};

const TRUONG_SINH_STAGES = [
  "Trường sinh",
  "Mộc dục",
  "Quan đới",
  "Lâm quan",
  "Đế vượng",
  "Suy",
  "Bệnh",
  "Tử",
  "Mộ",
  "Tuyệt",
  "Thai",
  "Dưỡng",
];

const TRUONG_SINH_START: Record<
  string,
  { startZhi: string; direction: 1 | -1 }
> = {
  Giáp: { startZhi: "Hợi", direction: 1 },
  Bính: { startZhi: "Dần", direction: 1 },
  Mậu: { startZhi: "Dần", direction: 1 },
  Canh: { startZhi: "Tỵ", direction: 1 },
  Nhâm: { startZhi: "Thân", direction: 1 },
  Ất: { startZhi: "Ngọ", direction: -1 },
  Đinh: { startZhi: "Dậu", direction: -1 },
  Kỷ: { startZhi: "Dậu", direction: -1 },
  Tân: { startZhi: "Tý", direction: -1 },
  Quý: { startZhi: "Mão", direction: -1 },
};

function getTruongSinh(gan: string, zhi: string) {
  const config = TRUONG_SINH_START[gan];
  if (!config) return "";
  const startIndex = ZHIS.indexOf(config.startZhi);
  const targetIndex = ZHIS.indexOf(zhi);
  let steps = (targetIndex - startIndex + 12) % 12;
  if (config.direction === -1) {
    steps = (startIndex - targetIndex + 12) % 12;
  }
  return TRUONG_SINH_STAGES[steps];
}

function getThapThan(dayGan: string, targetGan: string) {
  const dayInfo = GAN_INFO[dayGan];
  const targetInfo = GAN_INFO[targetGan];
  if (!dayInfo || !targetInfo) return "";

  const elements = ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"];
  const dayElemIdx = elements.indexOf(dayInfo.element);
  const targetElemIdx = elements.indexOf(targetInfo.element);
  const diff = (targetElemIdx - dayElemIdx + 5) % 5;

  // Âm gặp Âm, Dương gặp Dương (Cùng dấu) => Tỷ, Thực, T.Tài, Sát, Kiêu
  // Âm gặp Dương, Dương gặp Âm (Khác dấu) => Kiếp, Thương, C.Tài, Quan, Ấn
  const samePolarity = dayInfo.polarity === targetInfo.polarity;

  if (diff === 0) return samePolarity ? "Tỷ" : "Kiếp";
  if (diff === 1) return samePolarity ? "Thực" : "Thương";
  if (diff === 2) return samePolarity ? "T.Tài" : "C.Tài";
  if (diff === 3) return samePolarity ? "Sát" : "Quan";
  if (diff === 4) return samePolarity ? "Kiêu" : "Ấn";

  return "";
}

const ZHI_XUNG: Record<string, string> = {
  Tý: "Ngọ",
  Ngọ: "Tý",
  Sửu: "Mùi",
  Mùi: "Sửu",
  Dần: "Thân",
  Thân: "Dần",
  Mão: "Dậu",
  Dậu: "Mão",
  Thìn: "Tuất",
  Tuất: "Thìn",
  Tỵ: "Hợi",
  Hợi: "Tỵ",
};

const ZHI_HOP: Record<string, string> = {
  Tý: "Sửu",
  Sửu: "Tý",
  Dần: "Hợi",
  Hợi: "Dần",
  Mão: "Tuất",
  Tuất: "Mão",
  Thìn: "Dậu",
  Dậu: "Thìn",
  Tỵ: "Thân",
  Thân: "Tỵ",
  Ngọ: "Mùi",
  Mùi: "Ngọ",
};

const GAN_HOP: Record<string, string> = {
  Giáp: "Kỷ",
  Kỷ: "Giáp",
  Ất: "Canh",
  Canh: "Ất",
  Bính: "Tân",
  Tân: "Bính",
  Đinh: "Nhâm",
  Nhâm: "Đinh",
  Mậu: "Quý",
  Quý: "Mậu",
};

const ELEMENT_KHAC: Record<string, string> = {
  Mộc: "Thổ",
  Thổ: "Thủy",
  Thủy: "Hỏa",
  Hỏa: "Kim",
  Kim: "Mộc",
};

function isThienKhacDiaXung(g1: string, z1: string, g2: string, z2: string) {
  if (ZHI_XUNG[z1] !== z2) return false;
  const e1 = GAN_INFO[g1]?.element;
  const e2 = GAN_INFO[g2]?.element;
  return ELEMENT_KHAC[e1] === e2 || ELEMENT_KHAC[e2] === e1;
}

function isThienHopDiaHop(g1: string, z1: string, g2: string, z2: string) {
  return GAN_HOP[g1] === g2 && ZHI_HOP[z1] === z2;
}

function getInteractionBgClass(gan: string, zhi: string, pillars: any[]) {
  const isTKDX = pillars.some((p) =>
    isThienKhacDiaXung(gan, zhi, p.gan, p.zhi),
  );
  const isTHDH = pillars.some((p) => isThienHopDiaHop(gan, zhi, p.gan, p.zhi));
  if (isTKDX) return "bg-[#FADBD8]"; // Soft Red for Clash
  if (isTHDH) return "bg-[#D1F2EB]"; // Soft Green for Harmony
  return "";
}

function getInteractionTextClass(gan: string, zhi: string, pillars: any[]) {
  const isTKDX = pillars.some((p) =>
    isThienKhacDiaXung(gan, zhi, p.gan, p.zhi),
  );
  const isTHDH = pillars.some((p) => isThienHopDiaHop(gan, zhi, p.gan, p.zhi));
  if (isTKDX || isTHDH) return "text-slate-900 font-bold";
  return "text-slate-500 font-medium";
}

function getThapThanClass(dayElement: string, targetElement: string) {
  if (!dayElement || !targetElement) return "";
  const elements = ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"];
  const dayIdx = elements.indexOf(dayElement);
  const targetIdx = elements.indexOf(targetElement);
  const diff = (targetIdx - dayIdx + 5) % 5;

  switch (diff) {
    case 0:
      return "Tỷ Kiếp";
    case 1:
      return "Thực Thương";
    case 2:
      return "Tài Tinh";
    case 3:
      return "Quan Sát";
    case 4:
      return "Ấn Tinh";
    default:
      return "";
  }
}

const NINE_STAR_MAP: Record<string, string> = {
  一: "1",
  二: "2",
  三: "3",
  四: "4",
  五: "5",
  六: "6",
  七: "7",
  八: "8",
  九: "9",
};

const NAYIN_MAP: Record<string, string> = {
  海中金: "Hải Trung Kim",
  炉中火: "Lư Trung Hỏa",
  大林木: "Đại Lâm Mộc",
  路旁土: "Lộ Bàng Thổ",
  剑锋金: "Kiếm Phong Kim",
  山头火: "Sơn Đầu Hỏa",
  涧下水: "Giản Hạ Thủy",
  城头土: "Thành Đầu Thổ",
  白蜡金: "Bạch Lạp Kim",
  杨柳木: "Dương Liễu Mộc",
  泉中水: "Tuyền Trung Thủy",
  屋上土: "Ốc Thượng Thổ",
  霹雳火: "Tích Lịch Hỏa",
  松柏木: "Tùng Bách Mộc",
  长流水: "Trường Lưu Thủy",
  沙中金: "Sa Trung Kim",
  山下火: "Sơn Hạ Hỏa",
  平地木: "Bình Địa Mộc",
  壁上土: "Bích Thượng Thổ",
  金箔金: "Kim Bạch Kim",
  覆灯火: "Phúc Đăng Hỏa",
  天河水: "Thiên Hà Thủy",
  大驿土: "Đại Dịch Thổ",
  钗钏金: "Thoa Xuyến Kim",
  桑柘木: "Tang Đố Mộc",
  大溪水: "Đại Khê Thủy",
  沙中土: "Sa Trung Thổ",
  天上火: "Thiên Thượng Hỏa",
  石榴木: "Thạch Lựu Mộc",
  大海水: "Đại Hải Thủy",
  "Giản Hạ Thủy": "Giản Hạ Thủy",
  "Tuyền Trung Thủy": "Tuyền Trung Thủy",
  "Trường Lưu Thủy": "Trường Lưu Thủy",
  "Thiên Hà Thủy": "Thiên Hà Thủy",
  "Đại Khê Thủy": "Đại Khê Thủy",
  "Đại Hải Thủy": "Đại Hải Thủy",
  "Sơn Đầu Hỏa": "Sơn Đầu Hỏa",
  "Sơn Hạ Hỏa": "Sơn Hạ Hỏa",
  "Lư Trung Hỏa": "Lư Trung Hỏa",
  "Tích Lịch Hỏa": "Tích Lịch Hỏa",
  "Thiên Thượng Hỏa": "Thiên Thượng Hỏa",
  "Phúc Đăng Hỏa": "Phúc Đăng Hỏa",
  "Kiếm Phong Kim": "Kiếm Phong Kim",
  "Bạch Lạp Kim": "Bạch Lạp Kim",
  "Sa Trung Kim": "Sa Trung Kim",
  "Kim Bạch Kim": "Kim Bạch Kim",
  "Thoa Xuyến Kim": "Thoa Xuyến Kim",
  "Hải Trung Kim": "Hải Trung Kim",
  "Đại Lâm Mộc": "Đại Lâm Mộc",
  "Tùng Bách Mộc": "Tùng Bách Mộc",
  "Dương Liễu Mộc": "Dương Liễu Mộc",
  "Bình Địa Mộc": "Bình Địa Mộc",
  "Tang Đố Mộc": "Tang Đố Mộc",
  "Thạch Lựu Mộc": "Thạch Lựu Mộc",
  "Lộ Bàng Thổ": "Lộ Bàng Thổ",
  "Thành Đầu Thổ": "Thành Đầu Thổ",
  "Ốc Thượng Thổ": "Ốc Thượng Thổ",
  "Bích Thượng Thổ": "Bích Thượng Thổ",
  "Đại Dịch Thổ": "Đại Dịch Thổ",
  "Sa Trung Thổ": "Sa Trung Thổ",
};

const ELEMENT_COLORS: Record<string, string> = {
  Kim: "#999",
  Mộc: "#10b981",
  Thủy: "#3b82f6",
  Hỏa: "#ef4444",
  Thổ: "#f59e0b",
};

function getThaiNguyen(monthGan: string, monthZhi: string) {
  const ganIdx = (GANS.indexOf(monthGan) + 1) % 10;
  const zhiIdx = (ZHIS.indexOf(monthZhi) + 3) % 12;
  return `${GANS[ganIdx]} ${ZHIS[zhiIdx]}`;
}

function getMenhCung(monthZhiIdx: number, hourZhiIdx: number, yearGan: string) {
  // Mệnh Cung calculation starting index from Dần (寅) = 1
  // ZHIS: Tý=0, Sửu=1, Dần=2, Mão=3, Thìn=4, Tị=5, Ngọ=6, Mùi=7, Thân=8, Dậu=9, Tuất=10, Hợi=11
  const m = ((monthZhiIdx - 2 + 12) % 12) + 1;
  const h = ((hourZhiIdx - 2 + 12) % 12) + 1;
  const sum = m + h;
  let res = sum <= 14 ? 14 - sum : 26 - sum;
  if (res === 0) res = 12;

  // Convert back to ZHIS index (Dần=1 -> index 2)
  const branchIdx = (res + 1) % 12;
  const branch = ZHIS[branchIdx];

  const yearGanIdx = GANS.indexOf(yearGan);
  const month1CanIdx = ((yearGanIdx % 5) * 2 + 2) % 10;
  const diff = (branchIdx - 2 + 12) % 12;
  const stemIdx = (month1CanIdx + diff) % 10;
  const stem = GANS[stemIdx];

  return `${stem} ${branch}`;
}

function getKhongVong(gan: string, zhi: string) {
  const gIdx = GANS.indexOf(gan);
  const zIdx = ZHIS.indexOf(zhi);
  let res = zIdx - gIdx;
  if (res < 0) res += 12;
  const kv1 = (res + 10) % 12;
  const kv2 = (res + 11) % 12;
  return `${ZHIS[kv1]} - ${ZHIS[kv2]}`;
}

function getShenSha(
  dayGan: string,
  yearZhi: string,
  monthZhi: string,
  dayZhi: string,
  hourZhi: string,
  yearGan: string,
  pillars: any[],
) {
  const stars: Record<string, string[]> = {
    year: [],
    month: [],
    day: [],
    hour: [],
  };

  const zhis = [yearZhi, monthZhi, dayZhi, hourZhi];
  const gans = [pillars[0].gan, pillars[1].gan, pillars[2].gan, pillars[3].gan];
  const keys: ("year" | "month" | "day" | "hour")[] = [
    "year",
    "month",
    "day",
    "hour",
  ];

  // 1. Thiên Ất Quý Nhân (Nhật Can hoặc Niên Can)
  const thienAtTable: Record<string, string[]> = {
    Giáp: ["Sửu", "Mùi"],
    Mậu: ["Sửu", "Mùi"],
    Ất: ["Tý", "Thân"],
    Kỷ: ["Tý", "Thân"],
    Bính: ["Hợi", "Dậu"],
    Đinh: ["Hợi", "Dậu"],
    Canh: ["Dần", "Ngọ"],
    Tân: ["Dần", "Ngọ"],
    Nhâm: ["Mão", "Tỵ"],
    Quý: ["Mão", "Tỵ"],
  };
  zhis.forEach((z, i) => {
    if (thienAtTable[dayGan]?.includes(z)) stars[keys[i]].push("Thiên Ất QN");
    if (thienAtTable[yearGan]?.includes(z))
      stars[keys[i]].push("Niên Quý Nhân");
  });

  // 2. Thiên Đức Quý Nhân (Chi Tháng tra Can/Chi)
  const thienDucTable: Record<string, string> = {
    Tý: "Tỵ",
    Sửu: "Canh",
    Dần: "Đinh",
    Mão: "Thân",
    Thìn: "Nhâm",
    Tỵ: "Tân",
    Ngọ: "Hợi",
    Mùi: "Giáp",
    Thân: "Quý",
    Dậu: "Dần",
    Tuất: "Bính",
    Hợi: "Ất",
  };
  const tdVal = thienDucTable[monthZhi];
  zhis.forEach((z, i) => {
    if (z === tdVal || gans[i] === tdVal) stars[keys[i]].push("Thiên Đức");
  });

  // 3. Nguyệt Đức Quý Nhân (Chi Tháng tra Thiên Can)
  const nguyetDucTable: Record<string, string> = {
    Dần: "Bính",
    Ngọ: "Bính",
    Tuất: "Bính",
    Thân: "Nhâm",
    Tý: "Nhâm",
    Thìn: "Nhâm",
    Hợi: "Giáp",
    Mão: "Giáp",
    Mùi: "Giáp",
    Tỵ: "Canh",
    Dậu: "Canh",
    Sửu: "Canh",
  };
  const ndVal = nguyetDucTable[monthZhi];
  gans.forEach((g, i) => {
    if (g === ndVal) stars[keys[i]].push("Nguyệt Đức");
  });

  // 4. Hoa Cái (Chi Ngày hoặc Chi Năm)
  // User Prompt rules: Dần Ngọ Tuất -> Tuất, Thân Tý Thìn -> Tuất, Tỵ Dậu Sửu -> Thìn, Hợi Mão Mùi -> Ngọ
  const hoaCaiRule = (zhi: string) => {
    if (["Dần", "Ngọ", "Tuất"].includes(zhi)) return "Tuất";
    if (["Thân", "Tý", "Thìn"].includes(zhi)) return "Tuất";
    if (["Tỵ", "Dậu", "Sửu"].includes(zhi)) return "Thìn";
    if (["Hợi", "Mão", "Mùi"].includes(zhi)) return "Ngọ";
    return "";
  };
  const hcDay = hoaCaiRule(dayZhi);
  const hcYear = hoaCaiRule(yearZhi);
  zhis.forEach((z, i) => {
    if (z === hcDay || z === hcYear) stars[keys[i]].push("Hoa Cái");
  });

  // 5. Đào Hoa (Chi Ngày hoặc Chi Năm)
  const daoHoaRule = (zhi: string) => {
    if (["Dần", "Ngọ", "Tuất"].includes(zhi)) return "Mão";
    if (["Thân", "Tý", "Thìn"].includes(zhi)) return "Dậu";
    if (["Tỵ", "Dậu", "Sửu"].includes(zhi)) return "Tý";
    if (["Hợi", "Mão", "Mùi"].includes(zhi)) return "Ngọ";
    return "";
  };
  const dhDay = daoHoaRule(dayZhi);
  const dhYear = daoHoaRule(yearZhi);
  zhis.forEach((z, i) => {
    if (z === dhDay || z === dhYear) stars[keys[i]].push("Đào Hoa");
  });

  // 6. Kiếp Sát
  const kietSatRule = (zhi: string) => {
    if (["Dần", "Ngọ", "Tuất"].includes(zhi)) return "Hợi";
    if (["Thân", "Tý", "Thìn"].includes(zhi)) return "Tỵ";
    if (["Hợi", "Mão", "Mùi"].includes(zhi)) return "Thân";
    if (["Tỵ", "Dậu", "Sửu"].includes(zhi)) return "Dần";
    return "";
  };
  const ksDay = kietSatRule(dayZhi);
  const ksYear = kietSatRule(yearZhi);
  zhis.forEach((z, i) => {
    if (z === ksDay || z === ksYear) stars[keys[i]].push("Kiếp Sát");
  });

  // 7. Không Vong (Nhật Trụ tuần)
  const dayIndex = GANS.indexOf(dayGan);
  const dayZhiIndex = ZHIS.indexOf(dayZhi);
  const kvStart = (dayZhiIndex - dayIndex + 12) % 12;
  const kv1 = ZHIS[(kvStart + 10) % 12];
  const kv2 = ZHIS[(kvStart + 11) % 12];
  zhis.forEach((z, i) => {
    if (z === kv1 || z === kv2) stars[keys[i]].push("Không Vong");
  });

  // 8. Thái Tuế (An tại Chi Năm và bất kỳ trụ nào có Chi trùng với Chi Năm)
  zhis.forEach((z, i) => {
    if (z === yearZhi) stars[keys[i]].push("Thái Tuế");
  });

  // Văn Xương / Học Sỹ
  const vanXuongMap: Record<string, string> = {
    Giáp: "Tỵ",
    Ất: "Ngọ",
    Bính: "Thân",
    Đinh: "Dậu",
    Mậu: "Thân",
    Kỷ: "Dậu",
    Canh: "Hợi",
    Tân: "Tý",
    Nhâm: "Dần",
    Quý: "Mão",
  };
  zhis.forEach((z, i) => {
    if (z === vanXuongMap[dayGan]) stars[keys[i]].push("Văn Xương");
    if (z === vanXuongMap[yearGan]) stars[keys[i]].push("Học Sỹ");
  });

  // Tuế Lộc / Lộc Thần
  const locThanMap: Record<string, string> = {
    Giáp: "Dần",
    Ất: "Mão",
    Bính: "Tỵ",
    Đinh: "Ngọ",
    Mậu: "Tỵ",
    Kỷ: "Ngọ",
    Canh: "Thân",
    Tân: "Dậu",
    Nhâm: "Hợi",
    Quý: "Tý",
  };
  zhis.forEach((z, i) => {
    if (z === locThanMap[dayGan]) stars[keys[i]].push("Lộc Thần");
    if (z === locThanMap[yearGan]) stars[keys[i]].push("Tuế Lộc");
  });

  // Hồng Loan
  const hongLoanMap: Record<string, string> = {
    Tý: "Mão",
    Sửu: "Dần",
    Dần: "Sửu",
    Mão: "Tý",
    Thìn: "Hợi",
    Tỵ: "Tuất",
    Ngọ: "Dậu",
    Mùi: "Thân",
    Thân: "Mùi",
    Dậu: "Ngọ",
    Tuất: "Tỵ",
    Hợi: "Thìn",
  };
  zhis.forEach((z, i) => {
    if (z === hongLoanMap[yearZhi]) stars[keys[i]].push("Hồng Loan");
  });

  // Cô Thần - Quả Tú
  const coThanMap: Record<string, string> = {
    Dần: "Tỵ",
    Mão: "Tỵ",
    Thìn: "Tỵ",
    Tỵ: "Thân",
    Ngọ: "Thân",
    Mùi: "Thân",
    Thân: "Hợi",
    Dậu: "Hợi",
    Tuất: "Hợi",
    Hợi: "Dần",
    Tý: "Dần",
    Sửu: "Dần",
  };
  const quaTuMap: Record<string, string> = {
    Dần: "Sửu",
    Mão: "Sửu",
    Thìn: "Sửu",
    Tỵ: "Thìn",
    Ngọ: "Thìn",
    Mùi: "Thìn",
    Thân: "Mùi",
    Dậu: "Mùi",
    Tuất: "Mùi",
    Hợi: "Tuất",
    Tý: "Tuất",
    Sửu: "Tuất",
  };
  zhis.forEach((z, i) => {
    if (z === coThanMap[yearZhi]) stars[keys[i]].push("Cô Thần");
    if (z === quaTuMap[yearZhi]) stars[keys[i]].push("Quả Tú");
  });

  // Tướng Tinh
  const tuongTinhTable: Record<string, string> = {
    Dần: "Ngọ",
    Ngọ: "Ngọ",
    Tuất: "Ngọ",
    Thân: "Tý",
    Tý: "Tý",
    Thìn: "Tý",
    Hợi: "Mão",
    Mão: "Mão",
    Mùi: "Mão",
    Tỵ: "Dậu",
    Dậu: "Dậu",
    Sửu: "Dậu",
  };
  const ttDay = tuongTinhTable[dayZhi];
  const ttYear = tuongTinhTable[yearZhi];
  zhis.forEach((z, i) => {
    if (z === ttDay || z === ttYear) stars[keys[i]].push("Tướng Tinh");
  });

  // Quan Phù (Vòng Thái Tuế - vị trí thứ 5)
  const yearZhiIdx = ZHIS.indexOf(yearZhi);
  zhis.forEach((z, i) => {
    const zIdx = ZHIS.indexOf(z);
    const diff = (zIdx - yearZhiIdx + 12) % 12;
    if (diff === 4) stars[keys[i]].push("Quan Phù");
  });

  // Dịch Mã (Standard)
  const dichMaRule = (zhi: string) => {
    if (["Dần", "Ngọ", "Tuất"].includes(zhi)) return "Thân";
    if (["Thân", "Tý", "Thìn"].includes(zhi)) return "Dần";
    if (["Hợi", "Mão", "Mùi"].includes(zhi)) return "Tỵ";
    if (["Tỵ", "Dậu", "Sửu"].includes(zhi)) return "Hợi";
    return "";
  };
  const dmDay = dichMaRule(dayZhi);
  const dmYear = dichMaRule(yearZhi);
  zhis.forEach((z, i) => {
    if (z === dmDay || z === dmYear) stars[keys[i]].push("Dịch Mã");
  });

  return stars;
}

const getPhiCung = (starStr: string) => {
  const firstChar = starStr.charAt(0);
  return NINE_STAR_MAP[firstChar] || starStr;
};

const getMang = (nayinStr: string) => {
  const vietName = NAYIN_MAP[nayinStr] || nayinStr;
  if (vietName.endsWith("Kim")) return "Kim";
  if (vietName.endsWith("Mộc")) return "Mộc";
  if (vietName.endsWith("Thủy")) return "Thủy";
  if (vietName.endsWith("Hỏa")) return "Hỏa";
  if (vietName.endsWith("Thổ")) return "Thổ";
  return vietName;
};

const formatPhiCung = (numStr: string, gender?: "male" | "female") => {
  const num = parseInt(numStr);
  if (isNaN(num)) return numStr;

  const map: Record<number, string> = {
    1: "Khảm",
    2: "Khôn",
    3: "Chấn",
    4: "Tốn",
    6: "Càn",
    7: "Đoài",
    8: "Cấn",
    9: "Ly",
  };

  if (num === 5) {
    if (gender === "male") return "Khôn";
    if (gender === "female") return "Cấn";
    return "Khôn/Cấn";
  }

  return map[num] || numStr;
};

const getSinhCungTrigram = (canIndex: number, chiIndex: number): string => {
  // Map of Giáp Chi Index -> { startNum, fallbackTrigram }
  const giapMap: Record<number, { start: number; fallback: string }> = {
    0: { start: 3, fallback: "Khảm" }, // Giáp Tý
    10: { start: 6, fallback: "Ly" }, // Giáp Tuất
    8: { start: 2, fallback: "Chấn" }, // Giáp Thân
    6: { start: 9, fallback: "Cấn" }, // Giáp Ngọ
    4: { start: 4, fallback: "Đoài" }, // Giáp Thìn
    2: { start: 8, fallback: "Khôn" }, // Giáp Dần
  };

  const giapChiIndex = (chiIndex - canIndex + 12) % 12;
  const giapInfo = giapMap[giapChiIndex];

  if (!giapInfo) return "";

  let targetNum = (giapInfo.start + canIndex) % 9;
  if (targetNum === 0) targetNum = 9;

  if (targetNum === 5) {
    return giapInfo.fallback;
  }

  const standardTrigramMap: Record<number, string> = {
    1: "Khảm",
    2: "Khôn",
    3: "Chấn",
    4: "Tốn",
    6: "Càn",
    7: "Đoài",
    8: "Cấn",
    9: "Ly",
  };

  return standardTrigramMap[targetNum] || "";
};

const JIE_QI_MAP: Record<string, string> = {
  立春: "Lập Xuân",
  雨水: "Vũ Thủy",
  惊蛰: "Kinh Trập",
  春分: "Xuân Phân",
  清明: "Thanh Minh",
  谷雨: "Cốc Vũ",
  立夏: "Lập Hạ",
  小满: "Tiểu Mãn",
  芒种: "Mang Chủng",
  夏至: "Hạ Chí",
  小暑: "Tiểu Thử",
  大暑: "Đại Thử",
  立秋: "Lập Thu",
  处暑: "Xử Thử",
  白露: "Bạch Lộ",
  秋分: "Thu Phân",
  寒露: "Hàn Lộ",
  霜降: "Sương Giáng",
  立冬: "Lập Đông",
  小雪: "Tiểu Tuyết",
  大雪: "Đại Tuyết",
  冬至: "Đông Chí",
  小寒: "Tiểu Hàn",
  大寒: "Đại Hàn",
};

const DAY_PHI_CUNG_CONFIG: Record<string, { start: number; dir: 1 | -1 }> = {
  冬至: { start: 1, dir: 1 },
  小寒: { start: 1, dir: 1 },
  大寒: { start: 1, dir: 1 },
  立春: { start: 1, dir: 1 },
  雨水: { start: 7, dir: 1 },
  惊蛰: { start: 7, dir: 1 },
  春分: { start: 7, dir: 1 },
  清明: { start: 7, dir: 1 },
  谷雨: { start: 4, dir: 1 },
  立夏: { start: 4, dir: 1 },
  小满: { start: 4, dir: 1 },
  芒种: { start: 4, dir: 1 },
  夏至: { start: 9, dir: -1 },
  小暑: { start: 9, dir: -1 },
  大暑: { start: 9, dir: -1 },
  立秋: { start: 9, dir: -1 },
  处暑: { start: 3, dir: -1 },
  白露: { start: 3, dir: -1 },
  秋分: { start: 3, dir: -1 },
  寒露: { start: 3, dir: -1 },
  霜降: { start: 6, dir: -1 },
  立冬: { start: 6, dir: -1 },
  小雪: { start: 6, dir: -1 },
  大雪: { start: 6, dir: -1 },
};

const getCustomDayPhiCung = (lunar: any) => {
  const jieQi = lunar.getPrevJieQi(true).getName();
  const dayIndex = LunarUtil.getJiaZiIndex(lunar.getDayInGanZhi());
  const config = DAY_PHI_CUNG_CONFIG[jieQi];
  if (!config) return "";

  let starNum;
  if (config.dir === 1) {
    starNum = ((config.start - 1 + dayIndex) % 9) + 1;
  } else {
    starNum = ((config.start - 1 - (dayIndex % 9) + 9) % 9) + 1;
  }

  return starNum.toString();
};

const getCustomMonthPhiCung = (lunar: any) => {
  const yearZhi = lunar.getYearZhi();
  const lunarMonth = Math.abs(lunar.getMonth());

  let startStar = 0;
  // Tý (子), Ngọ (午), Mão (卯), Dậu (酉)
  if (["子", "午", "卯", "酉", "Tý", "Ngọ", "Mão", "Dậu"].includes(yearZhi))
    startStar = 8;
  // Thìn (辰), Tuất (戌), Sửu (丑), Mùi (未)
  else if (
    ["辰", "戌", "丑", "未", "Thìn", "Tuất", "Sửu", "Mùi"].includes(yearZhi)
  )
    startStar = 5;
  // Dần (寅), Thân (申), Tỵ (巳), Hợi (亥)
  else if (
    ["寅", "申", "巳", "亥", "Dần", "Thân", "Tỵ", "Hợi"].includes(yearZhi)
  )
    startStar = 2;

  let starNum = startStar - (lunarMonth - 1);
  while (starNum <= 0) starNum += 9;
  while (starNum > 9) starNum -= 9;

  return starNum.toString();
};

function getLunarYearGanZhi(lunarYear: number): string {
  const yearCanIndex = (lunarYear - 4) % 10;
  const normalizedYearCanIndex =
    yearCanIndex < 0 ? yearCanIndex + 10 : yearCanIndex;
  const yearChiIndex = (lunarYear - 4) % 12;
  const normalizedYearChiIndex =
    yearChiIndex < 0 ? yearChiIndex + 12 : yearChiIndex;

  return `${GANS[normalizedYearCanIndex]} ${ZHIS[normalizedYearChiIndex]}`;
}

function getLunarMonthGanZhi(lunarYear: number, lunarMonth: number): string {
  const yearCanIndex = (lunarYear - 4) % 10;
  const normalizedYearCanIndex =
    yearCanIndex < 0 ? yearCanIndex + 10 : yearCanIndex;

  const month1CanIndex = ((normalizedYearCanIndex % 5) * 2 + 2) % 10;
  const monthCanIndex = (month1CanIndex + lunarMonth - 1) % 10;
  const monthChiIndex = (lunarMonth + 1) % 12;

  return `${GANS[monthCanIndex]} ${ZHIS[monthChiIndex]}`;
}

export const renderColoredCanChi = (text: string | undefined) => {
  if (!text) return null;
  const parts = text.split(" ");
  return (
    <div className="flex justify-center gap-1">
      {parts.map((part, i) => {
        const info = GAN_INFO[part] || ZHI_INFO[part];
        const color = info ? ELEMENT_COLORS[info.element] : "inherit";
        return (
          <span key={i} style={{ color }}>
            {part}
          </span>
        );
      })}
    </div>
  );
};

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
    .join(" ");
};

const TRIGRAMS: Record<number, string> = {
  0: "Càn",
  1: "Đoài",
  2: "Ly",
  3: "Chấn",
  4: "Tốn",
  5: "Khảm",
  6: "Cấn",
  7: "Khôn",
};

const TRIGRAM_STEMS: Record<number, string> = {
  0: "Giáp",
  1: "Đinh",
  2: "Kỷ",
  3: "Canh",
  4: "Tân",
  5: "Mậu",
  6: "Bính",
  7: "Ất",
};

const TRIGRAM_LINES = {
  0: {
    lower: [
      { chi: "Tý", element: "Thủy" },
      { chi: "Dần", element: "Mộc" },
      { chi: "Thìn", element: "Thổ" },
    ],
    upper: [
      { chi: "Ngọ", element: "Hỏa" },
      { chi: "Thân", element: "Kim" },
      { chi: "Tuất", element: "Thổ" },
    ],
    binary: [1, 1, 1],
  },
  1: {
    lower: [
      { chi: "Tỵ", element: "Hỏa" },
      { chi: "Mão", element: "Mộc" },
      { chi: "Sửu", element: "Thổ" },
    ],
    upper: [
      { chi: "Hợi", element: "Thủy" },
      { chi: "Dậu", element: "Kim" },
      { chi: "Mùi", element: "Thổ" },
    ],
    binary: [1, 1, 0],
  },
  2: {
    lower: [
      { chi: "Mão", element: "Mộc" },
      { chi: "Sửu", element: "Thổ" },
      { chi: "Hợi", element: "Thủy" },
    ],
    upper: [
      { chi: "Dậu", element: "Kim" },
      { chi: "Mùi", element: "Thổ" },
      { chi: "Tỵ", element: "Hỏa" },
    ],
    binary: [1, 0, 1],
  },
  3: {
    lower: [
      { chi: "Ngọ", element: "Hỏa" },
      { chi: "Thân", element: "Kim" },
      { chi: "Tuất", element: "Thổ" },
    ],
    upper: [
      { chi: "Tý", element: "Thủy" },
      { chi: "Dần", element: "Mộc" },
      { chi: "Thìn", element: "Thổ" },
    ],
    binary: [1, 0, 0],
  },
  4: {
    lower: [
      { chi: "Sửu", element: "Thổ" },
      { chi: "Hợi", element: "Thủy" },
      { chi: "Dậu", element: "Kim" },
    ],
    upper: [
      { chi: "Mùi", element: "Thổ" },
      { chi: "Tỵ", element: "Hỏa" },
      { chi: "Mão", element: "Mộc" },
    ],
    binary: [0, 1, 1],
  },
  5: {
    lower: [
      { chi: "Dần", element: "Mộc" },
      { chi: "Thìn", element: "Thổ" },
      { chi: "Ngọ", element: "Hỏa" },
    ],
    upper: [
      { chi: "Thân", element: "Kim" },
      { chi: "Tuất", element: "Thổ" },
      { chi: "Tý", element: "Thủy" },
    ],
    binary: [0, 1, 0],
  },
  6: {
    lower: [
      { chi: "Thìn", element: "Thổ" },
      { chi: "Ngọ", element: "Hỏa" },
      { chi: "Thân", element: "Kim" },
    ],
    upper: [
      { chi: "Tuất", element: "Thổ" },
      { chi: "Tý", element: "Thủy" },
      { chi: "Dần", element: "Mộc" },
    ],
    binary: [0, 0, 1],
  },
  7: {
    lower: [
      { chi: "Mùi", element: "Thổ" },
      { chi: "Tỵ", element: "Hỏa" },
      { chi: "Mão", element: "Mộc" },
    ],
    upper: [
      { chi: "Sửu", element: "Thổ" },
      { chi: "Hợi", element: "Thủy" },
      { chi: "Dậu", element: "Kim" },
    ],
    binary: [0, 0, 0],
  },
};

const HEXAGRAM_NAMES: Record<string, string> = {
  "0,0": "Bát Thuần Càn",
  "0,1": "Thiên Trạch Lý",
  "0,2": "Thiên Hỏa Đồng Nhân",
  "0,3": "Thiên Lôi Vô Vọng",
  "0,4": "Thiên Phong Cấu",
  "0,5": "Thiên Thủy Tụng",
  "0,6": "Thiên Sơn Độn",
  "0,7": "Thiên Địa Bĩ",
  "1,0": "Trạch Thiên Quải",
  "1,1": "Bát Thuần Đoài",
  "1,2": "Trạch Hỏa Cách",
  "1,3": "Trạch Lôi Tùy",
  "1,4": "Trạch Phong Đại Quá",
  "1,5": "Trạch Thủy Khốn",
  "1,6": "Trạch Sơn Hàm",
  "1,7": "Trạch Địa Tụy",
  "2,0": "Hỏa Thiên Đại Hữu",
  "2,1": "Hỏa Trạch Khuê",
  "2,2": "Bát Thuần Ly",
  "2,3": "Hỏa Lôi Phệ Hạp",
  "2,4": "Hỏa Phong Đỉnh",
  "2,5": "Hỏa Thủy Vị Tế",
  "2,6": "Hỏa Sơn Lữ",
  "2,7": "Hỏa Địa Tấn",
  "3,0": "Lôi Thiên Đại Tráng",
  "3,1": "Lôi Trạch Quy Muội",
  "3,2": "Lôi Hỏa Phong",
  "3,3": "Bát Thuần Chấn",
  "3,4": "Lôi Phong Hằng",
  "3,5": "Lôi Thủy Giải",
  "3,6": "Lôi Sơn Tiểu Quá",
  "3,7": "Lôi Địa Dự",
  "4,0": "Phong Thiên Tiểu Súc",
  "4,1": "Phong Trạch Trung Phu",
  "4,2": "Phong Hỏa Gia Nhân",
  "4,3": "Phong Lôi Ích",
  "4,4": "Bát Thuần Tốn",
  "4,5": "Phong Thủy Hoán",
  "4,6": "Phong Sơn Tiệm",
  "4,7": "Phong Địa Quan",
  "5,0": "Thủy Thiên Nhu",
  "5,1": "Thủy Trạch Tiết",
  "5,2": "Thủy Hỏa Ký Tế",
  "5,3": "Thủy Lôi Truân",
  "5,4": "Thủy Phong Tỉnh",
  "5,5": "Bát Thuần Khảm",
  "5,6": "Thủy Sơn Kiển",
  "5,7": "Thủy Địa Tỷ",
  "6,0": "Sơn Thiên Đại Súc",
  "6,1": "Sơn Trạch Tổn",
  "6,2": "Sơn Hỏa Bí",
  "6,3": "Sơn Lôi Di",
  "6,4": "Sơn Phong Cổ",
  "6,5": "Sơn Thủy Mông",
  "6,6": "Bát Thuần Cấn",
  "6,7": "Sơn Địa Bác",
  "7,0": "Địa Thiên Thái",
  "7,1": "Địa Trạch Lâm",
  "7,2": "Địa Hỏa Minh Di",
  "7,3": "Địa Lôi Phục",
  "7,4": "Địa Phong Thăng",
  "7,5": "Địa Thủy Sư",
  "7,6": "Địa Sơn Khiêm",
  "7,7": "Bát Thuần Khôn",
};

const PALACES = [
  {
    palace: 0,
    element: "Kim",
    hexagrams: [
      [0, 0],
      [0, 4],
      [0, 6],
      [0, 7],
      [4, 7],
      [6, 7],
      [2, 7],
      [2, 0],
    ],
  },
  {
    palace: 1,
    element: "Kim",
    hexagrams: [
      [1, 1],
      [1, 5],
      [1, 7],
      [1, 6],
      [5, 6],
      [7, 6],
      [3, 6],
      [3, 1],
    ],
  },
  {
    palace: 2,
    element: "Hỏa",
    hexagrams: [
      [2, 2],
      [2, 6],
      [2, 4],
      [2, 5],
      [6, 5],
      [4, 5],
      [0, 5],
      [0, 2],
    ],
  },
  {
    palace: 3,
    element: "Mộc",
    hexagrams: [
      [3, 3],
      [3, 7],
      [3, 5],
      [3, 4],
      [7, 4],
      [5, 4],
      [1, 4],
      [1, 3],
    ],
  },
  {
    palace: 4,
    element: "Mộc",
    hexagrams: [
      [4, 4],
      [4, 0],
      [4, 2],
      [4, 3],
      [0, 3],
      [2, 3],
      [6, 3],
      [6, 4],
    ],
  },
  {
    palace: 5,
    element: "Thủy",
    hexagrams: [
      [5, 5],
      [5, 1],
      [5, 3],
      [5, 2],
      [1, 2],
      [3, 2],
      [7, 2],
      [7, 5],
    ],
  },
  {
    palace: 6,
    element: "Thổ",
    hexagrams: [
      [6, 6],
      [6, 2],
      [6, 0],
      [6, 1],
      [2, 1],
      [0, 1],
      [4, 1],
      [4, 6],
    ],
  },
  {
    palace: 7,
    element: "Thổ",
    hexagrams: [
      [7, 7],
      [7, 3],
      [7, 1],
      [7, 0],
      [3, 0],
      [1, 0],
      [5, 0],
      [5, 7],
    ],
  },
];

const THE_UNG_MAP = [
  { the: 6, ung: 3 },
  { the: 1, ung: 4 },
  { the: 2, ung: 5 },
  { the: 3, ung: 6 },
  { the: 4, ung: 1 },
  { the: 5, ung: 2 },
  { the: 4, ung: 1 },
  { the: 3, ung: 6 },
];

const LUC_THU = ["T.long", "C.tước", "C.trần", "Đ.xà", "B.hổ", "H.vũ"];

const TRIGRAM_ELEMENTS_SIMPLE: Record<string, string> = {
  Khảm: "Thủy",
  Khôn: "Thổ",
  Chấn: "Mộc",
  Tốn: "Mộc",
  Càn: "Kim",
  Đoài: "Kim",
  Cấn: "Thổ",
  Ly: "Hỏa",
};

const TRUONG_SINH_STAGES_ALL = [
  "Trường sinh",
  "Mộc dục",
  "Quan đới",
  "Lâm quan",
  "Đế vượng",
  "Suy",
  "Bệnh",
  "Tử",
  "Mộ",
  "Tuyệt",
  "Thai",
  "Dưỡng",
];

function getPalaceInfo(upper: number, lower: number) {
  for (const p of PALACES) {
    const hexIndex = p.hexagrams.findIndex(
      (h) => h[0] === upper && h[1] === lower,
    );
    if (hexIndex !== -1) {
      return {
        palace: p.palace,
        palaceElement: p.element,
        theLine: THE_UNG_MAP[hexIndex].the,
        ungLine: THE_UNG_MAP[hexIndex].ung,
      };
    }
  }
  return { palace: -1, palaceElement: "", theLine: 0, ungLine: 0 };
}

function getLucThuStartIndex(dayChi: string) {
  switch (dayChi) {
    case "Dần":
    case "Mão":
      return 0;
    case "Tỵ":
    case "Ngọ":
      return 1;
    case "Thìn":
    case "Tuất":
      return 2;
    case "Sửu":
    case "Mùi":
      return 3;
    case "Thân":
    case "Dậu":
      return 4;
    case "Hợi":
    case "Tý":
      return 5;
    default:
      return 0;
  }
}

function getLucThan(lineElement: string, palaceElement: string) {
  if (lineElement === palaceElement) return "HĐ";
  const sinh: Record<string, string> = {
    Kim: "Thủy",
    Thủy: "Mộc",
    Mộc: "Hỏa",
    Hỏa: "Thổ",
    Thổ: "Kim",
  };
  const khac: Record<string, string> = {
    Kim: "Mộc",
    Mộc: "Thổ",
    Thổ: "Thủy",
    Thủy: "Hỏa",
    Hỏa: "Kim",
  };
  if (sinh[lineElement] === palaceElement) return "Phụ";
  if (sinh[palaceElement] === lineElement) return "Tử";
  if (khac[lineElement] === palaceElement) return "QQ";
  if (khac[palaceElement] === lineElement) return "Tài";
  return "";
}

function SmallTrigramIcon({
  trigramIndex,
  color = "black",
}: {
  trigramIndex: number;
  color?: string;
}) {
  const data = TRIGRAM_LINES[trigramIndex as keyof typeof TRIGRAM_LINES];
  if (!data) return null;

  return (
    <div className="flex flex-col gap-0.5 w-[14px] sm:w-[18px] md:w-[24px] opacity-80 my-1">
      {[...data.binary].reverse().map((isYang, i) => (
        <div key={i} className="h-[2px] sm:h-[3px] w-full flex justify-center">
          {isYang ? (
            <div
              className="h-full w-full"
              style={{ backgroundColor: color }}
            ></div>
          ) : (
            <div className="h-full w-full flex justify-between">
              <div
                className="h-full w-[40%]"
                style={{ backgroundColor: color }}
              ></div>
              <div
                className="h-full w-[40%]"
                style={{ backgroundColor: color }}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HexagramDisplay({
  upper,
  lower,
  title,
  interactive = false,
  onLineClick,
  dayChi,
  forcedPalaceElement,
  changingLine,
  movingLines,
  withLucThuSpace = false,
  isChangedView = false,
  narrowWidth = false,
  showStems,
}: {
  upper: number;
  lower: number;
  title?: string;
  interactive?: boolean;
  onLineClick?: (lineNum: number) => void;
  dayChi?: string;
  forcedPalaceElement?: string;
  changingLine?: number;
  movingLines?: Set<number>;
  withLucThuSpace?: boolean;
  isChangedView?: boolean;
  palaceUpper?: number;
  palaceLower?: number;
  narrowWidth?: boolean;
  showStems?: boolean;
}) {
  const upperData = TRIGRAM_LINES[upper as keyof typeof TRIGRAM_LINES];
  const lowerData = TRIGRAM_LINES[lower as keyof typeof TRIGRAM_LINES];

  if (!upperData || !lowerData) return null;

  const palaceInfo = getPalaceInfo(upper, lower);
  const palaceElement = forcedPalaceElement || palaceInfo.palaceElement;
  const theLine = palaceInfo.theLine;
  const ungLine = palaceInfo.ungLine;

  const lines = [
    ...lowerData.lower.map((l, i) => ({
      ...l,
      isYang: lowerData.binary[i] === 1,
      lineNum: i + 1,
    })),
    ...upperData.upper.map((l, i) => ({
      ...l,
      isYang: upperData.binary[i] === 1,
      lineNum: i + 4,
    })),
  ];

  const hexagramName = HEXAGRAM_NAMES[`${upper},${lower}`] || "";
  const palaceName =
    palaceInfo.palace !== -1
      ? TRIGRAMS[palaceInfo.palace as keyof typeof TRIGRAMS]
      : "";
  const is5Cols = !!dayChi || withLucThuSpace;

  let gridColsClasses = "";
  if (isChangedView) {
    gridColsClasses =
      "grid-cols-[0px_8px_36px_36px_42px] sm:grid-cols-[0px_10px_48px_40px_48px] md:grid-cols-[0px_12px_60px_46px_60px] lg:grid-cols-[0px_14px_72px_54px_72px]";
  } else if (is5Cols) {
    gridColsClasses =
      "grid-cols-[28px_12px_36px_36px_42px_42px] sm:grid-cols-[32px_16px_48px_40px_48px_48px] md:grid-cols-[38px_20px_60px_50px_58px_60px] lg:grid-cols-[44px_24px_72px_60px_68px_72px]";
  } else {
    gridColsClasses =
      "grid-cols-[28px_12px_36px_42px_42px] sm:grid-cols-[32px_16px_48px_48px_48px] md:grid-cols-[38px_20px_60px_58px_60px] lg:grid-cols-[44px_24px_72px_68px_72px]";
  }
  const showLucThu = is5Cols && !isChangedView;

  const presentLucThanSet = new Set(
    lines.map((line) => getLucThan(line.element, palaceElement)),
  );
  const allPossibleLucThan: Array<"HĐ" | "Phụ" | "Tử" | "QQ" | "Tài"> = [
    "HĐ",
    "Phụ",
    "Tử",
    "QQ",
    "Tài",
  ];
  const missingLucThan = allPossibleLucThan.filter(
    (lt) => !presentLucThanSet.has(lt) && lt !== "HĐ",
  );

  const phucThanMap: Record<
    number,
    { lucThan: string; chi: string; element: string }
  > = {};
  if (missingLucThan.length > 0 && palaceInfo.palace !== -1 && !isChangedView) {
    const baseUpperData =
      TRIGRAM_LINES[palaceInfo.palace as keyof typeof TRIGRAM_LINES];
    const baseLowerData =
      TRIGRAM_LINES[palaceInfo.palace as keyof typeof TRIGRAM_LINES];
    const baseLines = [
      ...baseLowerData.lower.map((l, i) => ({ ...l, lineNum: i + 1 })),
      ...baseUpperData.upper.map((l, i) => ({ ...l, lineNum: i + 4 })),
    ];

    for (const m of missingLucThan) {
      const foundLine = baseLines.find(
        (l) => getLucThan(l.element, palaceElement) === m,
      );
      if (foundLine) {
        phucThanMap[foundLine.lineNum] = {
          lucThan: m,
          chi: foundLine.chi,
          element: foundLine.element,
        };
      }
    }
  }

  const wrapperClass = narrowWidth
    ? `flex flex-col gap-0 mt-1 p-0.5 sm:p-1 md:p-1.5 lg:p-2 bg-[#F2F2EB] border border-gray-200 rounded-lg shadow-sm h-full flex-shrink basis-0 w-full ${isChangedView ? "flex-[2] min-w-[90px] max-w-[110px] sm:max-w-[130px] md:max-w-[150px]" : "flex-[3] min-w-[150px] max-w-[180px] sm:max-w-[210px] md:max-w-[240px]"}`
    : `flex flex-col gap-0 mt-1 p-0.5 sm:p-1 md:p-1.5 lg:p-2 bg-[#F2F2EB] border border-gray-200 rounded-lg shadow-sm h-full flex-shrink basis-0 w-full ${isChangedView ? "flex-[2] max-w-[150px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-[230px] min-w-[110px] sm:min-w-[135px]" : "flex-[3] max-w-[240px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[360px] min-w-[180px] sm:min-w-[220px]"}`;

  return (
    <div className={wrapperClass}>
      <div className="flex flex-col items-center justify-center w-full mb-0.5 sm:mb-1 md:mb-1.5 px-0.5 text-center shrink-0">
        {title && (
          <div className="text-gray-400 text-[6.5px] sm:text-[7.5px] md:text-[9px] lg:text-[11px] uppercase tracking-tighter mb-0 font-bold">
            {title}
          </div>
        )}
        <div className="text-amber-600 font-bold text-[11px] sm:text-[12.5px] md:text-[16px] lg:text-[18px] uppercase tracking-tight leading-tight line-clamp-1">
          {hexagramName}
        </div>
      </div>
      <div className="flex-1 flex flex-row w-full items-stretch mb-0.5">
        <div className="flex-1 flex flex-col justify-end w-full gap-[6px] sm:gap-[10px] lg:gap-[14px] px-0.5">
          {[...lines].reverse().map((line) => {
            const rawLucThan = getLucThan(line.element, palaceElement);
            const lucThan = rawLucThan === "Phụ" ? "PM" : rawLucThan;
            const phucThanRecord = phucThanMap[line.lineNum];
            const displayPhucThanLucThan =
              phucThanRecord?.lucThan === "Phụ"
                ? "PM"
                : phucThanRecord?.lucThan;

            const lucThuStartIndex = dayChi ? getLucThuStartIndex(dayChi) : 0;
            const lucThu = dayChi
              ? LUC_THU[(lucThuStartIndex + line.lineNum - 1) % 6]
              : "";
            const isThe = line.lineNum === theLine;
            const isUng = line.lineNum === ungLine;
            const isBaseChanging =
              line.lineNum === changingLine ||
              (movingLines && movingLines.has(line.lineNum));

            let bgColor = "bg-slate-800";
            const ringClass = "";
            let shadowClass = "";

            if (isBaseChanging) {
              bgColor = "bg-red-500";
              shadowClass = "shadow-[0_0_5px_rgba(239,68,68,0.5)]";
            } else {
              bgColor = "bg-slate-800";
            }

            return (
              <div
                key={line.lineNum}
                className={`grid justify-center ${gridColsClasses} gap-0.5 sm:gap-1.5 items-center transition-all ${interactive ? "cursor-pointer hover:bg-gray-50 rounded-sm" : ""}`}
                onClick={() =>
                  interactive && onLineClick && onLineClick(line.lineNum)
                }
              >
                <div className="flex items-center justify-center relative w-full h-full">
                  {showStems && !isChangedView && line.lineNum === 5 && (
                    <span className="text-[#B71C1C] font-black text-[11px] sm:text-[12px] md:text-[14px] lg:text-[16px] leading-none">
                      {TRIGRAM_STEMS[upper]}
                    </span>
                  )}
                  {showStems && !isChangedView && line.lineNum === 2 && (
                    <span className="text-[#1565C0] font-black text-[11px] sm:text-[12px] md:text-[14px] lg:text-[16px] leading-none">
                      {TRIGRAM_STEMS[lower]}
                    </span>
                  )}
                  {showStems &&
                    !isChangedView &&
                    palaceInfo.palace !== -1 &&
                    line.lineNum === 4 && (
                      <div className="absolute top-[100%] mt-[3px] sm:mt-[5px] lg:mt-[7px] z-10 scale-[1.2] sm:scale-[1.4] md:scale-[1.5] left-[50%] -translate-x-1/2 -translate-y-1/2">
                        <SmallTrigramIcon trigramIndex={palaceInfo.palace} />
                      </div>
                    )}
                </div>
                <div className="text-right text-[7.5px] sm:text-[8px] md:text-[10px] lg:text-[12px] font-black text-red-600 leading-none">
                  {isThe ? "T" : isUng ? "Ư" : ""}
                </div>
                <div
                  className={`flex justify-center w-full px-0.5 relative ${!isChangedView ? ringClass : ""}`}
                >
                  {line.isYang ? (
                    <div
                      className={`h-1.5 sm:h-2 md:h-2.5 lg:h-3 w-full transition-all ${bgColor} ${shadowClass}`}
                    ></div>
                  ) : (
                    <div className="h-1.5 sm:h-2 md:h-2.5 lg:h-3 w-full flex justify-between">
                      <div
                        className={`h-full w-[42%] transition-all ${bgColor} ${shadowClass}`}
                      ></div>
                      <div
                        className={`h-full w-[42%] transition-all ${bgColor} ${shadowClass}`}
                      ></div>
                    </div>
                  )}
                </div>
                {showLucThu && (
                  <div className="w-full flex justify-start whitespace-nowrap pr-0.5 sm:pr-1 md:pr-1.5 text-[8.5px] sm:text-[9.5px] md:text-[11px] lg:text-[13px] font-medium text-blue-500">
                    {lucThu}
                  </div>
                )}
                <div className="text-left whitespace-nowrap text-[11px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-bold flex flex-row items-center gap-1 leading-[1.1] sm:leading-[1.15]">
                  <span style={{ color: ELEMENT_COLORS[line.element] }}>
                    {lucThan}
                  </span>
                  {phucThanMap[line.lineNum] && (
                    <span
                      className="opacity-75 text-[8.5px] sm:text-[9.5px] md:text-[10px] lg:text-[11px]"
                      style={{
                        color:
                          ELEMENT_COLORS[phucThanMap[line.lineNum].element],
                      }}
                    >
                      ({displayPhucThanLucThan})
                    </span>
                  )}
                </div>
                <div className="text-left whitespace-nowrap text-[11px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-bold flex flex-row items-center gap-1 leading-[1.1] sm:leading-[1.15]">
                  <span style={{ color: ELEMENT_COLORS[line.element] }}>
                    {line.chi}
                  </span>
                  {phucThanMap[line.lineNum] && (
                    <span
                      className="opacity-75 text-[8.5px] sm:text-[9.5px] md:text-[10px] lg:text-[11px]"
                      style={{
                        color:
                          ELEMENT_COLORS[phucThanMap[line.lineNum].element],
                      }}
                    >
                      ({phucThanMap[line.lineNum].chi})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const CH_TRUC_MAP: Record<string, string> = {
  建: "Kiến",
  除: "Trừ",
  满: "Mãn",
  平: "Bình",
  定: "Định",
  执: "Chấp",
  破: "Phá",
  危: "Nguy",
  成: "Thành",
  收: "Thâu",
  开: "Khai",
  闭: "Bế",
};

function calculateYearOnlyInfo(year: number, gender?: "male" | "female") {
  try {
    const solar = Solar.fromYmdHms(year, 7, 1, 0, 0, 0);
    const lunar = solar.getLunar();
    const result = {
      lunarYear: year,
      lunarYearName: translateGanZhi(lunar.getYearInGanZhi()),
      yearMang: getMang(lunar.getYearNaYin()),
      yearPhiCung: (() => {
        let star = parseInt(getPhiCung(lunar.getYearNineStar().toString()));
        if (gender === "female") {
          star = (15 - star) % 9;
          if (star === 0) star = 9;
        }
        return formatPhiCung(star.toString(), gender);
      })(),
      yearSinhCung: getSinhCungTrigram(
        lunar.getYearGanIndex(),
        lunar.getYearZhiIndex(),
      ),
    };
    return result;
  } catch (e) {
    return null;
  }
}

function calculateLunarInfo(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0,
  gender?: "male" | "female",
) {
  if (
    !year ||
    !month ||
    !day ||
    isNaN(hour) ||
    month < 1 ||
    month > 12 ||
    hour < 0 ||
    hour > 23 ||
    isNaN(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  try {
    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = solar.getLunar();

    const lunarYear = lunar.getYear();
    const lunarMonth = Math.abs(lunar.getMonth());
    const lunarDay = lunar.getDay();
    const lunarHourIndex = lunar.getTimeZhiIndex() + 1; // 1-12

    const sum = lunarYear + lunarMonth + lunarDay + lunarHourIndex;
    const solarSum = year + month + day + hour + minute;
    let remainder = sum % 8;
    let quotient = Math.floor(sum / 8);
    let finalQuotient = sumDigits(quotient);

    let solarRemainder = solarSum % 8;
    let solarQuotient = Math.floor(solarSum / 8);
    let solarFinalQuotient = sumDigits(solarQuotient);

    const originalRemainder = remainder;
    const originalQuotient = quotient;
    const originalFinalQuotient = finalQuotient;
    const specialSteps = [];

    while (finalQuotient === 8) {
      const tempVal = remainder === 0 ? 9 : remainder * 10;
      const newQuotient = Math.floor(tempVal / 8);
      const newRemainder = tempVal % 8;
      const newFinalQuotient = sumDigits(newQuotient);

      specialSteps.push({
        tempVal,
        oldRemainder: remainder,
        newQuotient,
        newRemainder,
        newFinalQuotient,
      });

      quotient = newQuotient;
      remainder = newRemainder;
      finalQuotient = newFinalQuotient;
    }

    const solarOriginalRemainder = solarRemainder;
    const solarOriginalQuotient = solarQuotient;
    const solarOriginalFinalQuotient = solarFinalQuotient;
    const solarSpecialSteps = [];

    while (solarFinalQuotient === 8) {
      const tempVal = solarRemainder === 0 ? 9 : solarRemainder * 10;
      const newQuotient = Math.floor(tempVal / 8);
      const newRemainder = tempVal % 8;
      const newFinalQuotient = sumDigits(newQuotient);

      solarSpecialSteps.push({
        tempVal,
        oldRemainder: solarRemainder,
        newQuotient,
        newRemainder,
        newFinalQuotient,
      });

      solarQuotient = newQuotient;
      solarRemainder = newRemainder;
      solarFinalQuotient = newFinalQuotient;
    }

    const jieQiName = lunar.getPrevJieQi(true).getName();
    const vietnameseJieQi = JIE_QI_MAP[jieQiName] || jieQiName;

    const changingLine = sum % 6 === 0 ? 6 : sum % 6;
    const solarChangingLine = solarSum % 6 === 0 ? 6 : solarSum % 6;

    // Pillar-based moving lines (Calculated from Lunar values)
    // Rule: year(lunar) % 6, month(lunar) % 6, day(lunar) % 6, hour(chi) % 6, sum(Tổng Âm) % 6. If duplicate, they cancel out.
    const rawPillarLines = [
      lunarYear % 6 || 6,
      lunarMonth % 6 || 6,
      lunarDay % 6 || 6,
      lunarHourIndex % 6 || 6,
      sum % 6 || 6,
    ];

    // Cancellation logic: Cancel pairs of identical values (2, 4). Keep odd ones active.
    const lineIndices: Record<number, number[]> = {};
    rawPillarLines.forEach((l, i) => {
      if (!lineIndices[l]) lineIndices[l] = [];
      lineIndices[l].push(i);
    });

    const activePillarLines: number[] = [];
    const cancelledPillarIndices: number[] = [];

    Object.keys(lineIndices).forEach((lStr) => {
      const l = parseInt(lStr);
      const indices = lineIndices[l];
      const cancelCount = Math.floor(indices.length / 2) * 2;

      for (let i = 0; i < cancelCount; i++) {
        cancelledPillarIndices.push(indices[i]);
      }

      if (indices.length % 2 !== 0) {
        activePillarLines.push(l);
      }
    });

    const rawSolarPillarLines = [
      year % 6 || 6,
      month % 6 || 6,
      day % 6 || 6,
      hour % 6 || 6,
      minute % 6 || 6,
      solarSum % 6 || 6,
    ];

    const solarLineIndices: Record<number, number[]> = {};
    rawSolarPillarLines.forEach((l, i) => {
      if (!solarLineIndices[l]) solarLineIndices[l] = [];
      solarLineIndices[l].push(i);
    });

    const activeSolarPillarLines: number[] = [];
    const cancelledSolarPillarIndices: number[] = [];

    Object.keys(solarLineIndices).forEach((lStr) => {
      const l = parseInt(lStr);
      const indices = solarLineIndices[l];
      const cancelCount = Math.floor(indices.length / 2) * 2;

      for (let i = 0; i < cancelCount; i++) {
        cancelledSolarPillarIndices.push(indices[i]);
      }

      if (indices.length % 2 !== 0) {
        activeSolarPillarLines.push(l);
      }
    });

    // Phi Cung calculation
    const getYearPhi = () => {
      let star = parseInt(getPhiCung(lunar.getYearNineStar().toString()));
      if (gender === "female") {
        star = (15 - star) % 9;
        if (star === 0) star = 9;
      }
      return star.toString();
    };

    const getMonthPhi = () => {
      return getCustomMonthPhiCung(lunar);
    };

    const getDayPhi = () => {
      return getCustomDayPhiCung(lunar);
    };

    const getHourPhi = () => {
      return getPhiCung(lunar.getTimeNineStar().toString());
    };

    const ec2 = lunar.getEightChar(2);

    return {
      lunar,
      lunarYear,
      lunarMonth,
      lunarDay,
      lunarHourIndex,
      lunarYearZhiIndex: lunar.getYearZhiIndex(),
      lunarYearName: translateGanZhi(ec2.getYear()),
      lunarMonthName: translateGanZhi(ec2.getMonth()),
      lunarDayName: translateGanZhi(ec2.getDay()),
      lunarHourName: translateGanZhi(ec2.getTime()),
      yearPhiCung: formatPhiCung(getYearPhi(), gender),
      yearMang: getMang(lunar.getYearNaYin()),
      yearSinhCung: getSinhCungTrigram(
        lunar.getYearGanIndex(),
        lunar.getYearZhiIndex(),
      ),
      monthPhiCung: formatPhiCung(getMonthPhi(), gender),
      monthMang: getMang(lunar.getMonthNaYin()),
      monthSinhCung: getSinhCungTrigram(
        lunar.getMonthGanIndex(),
        lunar.getMonthZhiIndex(),
      ),
      dayPhiCung: formatPhiCung(getDayPhi(), gender),
      dayMang: getMang(lunar.getDayNaYin()),
      daySinhCung: getSinhCungTrigram(
        lunar.getDayGanIndex(),
        lunar.getDayZhiIndex(),
      ),
      dayTruc: CH_TRUC_MAP[lunar.getZhiXing()] || lunar.getZhiXing(),
      hourPhiCung: formatPhiCung(getHourPhi(), gender),
      hourMang: getMang(lunar.getTimeNaYin()),
      hourSinhCung: getSinhCungTrigram(
        lunar.getTimeGanIndex(),
        lunar.getTimeZhiIndex(),
      ),
      sum,
      solarSum,
      solarRemainder,
      solarFinalQuotient,
      solarOriginalRemainder,
      solarOriginalQuotient,
      solarOriginalFinalQuotient,
      solarSpecialSteps,
      remainder,
      quotient,
      finalQuotient,
      originalRemainder,
      originalQuotient,
      originalFinalQuotient,
      specialSteps,
      jieQi: vietnameseJieQi,
      changingLine,
      solarYear: year,
      solarMonth: month,
      solarDay: day,
      solarHour: hour,
      solarMinute: minute,
      rawPillarLines,
      pillarLines: activePillarLines,
      cancelledPillarIndices,
      rawSolarPillarLines,
      solarPillarLines: activeSolarPillarLines,
      cancelledSolarPillarIndices,
    };
  } catch (e) {
    return null;
  }
}

function MarriageDateTable({
  title,
  date,
  lunarInfo,
  onChange,
}: {
  title: string;
  date: any;
  lunarInfo: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex-1 bg-[#F2F2EB] border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm overflow-x-auto">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
        <FastInput
          type="text"
          name="name"
          value={date.name}
          onChange={onChange}
          placeholder="Nhập tên..."
          className="bg-transparent text-gray-900 font-serif font-bold text-xl focus:outline-none w-full placeholder:text-gray-300"
        />
      </div>
      <div className="min-w-0">
        <div className="grid grid-cols-[35px_0.4fr_0.4fr_1.4fr_1.4fr_1.2fr_1.2fr] items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          {/* Headers */}
          <div className="bg-gray-100 border-r border-gray-200"></div>
          <div className="bg-gray-100 text-gray-500 text-[12px] md:text-[13px] lg:text-[14px] uppercase tracking-wider py-2 text-center font-bold border-r border-gray-200">
            Dương
          </div>
          <div className="bg-gray-100 text-gray-500 text-[12px] md:text-[13px] lg:text-[14px] uppercase tracking-wider py-2 text-center font-bold border-r border-gray-200">
            Âm
          </div>
          <div className="bg-gray-100 text-gray-500 text-[12px] md:text-[13px] lg:text-[14px] uppercase tracking-wider py-2 text-center font-bold border-r border-gray-200">
            Can Chi
          </div>
          <div className="bg-gray-100 text-gray-500 text-[12px] md:text-[13px] lg:text-[14px] uppercase tracking-wider py-2 text-center font-bold border-r border-gray-200">
            Mạng
          </div>
          <div className="bg-gray-100 text-gray-500 text-[12px] md:text-[13px] lg:text-[14px] uppercase tracking-wider py-2 text-center font-bold border-r border-gray-200">
            Phi Cung
          </div>
          <div className="bg-gray-100 text-gray-500 text-[12px] md:text-[13px] lg:text-[14px] uppercase tracking-wider py-2 text-center font-bold">
            Sinh Cung
          </div>

          {/* Năm */}
          <div className="bg-gray-100 text-gray-400 text-[9px] font-bold uppercase tracking-widest py-2 text-center flex items-center justify-center border-t border-gray-200">
            Năm
          </div>
          <div className="p-1 border-t border-r border-gray-100 bg-[#F2F2EB]">
            <FastInput
              type="number"
              name="year"
              value={date.year}
              onChange={onChange}
              className="bg-transparent text-gray-900 text-xs py-0.5 font-mono font-medium focus:outline-none w-full text-center min-w-[50px]"
            />
          </div>
          <div className="text-xs text-gray-600 font-mono text-center p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center font-bold">
            {date.year ? lunarInfo?.lunarYear || date.year : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] font-black whitespace-nowrap text-center p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.year
              ? lunarInfo?.lunarYearName
                ? renderColoredCanChi(lunarInfo?.lunarYearName)
                : "--"
              : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-gray-600 font-bold text-center whitespace-nowrap p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.year ? lunarInfo?.yearMang || "--" : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-blue-700 font-bold text-center whitespace-nowrap p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.year ? lunarInfo?.yearPhiCung || "--" : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-emerald-700 font-bold text-center whitespace-nowrap p-1 border-t border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.year ? lunarInfo?.yearSinhCung || "--" : "--"}
          </div>

          {/* Tháng */}
          <div className="bg-gray-100 text-gray-400 text-[9px] font-bold uppercase tracking-widest py-2 text-center flex items-center justify-center border-t border-gray-200">
            Tháng
          </div>
          <div className="p-1 border-t border-r border-gray-100 bg-[#F2F2EB]">
            <input
              type="number"
              name="month"
              min="1"
              max="12"
              value={date.month}
              onChange={onChange}
              className="bg-transparent text-gray-900 text-xs py-0.5 font-mono font-medium focus:outline-none w-full text-center"
            />
          </div>
          <div className="text-xs text-gray-600 font-mono text-center p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center font-bold">
            {date.month ? lunarInfo?.lunarMonth || "--" : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] font-black whitespace-nowrap text-center p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.month
              ? lunarInfo?.lunarMonthName
                ? renderColoredCanChi(lunarInfo?.lunarMonthName)
                : "--"
              : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-gray-600 font-bold text-center whitespace-nowrap p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.month ? lunarInfo?.monthMang || "--" : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-blue-700 font-bold text-center whitespace-nowrap p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.month ? lunarInfo?.monthPhiCung || "--" : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-emerald-700 font-bold text-center whitespace-nowrap p-1 border-t border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.month ? lunarInfo?.monthSinhCung || "--" : "--"}
          </div>

          {/* Ngày */}
          <div className="bg-gray-100 text-gray-400 text-[9px] font-bold uppercase tracking-widest py-2 text-center flex items-center justify-center border-t border-gray-200">
            Ngày
          </div>
          <div className="p-1 border-t border-r border-gray-100 bg-[#F2F2EB]">
            <input
              type="number"
              name="day"
              min="1"
              max="31"
              value={date.day}
              onChange={onChange}
              className="bg-transparent text-gray-900 text-xs py-0.5 font-mono font-medium focus:outline-none w-full text-center"
            />
          </div>
          <div className="text-xs text-gray-600 font-mono text-center p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center font-bold">
            {date.day ? lunarInfo?.lunarDay || "--" : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] font-black whitespace-nowrap text-center p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.day
              ? lunarInfo?.lunarDayName
                ? renderColoredCanChi(lunarInfo?.lunarDayName)
                : "--"
              : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-gray-600 font-bold text-center whitespace-nowrap p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.day ? lunarInfo?.dayMang || "--" : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-blue-700 font-bold text-center whitespace-nowrap p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.day ? lunarInfo?.dayPhiCung || "--" : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-emerald-700 font-bold text-center whitespace-nowrap p-1 border-t border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.day ? lunarInfo?.daySinhCung || "--" : "--"}
          </div>

          {/* Giờ */}
          <div className="bg-gray-100 text-gray-400 text-[9px] font-bold uppercase tracking-widest py-2 text-center flex items-center justify-center border-t border-gray-200">
            Giờ
          </div>
          <div className="p-1 border-t border-r border-gray-100 bg-[#F2F2EB]">
            <input
              type="number"
              name="hour"
              min="0"
              max="23"
              value={date.hour}
              onChange={onChange}
              className="bg-transparent text-gray-900 text-xs py-0.5 font-mono font-medium focus:outline-none w-full text-center"
            />
          </div>
          <div className="text-xs text-gray-600 font-mono text-center p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center font-bold">
            {date.hour !== "" && date.hour !== undefined
              ? lunarInfo?.lunarHourIndex || "--"
              : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] font-black whitespace-nowrap text-center p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.hour !== "" && date.hour !== undefined
              ? lunarInfo?.lunarHourName
                ? renderColoredCanChi(lunarInfo?.lunarHourName)
                : "--"
              : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-gray-600 font-bold text-center whitespace-nowrap p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.hour !== "" && date.hour !== undefined
              ? lunarInfo?.hourMang || "--"
              : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-blue-700 font-bold text-center whitespace-nowrap p-1 border-t border-r border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.hour !== "" && date.hour !== undefined
              ? lunarInfo?.hourPhiCung || "--"
              : "--"}
          </div>
          <div className="text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] text-emerald-700 font-bold text-center whitespace-nowrap p-1 border-t border-gray-100 bg-[#F2F2EB] flex items-center justify-center">
            {date.hour !== "" && date.hour !== undefined
              ? lunarInfo?.hourSinhCung || "--"
              : "--"}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCompatibilityScore(
  male: any,
  female: any,
  maleDate: any,
  femaleDate: any,
) {
  if (!male && !female) return null;

  const m = male || {};
  const f = female || {};
  const results: any[] = [];
  let totalScore = 0;
  let maleGoodPoints = 0;
  let femaleGoodPoints = 0;
  let pillarsCompared = 0;

  // ... (canMap, tamHop, etc. remain the same)

  // ... (rest of the content remains the same - but update the compare calls)
  // ... (rest of the content remains the same)

  const canMap: Record<string, string[]> = {
    Giáp: ["Kỷ"],
    Kỷ: ["Giáp"],
    Ất: ["Canh"],
    Canh: ["Ất"],
    Bính: ["Tân"],
    Tân: ["Bính"],
    Đinh: ["Nhâm"],
    Nhâm: ["Đinh"],
    Mậu: ["Quý"],
    Quý: ["Mậu"],
  };
  const canKhac: Record<string, string[]> = {
    Giáp: ["Canh", "Tân"],
    Ất: ["Canh", "Tân"],
    Bính: ["Nhâm", "Quý"],
    Đinh: ["Nhâm", "Quý"],
    Mậu: ["Giáp", "Ất"],
    Kỷ: ["Giáp", "Ất"],
    Canh: ["Bính", "Đinh"],
    Tân: ["Bính", "Đinh"],
    Nhâm: ["Mậu", "Kỷ"],
    Quý: ["Mậu", "Kỷ"],
  };
  const tamHop = [
    ["Thân", "Tý", "Thìn"],
    ["Dần", "Ngọ", "Tuất"],
    ["Tỵ", "Dậu", "Sửu"],
    ["Hợi", "Mão", "Mùi"],
  ];
  const lucHop = [
    ["Tý", "Sửu"],
    ["Dần", "Hợi"],
    ["Mão", "Tuất"],
    ["Thìn", "Dậu"],
    ["Tỵ", "Thân"],
    ["Ngọ", "Mùi"],
  ];
  const tuHanhXung = [
    ["Tý", "Ngọ", "Mão", "Dậu"],
    ["Thìn", "Tuất", "Sửu", "Mùi"],
    ["Dần", "Thân", "Tỵ", "Hợi"],
  ];

  const canElements: Record<string, string> = {
    Giáp: "Mộc",
    Ất: "Mộc",
    Bính: "Hỏa",
    Đinh: "Hỏa",
    Mậu: "Thổ",
    Kỷ: "Thổ",
    Canh: "Kim",
    Tân: "Kim",
    Nhâm: "Thủy",
    Quý: "Thủy",
  };
  const chiElements: Record<string, string> = {
    Tý: "Thủy",
    Sửu: "Thổ",
    Dần: "Mộc",
    Mão: "Mộc",
    Thìn: "Thổ",
    Tỵ: "Hỏa",
    Ngọ: "Hỏa",
    Mùi: "Thổ",
    Thân: "Kim",
    Dậu: "Kim",
    Tuất: "Thổ",
    Hợi: "Thủy",
  };

  const sinh: Record<string, string> = {
    Kim: "Thủy",
    Thủy: "Mộc",
    Mộc: "Hỏa",
    Hỏa: "Thổ",
    Thổ: "Kim",
  };
  const khac: Record<string, string> = {
    Kim: "Mộc",
    Mộc: "Thổ",
    Thổ: "Thủy",
    Thủy: "Hỏa",
    Hỏa: "Kim",
  };

  const phiCungMap: Record<string, Record<string, string>> = {
    Khảm: {
      Khảm: "Phục Vị",
      Khôn: "Tuyệt Mệnh",
      Chấn: "Thiên Y",
      Tốn: "Sinh Khí",
      Càn: "Lục Sát",
      Đoài: "Họa Hại",
      Cấn: "Ngũ Quỷ",
      Ly: "Diên Niên",
    },
    Khôn: {
      Khảm: "Tuyệt Mệnh",
      Khôn: "Phục Vị",
      Chấn: "Họa Hại",
      Tốn: "Ngũ Quỷ",
      Càn: "Diên Niên",
      Đoài: "Thiên Y",
      Cấn: "Sinh Khí",
      Ly: "Lục Sát",
    },
    Chấn: {
      Khảm: "Thiên Y",
      Khôn: "Họa Hại",
      Chấn: "Phục Vị",
      Tốn: "Diên Niên",
      Càn: "Ngũ Quỷ",
      Đoài: "Tuyệt Mệnh",
      Cấn: "Lục Sát",
      Ly: "Sinh Khí",
    },
    Tốn: {
      Khảm: "Sinh Khí",
      Khôn: "Ngũ Quỷ",
      Chấn: "Diên Niên",
      Tốn: "Phục Vị",
      Càn: "Họa Hại",
      Đoài: "Lục Sát",
      Cấn: "Tuyệt Mệnh",
      Ly: "Thiên Y",
    },
    Càn: {
      Khảm: "Lục Sát",
      Khôn: "Diên Niên",
      Chấn: "Ngũ Quỷ",
      Tốn: "Họa Hại",
      Càn: "Phục Vị",
      Đoài: "Sinh Khí",
      Cấn: "Thiên Y",
      Ly: "Tuyệt Mệnh",
    },
    Đoài: {
      Khảm: "Họa Hại",
      Khôn: "Thiên Y",
      Chấn: "Tuyệt Mệnh",
      Tốn: "Lục Sát",
      Càn: "Sinh Khí",
      Đoài: "Phục Vị",
      Cấn: "Diên Niên",
      Ly: "Ngũ Quỷ",
    },
    Cấn: {
      Khảm: "Ngũ Quỷ",
      Khôn: "Sinh Khí",
      Chấn: "Lục Sát",
      Tốn: "Tuyệt Mệnh",
      Càn: "Thiên Y",
      Đoài: "Diên Niên",
      Cấn: "Phục Vị",
      Ly: "Họa Hại",
    },
    Ly: {
      Khảm: "Diên Niên",
      Khôn: "Lục Sát",
      Chấn: "Sinh Khí",
      Tốn: "Thiên Y",
      Càn: "Tuyệt Mệnh",
      Đoài: "Ngũ Quỷ",
      Cấn: "Họa Hại",
      Ly: "Phục Vị",
    },
  };

  const tot = ["Sinh Khí", "Diên Niên", "Thiên Y", "Phục Vị", "Phúc Đức"];

  const calculateGoodness = (mEl: string, fEl: string) => {
    if (sinh[fEl] === mEl) return { m: 1, f: 0 }; // Female generates Male -> Male Good
    if (sinh[mEl] === fEl) return { m: 0, f: 1 }; // Male generates Female -> Female Good
    if (khac[mEl] === fEl) return { m: 1, f: 0 }; // Male overcomes Female -> Male Good
    if (khac[fEl] === mEl) return { m: 0, f: 1 }; // Female overcomes Male -> Female Good
    return { m: 0.5, f: 0.5 }; // Same element
  };

  const compare = (
    mGanZhi: string,
    fGanZhi: string,
    mMangFull: string,
    fMangFull: string,
    mPhiFull: string,
    fPhiFull: string,
    mSinhFull: string,
    fSinhFull: string,
    weight: number,
    label: string,
  ) => {
    if (!mGanZhi || !fGanZhi) return;

    pillarsCompared++;

    const mCan = mGanZhi.split(" ")[0];
    const fCan = fGanZhi.split(" ")[0];
    const mChi = mGanZhi.split(" ")[1];
    const fChi = fGanZhi.split(" ")[1];
    const mMang = mMangFull.split(" ").pop() || "";
    const fMang = fMangFull.split(" ").pop() || "";
    const mPhi = mPhiFull.split(" ")[0];
    const fPhi = fPhiFull.split(" ")[0];
    const mSinh = mSinhFull.split(" ")[0];
    const fSinh = fSinhFull.split(" ")[0];

    const wCan = weight * 0.2;
    const wChi = weight * 0.2;
    const wMang = weight * 0.2;
    const wPhi = weight * 0.2;
    const wSinh = weight * 0.2;

    // Can
    let canScore = wCan / 2;
    let canDesc = "Bình thường";
    if (canMap[mCan]?.includes(fCan)) {
      canScore = wCan;
      canDesc = "Tương hợp";
    } else if (canKhac[mCan]?.includes(fCan) || canKhac[fCan]?.includes(mCan)) {
      canScore = 0;
      canDesc = "Tương khắc";
    }

    // Chi
    let chiScore = wChi / 2;
    let chiDesc = "Bình thường";
    if (tamHop.some((g) => g.includes(mChi) && g.includes(fChi))) {
      chiScore = wChi;
      chiDesc = "Tam hợp";
    } else if (lucHop.some((g) => g.includes(mChi) && g.includes(fChi))) {
      chiScore = wChi;
      chiDesc = "Lục hợp";
    } else if (tuHanhXung.some((g) => g.includes(mChi) && g.includes(fChi))) {
      chiScore = 0;
      chiDesc = "Tứ hành xung";
    }

    // Mang
    let mangScore = wMang / 2;
    let mangDesc = "Bình thường";
    if (sinh[mMang] === fMang || sinh[fMang] === mMang) {
      mangScore = wMang;
      mangDesc = "Tương sinh";
    } else if (mMang === fMang) {
      mangScore = wMang * 0.75;
      mangDesc = "Bình hòa";
    } else if (khac[mMang] === fMang || khac[fMang] === mMang) {
      mangScore = 0;
      mangDesc = "Tương khắc";
    }

    // Phi Cung
    const phiBatTrach = phiCungMap[mPhi]?.[fPhi] || "Bình thường";
    const phiScore = tot.includes(phiBatTrach)
      ? wPhi
      : phiBatTrach === "Bình thường"
        ? wPhi / 2
        : 0;

    // Sinh Cung
    let sinhBatTrach = phiCungMap[mSinh]?.[fSinh] || "Bình thường";

    // Custom mapping for Sinh Cung as requested
    if (sinhBatTrach === "Thiên Y") sinhBatTrach = "Phúc Đức";
    else if (sinhBatTrach === "Diên Niên" || sinhBatTrach === "Phúc Đức")
      sinhBatTrach = "Họa Hại";
    else if (sinhBatTrach === "Họa Hại") sinhBatTrach = "Ngũ Quỷ";
    else if (sinhBatTrach === "Ngũ Quỷ") sinhBatTrach = "Thiên Y";

    // Calculate score: Good ones get full points, bad ones (Họa Hại, Ngũ Quỷ, etc.) get 0
    let sinhScore = tot.includes(sinhBatTrach)
      ? wSinh
      : sinhBatTrach === "Bình thường"
        ? wSinh / 2
        : 0;
    if (["Họa Hại", "Ngũ Quỷ", "Tuyệt Mệnh", "Lục Sát"].includes(sinhBatTrach))
      sinhScore = 0;

    // Goodness Calculation (Can & Chi)
    const canGood = calculateGoodness(canElements[mCan], canElements[fCan]);
    const chiGood = calculateGoodness(chiElements[mChi], chiElements[fChi]);
    maleGoodPoints += canGood.m + chiGood.m;
    femaleGoodPoints += canGood.f + chiGood.f;

    results.push({
      label,
      can: {
        male: mCan,
        female: fCan,
        score: canScore,
        max: wCan,
        desc: canDesc,
      },
      chi: {
        male: mChi,
        female: fChi,
        score: chiScore,
        max: wChi,
        desc: chiDesc,
      },
      mang: {
        male: mMangFull,
        female: fMangFull,
        score: mangScore,
        max: wMang,
        desc: mangDesc,
      },
      phiCung: {
        male: mPhiFull,
        female: fPhiFull,
        score: phiScore,
        max: wPhi,
        desc: phiBatTrach,
      },
      sinhCung: {
        male: mSinhFull,
        female: fSinhFull,
        score: sinhScore,
        max: wSinh,
        desc: sinhBatTrach,
      },
    });

    totalScore += canScore + chiScore + mangScore + phiScore + sinhScore;
  };

  compare(
    m.lunarYearName,
    f.lunarYearName,
    m.yearMang,
    f.yearMang,
    m.yearPhiCung,
    f.yearPhiCung,
    m.yearSinhCung,
    f.yearSinhCung,
    20,
    "Trụ Năm",
  );

  if (
    maleDate.month !== "" &&
    femaleDate.month !== "" &&
    maleDate.month !== undefined &&
    femaleDate.month !== undefined
  ) {
    compare(
      m.lunarMonthName,
      f.lunarMonthName,
      m.monthMang,
      f.monthMang,
      m.monthPhiCung,
      f.monthPhiCung,
      m.monthSinhCung,
      f.monthSinhCung,
      20,
      "Trụ Tháng",
    );
  }
  if (
    maleDate.day !== "" &&
    femaleDate.day !== "" &&
    maleDate.day !== undefined &&
    femaleDate.day !== undefined
  ) {
    compare(
      m.lunarDayName,
      f.lunarDayName,
      m.dayMang,
      f.dayMang,
      m.dayPhiCung,
      f.dayPhiCung,
      m.daySinhCung,
      f.daySinhCung,
      40,
      "Trụ Ngày",
    );
  }
  if (
    maleDate.hour !== "" &&
    femaleDate.hour !== "" &&
    maleDate.hour !== undefined &&
    femaleDate.hour !== undefined
  ) {
    compare(
      m.lunarHourName,
      f.lunarHourName,
      m.hourMang,
      f.hourMang,
      m.hourPhiCung,
      f.hourPhiCung,
      m.hourSinhCung,
      f.hourSinhCung,
      20,
      "Trụ Giờ",
    );
  }

  return {
    totalScore: Math.round(totalScore),
    results,
    maleGoodPercent: Math.round(
      (maleGoodPoints / ((pillarsCompared || 1) * 2)) * 100,
    ),
    femaleGoodPercent: Math.round(
      (femaleGoodPoints / ((pillarsCompared || 1) * 2)) * 100,
    ),
  };
}

function calculateElementDistribution(pillars: any[]) {
  const distribution: Record<string, number> = {
    Mộc: 0,
    Hỏa: 0,
    Thổ: 0,
    Kim: 0,
    Thủy: 0,
  };

  pillars.forEach((p) => {
    // Stem (Can) - 12.5%
    const stemElement = GAN_INFO[p.gan]?.element;
    if (stemElement) {
      distribution[stemElement] += 12.5;
    }

    // Branch (Chi) - Hidden Stems (Can ẩn)
    const hiddenStems = TANG_DON[p.zhi] || [];
    if (hiddenStems.length === 1) {
      const el = GAN_INFO[hiddenStems[0]]?.element;
      if (el) distribution[el] += 12.5;
    } else if (hiddenStems.length === 2) {
      const el1 = GAN_INFO[hiddenStems[0]]?.element;
      const el2 = GAN_INFO[hiddenStems[1]]?.element;
      if (el1) distribution[el1] += 6.5;
      if (el2) distribution[el2] += 6;
    } else if (hiddenStems.length === 3) {
      const el1 = GAN_INFO[hiddenStems[0]]?.element;
      const el2 = GAN_INFO[hiddenStems[1]]?.element;
      const el3 = GAN_INFO[hiddenStems[2]]?.element;
      if (el1) distribution[el1] += 6;
      if (el2) distribution[el2] += 4.5;
      if (el3) distribution[el3] += 2;
    }
  });

  return Object.entries(distribution)
    .map(([name, value]) => ({ name, value: Number(value.toFixed(1)) }))
    .filter((item) => item.value > 0);
}

const ELEMENT_MOTHER: Record<string, string> = {
  Mộc: "Thủy",
  Hỏa: "Mộc",
  Thổ: "Hỏa",
  Kim: "Thổ",
  Thủy: "Kim",
};

function FiveElementsChart({
  pillars,
  dayMasterElement,
  gender,
}: {
  pillars: any[];
  dayMasterElement: string;
  gender: string;
}) {
  const data = calculateElementDistribution(pillars);

  const yearGan = pillars[0]?.gan;
  const polarity = GAN_INFO[yearGan]?.polarity;
  const isMale = gender === "male";
  let destYangYin = "Không rõ";
  if (polarity) {
    destYangYin =
      polarity === "Yang"
        ? isMale
          ? "Dương Nam"
          : "Dương Nữ"
        : isMale
          ? "Âm Nam"
          : "Âm Nữ";
  }

  const motherEl = ELEMENT_MOTHER[dayMasterElement] || "";
  const selfVal = data.find((d) => d.name === dayMasterElement)?.value || 0;
  const motherVal = data.find((d) => d.name === motherEl)?.value || 0;
  const totalSupport = selfVal + motherVal;

  // Rule of thumb for FiveElementsChart: > 40% combined is considered strong if it's out of 5.
  const isVuong = totalSupport >= 45;
  const strengthStr = isVuong ? "Thân Vượng" : "Thân Nhược";

  return (
    <div className="w-full mt-6 bg-[#F2F2EB] border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col items-center">
      <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">
        Phân Bổ Ngũ Hành (Nhật Chủ: {dayMasterElement})
      </h3>
      <div className="w-full h-[320px] overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="35%"
              outerRadius="55%"
              paddingAngle={5}
              dataKey="value"
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                value,
                name,
                x,
                y,
                textAnchor,
              }) => {
                const thapThan = getThapThanClass(
                  dayMasterElement || "",
                  name || "",
                );
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor={textAnchor}
                    dominantBaseline="central"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#475569"
                  >
                    <tspan x={x} dy="-0.6em">
                      {name} ({thapThan})
                    </tspan>
                    <tspan x={x} dy="1.2em">
                      {value}%
                    </tspan>
                  </text>
                );
              }}
              labelLine={{ stroke: "#94a3b8", strokeWidth: 1 }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={ELEMENT_COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) =>
                [`${value}%`, "Tỷ lệ"] as [string, string]
              }
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={30}
              iconSize={10}
              wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between w-full text-xs text-gray-600 gap-2 px-2">
        <div className="flex items-center gap-1.5 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100 shadow-sm">
          <span className="font-bold text-amber-800">Âm Dương:</span>
          <span className="font-medium text-amber-900">{destYangYin}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
          <span className="font-bold text-blue-800">Cường Nhược:</span>
          <span className="font-medium text-blue-900">
            {strengthStr} (Lực trợ: {totalSupport.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

const JIE_QI_VIET: Record<string, string> = {
  冬至: "Đông Chí",
  小寒: "Tiểu Hàn",
  大寒: "Đại Hàn",
  立春: "Lập Xuân",
  雨水: "Vũ Thủy",
  惊蛰: "Kinh Trập",
  驚蟄: "Kinh Trập",
  春分: "Xuân Phân",
  清明: "Thanh Minh",
  谷雨: "Cốc Vũ",
  穀雨: "Cốc Vũ",
  立夏: "Lập Hạ",
  小满: "Tiểu Mãn",
  小滿: "Tiểu Mãn",
  芒种: "Mang Chủng",
  芒種: "Mang Chủng",
  夏至: "Hạ Chí",
  小暑: "Tiểu Thử",
  大暑: "Đại Thử",
  立秋: "Lập Thu",
  处暑: "Xử Thử",
  處暑: "Xử Thử",
  白露: "Bạch Lộ",
  秋分: "Thu Phân",
  寒露: "Hàn Lộ",
  霜降: "Sương Giáng",
  立冬: "Lập Đông",
  小雪: "Tiểu Tuyết",
  大雪: "Đại Tuyết",
};

const JieQiModal = ({
  year,
  onClose,
}: {
  year: number;
  onClose: () => void;
}) => {
  const [terms, setTerms] = useState<any[]>([]);

  useEffect(() => {
    if (!year || year < 1) return;
    try {
      const lunar1 = Solar.fromYmd(year, 6, 1).getLunar();
      const table1 = lunar1.getJieQiTable() as any;
      const lunar2 = Solar.fromYmd(year + 1, 1, 1).getLunar();
      const table2 = lunar2.getJieQiTable() as any;

      const allNames = lunar1.getJieQiList() as string[];
      const result: any[] = [];

      allNames.forEach((name) => {
        let d = table1[name];
        let added = false;
        const vietName = JIE_QI_VIET[name] || name;
        if (d && d.getYear() === year) {
          result.push({ name: vietName, solar: d });
          added = true;
        }
        if (!added) {
          d = table2[name];
          if (d && d.getYear() === year) {
            result.push({ name: vietName, solar: d });
          }
        }
      });

      result.sort((a, b) =>
        a.solar.toYmdHms().localeCompare(b.solar.toYmdHms()),
      );
      setTerms(result);
    } catch (e) {
      console.error(e);
    }
  }, [year]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#F2F2EB] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 uppercase tracking-wider">
            Bảng Tra Tiết Khí Năm {year}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {terms.map((term, idx) => (
              <div
                key={idx}
                className="flex flex-col p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-amber-50 hover:border-amber-200 transition-colors"
              >
                <span className="text-amber-700 font-bold text-sm tracking-wide">
                  {term.name}
                </span>
                <span className="text-gray-600 font-mono text-xs mt-1">
                  {term.solar.toYmdHms()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import { useLanguage } from "./contexts/LanguageContext";

const FastInput = React.memo(
  ({ value, onChange, name, delay, ...props }: any) => {
    const handleChange = (e: any) => {
      if (onChange) {
        onChange(e);
      }
    };
    return (
      <input name={name} value={value} onChange={handleChange} {...props} />
    );
  },
);

export default function App() {
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState(() => {
    try {
      return typeof window !== "undefined"
        ? localStorage.getItem("user_gemini_key") || ""
        : "";
    } catch (e) {
      return "";
    }
  });
  const [accessCode, setAccessCode] = useState(() => {
    try {
      return typeof window !== "undefined"
        ? localStorage.getItem("user_access_code") || ""
        : "";
    } catch (e) {
      return "";
    }
  });
  const [user, setUser] = useState<any>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u: any) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showSettings) {
      try {
        setUserApiKey(localStorage.getItem("user_gemini_key") || "");
        setAccessCode(localStorage.getItem("user_access_code") || "");
      } catch (e) {}
    }
  }, [showSettings]);

  const saveSettings = () => {
    try {
      localStorage.setItem("user_gemini_key", userApiKey);
      localStorage.setItem("user_access_code", accessCode);
      localStorage.setItem("user_gemini_model", selectedModel);
    } catch (e) {
      console.warn("Could not save settings to localStorage.");
    }
    setShowSettings(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://aistudio.google.com/app/apikey");
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };
  const [activeTab, setActiveTab] = useState<
    | "lichBatQuai"
    | "xemNgay"
    | "gieoQue"
    | "honNhan"
    | "tuTru"
    | "tuVi"
    | "thaiTo"
    | "thaiAt"
    | "kyMon"
  >("lichBatQuai");
  const [selectedModel, setSelectedModel] = useState(() => {
    try {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem("user_gemini_model") || GEMINI_MODEL
        : GEMINI_MODEL;
    } catch (e) {
      return GEMINI_MODEL;
    }
  });
  const [gieoQueMode, setGieoQueMode] = useState<
    "thuCong" | "linhUng" | "yNghia"
  >("thuCong");
  const [manualLines, setManualLines] = useState<boolean[]>([
    true,
    true,
    true,
    true,
    true,
    true,
  ]); // true = Yang, false = Yin. Index 0 is Hào 1
  const [manualMovingLines, setManualMovingLines] = useState<Set<number>>(
    new Set(),
  );
  const [manualToggledLines, setManualToggledLines] = useState<Set<number>>(
    new Set(),
  );
  const [manualIsCast, setManualIsCast] = useState<boolean>(false);
  const [manualCastDate, setManualCastDate] = useState<{
    year: number | string;
    month: number | string;
    day: number | string;
    hour: number | string;
  }>(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
    };
  });
  const [manualCastLunarInfo, setManualCastLunarInfo] = useState<any>(null);
  const [linhUngLines, setLinhUngLines] = useState<number[]>([]);
  const [linhUngToggledLines, setLinhUngToggledLines] = useState<Set<number>>(
    new Set(),
  );
  const [linhUngDateInfo, setLinhUngDateInfo] = useState<any>(null);
  const [linhUngShowMain, setLinhUngShowMain] = useState(false);
  const [linhUngShowChanged, setLinhUngShowChanged] = useState(false);
  const [selectedLookupHex, setSelectedLookupHex] = useState<{
    upper: number;
    lower: number;
  } | null>(null);
  const [gieoQueQuestion, setGieoQueQuestion] = useState("");
  const [gieoQueAnalysis, setGieoQueAnalysis] = useState("");
  const [isAnalyzingGieoQue, setIsAnalyzingGieoQue] = useState(false);
  const tieuVanRef = useRef<HTMLDivElement>(null);
  const liuNianRef = useRef<HTMLDivElement>(null);
  const liuThangRef = useRef<HTMLDivElement>(null);
  const liuNgayRef = useRef<HTMLDivElement>(null);
  const [showJieQiModal, setShowJieQiModal] = useState(false);
  const [selectedLiuNian, setSelectedLiuNian] = useState<number>(
    new Date().getFullYear(),
  );
  const [liuNianStartYear, setLiuNianStartYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(-1);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [showProfileList, setShowProfileList] = useState(false);

  const handleSaveApiKey = () => {
    if (userApiKey.trim()) {
      try {
        localStorage.setItem("user_gemini_key", userApiKey.trim());
        localStorage.setItem("user_gemini_model", selectedModel);
      } catch (e) {
        console.warn("Could not save to localStorage.");
      }
      setShowSettings(false);
      alert("Đã lưu cấu hình API thành công!");
    }
  };

  const handleClearApiKey = () => {
    try {
      localStorage.removeItem("user_gemini_key");
    } catch (e) {}
    setUserApiKey("");
    alert("Đã xóa cấu hình API!");
  };

  useEffect(() => {
    // Ngăn chặn hành vi "Kéo để tải lại" (Pull-to-refresh) trên ứng dụng APK/WebView
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY === 0) {
        // Có thể thêm logic kiểm tra hướng vuốt ở đây nếu cần
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Nếu overscroll-behavior: none trong CSS chưa đủ, ta có thể can thiệp thêm ở đây
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    return () => document.removeEventListener("touchstart", handleTouchStart);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bazi_profiles");
      if (saved) {
        setSavedProfiles(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to parse saved profiles", e);
    }
  }, []);

  const saveCurrentProfile = () => {
    const newProfile = {
      id: Date.now().toString(),
      name: date.name || "Người dùng",
      year: date.year,
      month: date.month,
      day: date.day,
      hour: date.hour,
      gender: gender,
      isLunar: isLunarInput,
      createdAt: Date.now(),
    };
    const updated = [newProfile, ...savedProfiles];
    setSavedProfiles(updated);
    try {
      localStorage.setItem("bazi_profiles", JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save to localStorage.");
    }
    alert("Đã lưu lá số thành công!");
  };

  const deleteProfile = (id: string) => {
    const updated = savedProfiles.filter((p) => p.id !== id);
    setSavedProfiles(updated);
    try {
      localStorage.setItem("bazi_profiles", JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save to localStorage.");
    }
  };

  const loadProfile = (profile: any) => {
    setDate({
      name: profile.name,
      year: profile.year,
      month: profile.month,
      day: profile.day,
      hour: profile.hour,
    });
    setGender(profile.gender);
    setIsLunarInput(profile.isLunar);
    setShowProfileList(false);
  };

  const baziMonths = useMemo(() => {
    if (!selectedLiuNian) return [];
    let solar = Solar.fromYmdHms(selectedLiuNian, 1, 15, 12, 0, 0);

    // Tìm ngày đầu tiên của năm Bát Tự (Lập Xuân) cho năm selectedLiuNian
    while (true) {
      const ec = solar.getLunar().getEightChar(2);
      // Bắt đầu một năm mới khi tháng là Dần và ngày tiết khí đã điểm
      if (translateGanZhi(ec.getMonthZhi()) === "Dần") {
        break;
      }
      solar = solar.next(1);
    }

    const months = [];
    for (let i = 0; i < 12; i++) {
      const currentMonthDays = [];
      const ecStart = solar.getLunar().getEightChar(2);
      const currentGanZhi = translateGanZhi(ecStart.getMonth());
      const currentZhi = translateGanZhi(ecStart.getMonthZhi());
      const currentGan = translateGanZhi(ecStart.getMonthGan());

      while (true) {
        currentMonthDays.push(solar);
        solar = solar.next(1);
        const ecNext = solar.getLunar().getEightChar(2);
        if (translateGanZhi(ecNext.getMonth()) !== currentGanZhi) {
          break;
        }
      }

      months.push({
        name: currentZhi,
        ganZhi: currentGanZhi,
        gan: currentGan,
        zhi: currentZhi,
        days: currentMonthDays,
      });
    }
    return months;
  }, [selectedLiuNian]);

  const [isLunarInput, setIsLunarInput] = useState(false);
  const [date, setDate] = useState<{
    name: string;
    year: number | string;
    month: number | string;
    day: number | string;
    hour: number | string;
  }>(() => {
    const now = new Date();
    return {
      name: "Hội Viên",
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
    };
  });

  const [baguaDate, setBaguaDate] = useState<{
    year: number | string;
    month: number | string;
    day: number | string;
    hour: number | string;
    minute: number | string;
  }>(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
    };
  });
  const [baguaLunarInfo, setBaguaLunarInfo] = useState<any>(null);
  const [isBaguaAutoUpdate, setIsBaguaAutoUpdate] = useState(true);

  const [maleDate, setMaleDate] = useState<{
    name: string;
    year: number | string;
    month: number | string;
    day: number | string;
    hour: number | string;
  }>({
    name: "Nam",
    year: "",
    month: "",
    day: "",
    hour: "",
  });
  const [femaleDate, setFemaleDate] = useState<{
    name: string;
    year: number | string;
    month: number | string;
    day: number | string;
    hour: number | string;
  }>({
    name: "Nữ",
    year: "",
    month: "",
    day: "",
    hour: "",
  });

  const [maleLunarInfo, setMaleLunarInfo] = useState<any>(null);
  const [femaleLunarInfo, setFemaleLunarInfo] = useState<any>(null);

  const [lunarInfo, setLunarInfo] = useState<any>(null);
  const [gender, setGender] = useState<"male" | "female">("male");

  const pillars = useMemo(() => {
    if (!lunarInfo?.lunar) return [];
    const eightChar = lunarInfo.lunar.getEightChar(2);
    return [
      {
        label: t("bazi.year"),
        gan: t(translateGanZhi(eightChar.getYearGan())),
        zhi: t(translateGanZhi(eightChar.getYearZhi())),
        nayin: t(
          NAYIN_MAP[lunarInfo.lunar.getYearNaYin()] ||
            lunarInfo.lunar.getYearNaYin(),
        ),
      },
      {
        label: `${t("bazi.month")} ${Math.abs(lunarInfo.lunar.getMonth())}`,
        gan: t(translateGanZhi(eightChar.getMonthGan())),
        zhi: t(translateGanZhi(eightChar.getMonthZhi())),
        nayin: t(
          NAYIN_MAP[lunarInfo.lunar.getMonthNaYin()] ||
            lunarInfo.lunar.getMonthNaYin(),
        ),
      },
      {
        label: t("bazi.day"),
        gan: t(translateGanZhi(eightChar.getDayGan())),
        zhi: t(translateGanZhi(eightChar.getDayZhi())),
        nayin: t(
          NAYIN_MAP[lunarInfo.lunar.getDayNaYin()] ||
            lunarInfo.lunar.getDayNaYin(),
        ),
      },
      {
        label: t("bazi.gio"),
        gan: t(translateGanZhi(eightChar.getTimeGan())),
        zhi: t(translateGanZhi(eightChar.getTimeZhi())),
        nayin: t(
          NAYIN_MAP[lunarInfo.lunar.getTimeNaYin()] ||
            lunarInfo.lunar.getTimeNaYin(),
        ),
      },
    ];
  }, [lunarInfo?.lunar]);

  const dayGan = pillars[2]?.gan || "";

  const liuNianYears = useMemo(() => {
    if (!lunarInfo?.lunar || !dayGan) return [];
    const birthYear = lunarInfo.lunar.getYear();
    return Array.from({ length: 100 }, (_, index) => {
      const currentYear = birthYear + index;
      const solarYear = Solar.fromYmdHms(currentYear, 7, 1, 0, 0, 0);
      const lYear = solarYear.getLunar();
      const gz = translateGanZhi(lYear.getYearInGanZhi());
      const [g, z] = gz.split(" ");
      return {
        year: currentYear,
        g,
        z,
        ttGan: getThapThan(dayGan, g),
        ttZhi: getThapThan(dayGan, TANG_DON[z]?.[0] || ""),
      };
    });
  }, [lunarInfo?.lunar?.getYear(), dayGan]);

  const xiaoYunMap = useMemo(() => {
    if (!lunarInfo?.lunar || !dayGan) return {};
    const eightChar = lunarInfo.lunar.getEightChar(2);
    const yun = eightChar.getYun(gender === "male" ? 1 : 0);
    const daYunList = yun.getDaYun();
    const map: Record<
      number,
      { g: string; z: string; ttGan: string; ttZhi: string }
    > = {};

    daYunList.forEach((dy: any) => {
      if (typeof dy.getXiaoYun === "function") {
        const xys = dy.getXiaoYun();
        xys.forEach((xy: any) => {
          const gz = translateGanZhi(xy.getGanZhi());
          const [g, z] = gz.split(" ");
          map[xy.getYear()] = {
            g,
            z,
            ttGan: getThapThan(dayGan, g),
            ttZhi: getThapThan(dayGan, TANG_DON[z]?.[0] || ""),
          };
        });
      }
    });
    return map;
  }, [lunarInfo?.lunar, gender, dayGan]);

  const [baziQuestion, setBaziQuestion] = useState<string>("");
  const [baziChat, setBaziChat] = useState<
    { role: "user" | "model"; text: string }[]
  >([]);
  const [marriageQuestion, setMarriageQuestion] = useState<string>("");
  const [lichQuestion, setLichQuestion] = useState<string>("");
  const [marriageAiAnalysis, setMarriageAiAnalysis] = useState<string>("");
  const [lichAiAnalysis, setLichAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isAnalyzingMarriage, setIsAnalyzingMarriage] = useState(false);
  const [isAnalyzingLich, setIsAnalyzingLich] = useState(false);
  const [autoLichAnalysis, setAutoLichAnalysis] = useState<string>("");
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
  const [lastAutoAnalyzedSignature, setLastAutoAnalyzedSignature] =
    useState<string>("");
  const lastAutoAnalyzedTimeRef = useRef<number>(0);
  const [customRemainder, setCustomRemainder] = useState<number | null>(null);
  const [customQuotient, setCustomQuotient] = useState<number | null>(null);

  const getTrigramFromBinary = (binary: number[]) => {
    for (let i = 0; i < 8; i++) {
      const b = TRIGRAM_LINES[i as keyof typeof TRIGRAM_LINES].binary;
      if (b[0] === binary[0] && b[1] === binary[1] && b[2] === binary[2]) {
        return i;
      }
    }
    return 0;
  };

  useEffect(() => {
    if (activeTab === "tuTru") {
      setTimeout(() => {
        const currentYear = new Date().getFullYear();
        if (tieuVanRef.current) {
          const el = tieuVanRef.current.querySelector(
            `[data-year="${currentYear}"]`,
          );
          if (el)
            tieuVanRef.current.scrollTo({
              left: (el as HTMLElement).offsetLeft - 60,
              behavior: "smooth",
            });
        }
        if (liuNianRef.current) {
          const el = liuNianRef.current.querySelector(
            `[data-year="${currentYear}"]`,
          );
          if (el)
            liuNianRef.current.scrollTo({
              left: (el as HTMLElement).offsetLeft - 60,
              behavior: "smooth",
            });
        }
        if (liuThangRef.current)
          liuThangRef.current.scrollTo({ left: 0, behavior: "smooth" });
        if (liuNgayRef.current)
          liuNgayRef.current.scrollTo({ left: 0, behavior: "smooth" });
      }, 100);
    }
  }, [activeTab, lunarInfo]);

  useEffect(() => {
    if (liuThangRef.current)
      liuThangRef.current.scrollTo({ left: 0, behavior: "smooth" });
    if (liuNgayRef.current)
      liuNgayRef.current.scrollTo({ left: 0, behavior: "smooth" });
  }, [selectedLiuNian, selectedMonthIdx]);

  useEffect(() => {
    try {
      const year = Number(date.year);
      const month = Number(date.month);
      const day = Number(date.day);
      const hour = Number(date.hour);

      if (
        !year ||
        year < 1 ||
        !month ||
        month < 1 ||
        month > 12 ||
        !day ||
        day < 1 ||
        day > 31 ||
        isNaN(hour) ||
        hour < 0 ||
        hour > 23
      ) {
        return;
      }

      let solarDate: any;
      if (isLunarInput) {
        const lunarDate = Lunar.fromYmd(year, month, day);
        solarDate = lunarDate.getSolar();
      } else {
        solarDate = Solar.fromYmdHms(year, month, day, hour, 0, 0);
      }

      const info = calculateLunarInfo(
        solarDate.getYear(),
        solarDate.getMonth(),
        solarDate.getDay(),
        hour,
        0,
        gender,
      );
      if (info) {
        setLunarInfo(info);
      }
    } catch (error) {
      console.error("Invalid date or lunar input", error);
    }
  }, [date, isLunarInput]);

  useEffect(() => {
    try {
      const year = Number(baguaDate.year);
      const month = Number(baguaDate.month);
      const day = Number(baguaDate.day);
      const hour = Number(baguaDate.hour);
      const minute = Number(baguaDate.minute || 0);

      if (
        !year ||
        year < 1 ||
        !month ||
        month < 1 ||
        month > 12 ||
        !day ||
        day < 1 ||
        day > 31 ||
        isNaN(hour) ||
        hour < 0 ||
        hour > 23 ||
        isNaN(minute) ||
        minute < 0 ||
        minute > 59
      ) {
        return;
      }

      const solarDate = Solar.fromYmdHms(
        year,
        month,
        day,
        hour || 0,
        minute,
        0,
      );
      const info = calculateLunarInfo(
        solarDate.getYear(),
        solarDate.getMonth(),
        solarDate.getDay(),
        hour,
        minute,
        gender,
      );
      if (info) {
        setBaguaLunarInfo(info);
      }
    } catch (error) {
      console.error("Invalid bagua date input", error);
    }
  }, [baguaDate]);

  useEffect(() => {
    if (!isBaguaAutoUpdate || activeTab !== "lichBatQuai") return;

    const intervalId = setInterval(() => {
      const now = new Date();
      setBaguaDate((prev) => {
        if (
          prev.year === now.getFullYear() &&
          prev.month === now.getMonth() + 1 &&
          prev.day === now.getDate() &&
          prev.hour === now.getHours() &&
          prev.minute === now.getMinutes()
        ) {
          return prev;
        }
        return {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
          hour: now.getHours(),
          minute: now.getMinutes(),
        };
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isBaguaAutoUpdate, activeTab]);

  useEffect(() => {
    try {
      const year = Number(maleDate.year);
      const month = Number(maleDate.month);
      const day = Number(maleDate.day);
      const hour = Number(maleDate.hour);

      if (!year) {
        setMaleLunarInfo(null);
        return;
      }

      // If full date is provided
      if (
        month &&
        day &&
        !isNaN(hour) &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31 &&
        hour >= 0 &&
        hour <= 23
      ) {
        const info = calculateLunarInfo(year, month, day, hour, 0, "male");
        setMaleLunarInfo(info);
      } else {
        // If only year is provided
        const info = calculateYearOnlyInfo(year, "male");
        setMaleLunarInfo(info);
      }
    } catch (e) {}
  }, [maleDate]);

  useEffect(() => {
    try {
      const year = Number(femaleDate.year);
      const month = Number(femaleDate.month);
      const day = Number(femaleDate.day);
      const hour = Number(femaleDate.hour);

      if (!year) {
        setFemaleLunarInfo(null);
        return;
      }

      // If full date is provided
      if (
        month &&
        day &&
        !isNaN(hour) &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31 &&
        hour >= 0 &&
        hour <= 23
      ) {
        const info = calculateLunarInfo(year, month, day, hour, 0, "female");
        setFemaleLunarInfo(info);
      } else {
        // If only year is provided
        const info = calculateYearOnlyInfo(year, "female");
        setFemaleLunarInfo(info);
      }
    } catch (e) {}
  }, [femaleDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDate((prev) => ({
      ...prev,
      [name]: name === "name" ? value : value === "" ? "" : parseInt(value),
    }));
    setBaziChat([]);
  };

  const handleBaguaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsBaguaAutoUpdate(false);
    const { name, value } = e.target;
    setBaguaDate((prev) => ({
      ...prev,
      [name]: value === "" ? "" : parseInt(value),
    }));
  };

  const analyzeMarriage = async (
    maleInfo: any,
    femaleInfo: any,
    comp: any,
    question?: string,
  ) => {
    setIsAnalyzingMarriage(true);
    setMarriageAiAnalysis("");
    try {
      const prompt = `Bạn là Đại sư tư vấn hôn nhân và phong thủy hàng đầu, tinh thông các kỳ thư: "Hiệp Kỷ Biện Phương Thư", "Ngọc Hạp Ký", "Tam Mệnh Thông Hội", phép "Lữ Tài Hiệp Hôn" và "Bát San Giao Chiến". Hãy luận sơ bộ mức độ hòa hợp của cặp đôi sau dựa trên lý luận sâu sắc của cổ nhân.

THÔNG TIN CẶP ĐÔI:
NAM: ${maleInfo.lunarYearName} (${maleInfo.yearMang}), Cung phi: ${maleInfo.yearPhiCung}, Sinh cung: ${maleInfo.yearSinhCung}
NỮ: ${femaleInfo.lunarYearName} (${femaleInfo.yearMang}), Cung phi: ${femaleInfo.yearPhiCung}, Sinh cung: ${femaleInfo.yearSinhCung}
KẾT QUẢ SƠ BỘ: Tổng ${comp.totalScore}%, Nam tốt ${comp.maleGoodPercent}%, Nữ tốt ${comp.femaleGoodPercent}%

${
  question
    ? `CÂU HỎI CỤ THỂ: "${question}"

YÊU CẦU DỰA TRÊN CỔ THƯ:
1. CHỈ TRẢ LỜI TRỰC TIẾP vào câu hỏi trên bằng cách trích dẫn lý thuyết từ các kỳ thư hoặc phép Lữ Tài. Không trả lời tổng quát rườm rà.
2. Trình bày súc tích, ngắn gọn, đi thẳng vào vấn đề kỹ thuật chuyên môn (Cát/Hung ở đâu, phạm Bát San gì, có cách nào hóa giải không...).
3. Câu trả lời phải mang đậm tính hàn lâm nhưng vẫn có giá trị tư vấn thực tế.`
    : `YÊU CẦU LUẬN ĐOÁN (Theo Cổ Thư):
1. Sự hòa hợp về Thiên Can, Địa Chi (Tương sinh, Tương khắc, Tam hợp, Lục xung...).
2. Sự hòa hợp về Ngũ Hành (Mạng) nạp âm năm sinh.
3. Luận Bát San Giao Chiến (Lữ Tài Hiệp Hôn) qua Cung Phi và Cung Sinh (Sinh Khí, Thiên Y, Diên Niên, Phục Vị hay Lục Sát, Họa Hại, Ngũ Quỷ, Tuyệt Mệnh).
4. Phân tích nguyên nhân sâu xa của những điểm thuận lợi và hung hiểm.
5. Đưa ra pháp môn hóa giải xung khắc cụ thể, thiết thực để duy trì tổ ấm.`
}

QUY TẮC: 
1. TUYỆT ĐỐI KHÔNG lời chào, không lời dẫn rườm rà (ví dụ "Dưới đây là...", "Chào bạn...").
2. ĐI THẲNG VÀO VẤN ĐỀ. Trả lời súc tích, ngắn gọn nhất có thể nhưng vẫn đảm bảo giá trị chuyên môn cao.
3. Trình bày bằng tiếng Việt, dùng Markdown.`;

      const aiInstance = getAI();
      const stream = await aiInstance.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let fullText = "";
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        fullText += c.text || "";
        setMarriageAiAnalysis(fullText);
      }
    } catch (error: any) {
      console.error("Marriage AI Analysis Error:", error);
      const errStr = handleAIError(error);
      if (
        errStr.includes("API Key") ||
        errStr.includes("Quota") ||
        error?.message === "API_KEY_MISSING"
      )
        setShowSettings(true);
      setMarriageAiAnalysis(errStr);
    } finally {
      setIsAnalyzingMarriage(false);
    }
  };

  const analyzeBazi = async (
    pillars: any[],
    lunar: any,
    gender: string,
    name: string,
    question?: string,
  ) => {
    setIsAnalyzing(true);

    try {
      let daYunStr = "";
      try {
        const eightChar = lunar.getEightChar(2);
        const yun = eightChar.getYun(gender === "male" ? 1 : 0);
        const daYunList = yun.getDaYun();
        const dys = daYunList.slice(1, 5);
        daYunStr = dys
          .map(
            (dy: any) =>
              `- Đại vận từ năm ${dy.getStartYear()} (${dy.getStartAge()} tuổi): ${dy.getGanZhi()}`,
          )
          .join("\n");
      } catch (e) {
        console.error("Lỗi lấy đại vận", e);
      }

      const dayGan = pillars[2].gan;
      const yearZhi = pillars[0].zhi;
      const monthZhi = pillars[1].zhi;
      const dayZhi = pillars[2].zhi;
      const hourZhi = pillars[3].zhi;
      const commonShenSha = getShenSha(
        dayGan,
        yearZhi,
        monthZhi,
        dayZhi,
        hourZhi,
        pillars[0].gan,
        pillars,
      );
      const thaiNguyen = getThaiNguyen(pillars[1].gan, pillars[1].zhi);
      const menhCung = getMenhCung(
        ZHIS.indexOf(pillars[1].zhi),
        ZHIS.indexOf(pillars[3].zhi),
        pillars[0].gan,
      );

      const systemInstruction = `Bạn là Đại sư Bát Tự (Tứ Trụ) tinh thông các kỳ thư: "Dự Đoán Theo Tứ Trụ" (Thiệu Vĩ Hoa), "Tử Bình Chân Thuyên" (Thẩm Hiếu Chiêm), "Uyên Hải Tử Bình" (Từ Đại Thăng), "Tích Thiên Tủy" (Lưu Bá Ôn), "Cùng Thông Bảo Giám", "Tam Mệnh Thông Hội" (Vạn Dân Anh), và "Thần Phong Thông Khảo" (Trương Nam).

TƯ TƯỞNG LUẬN ĐOÁN (Cốt lõi từ các sách cổ):
- Từ "Tử Bình Chân Thuyên": Lấy Nguyệt Lệnh làm mạch chính để định CÁCH CỤC. Cách cục thành hay bại, phá hay cứu quyết định sự thành bại của đời người.
- Từ "Tích Thiên Tủy": Chú trọng "Thuận Nghịch", Âm Dương Ngũ Hành lưu thông. Quan sát bệnh của Mệnh Cục và tìm xem có Thuốc (Dụng thần) chữa hay không.
- Từ "Cùng Thông Bảo Giám": Rất coi trọng "Điều Hậu" (nhiệt độ, ẩm độ của tháng sinh, đặc biệt sinh tháng Tý, Sửu, Hợi hoặc Tị, Ngọ, Mùi).
- Từ "Tam Mệnh Thông Hội" & "Uyên Hải Tử Bình": Bổ khuyết thêm các phép tính nạp âm, thần sát, thần hội, và sự kết hợp phong phú của các trụ.
- Từ "Thần Phong Thông Khảo": Nhấn mạnh quan điểm lý thuyết Cấu tạo Bát tự và các luận điểm sát lý về sự thuần túy của ngũ hành.
- Từ Thiệu Vĩ Hoa: Kết hợp triệt để sự sinh khắc chế hóa Ngũ Hành, cân bằng Vượng Nhược của Nhật Chủ và sự tác động của Thần Sát lên Hạn Vận.

THÔNG TIN LÁ SỐ:
- Họ tên: ${name} (${gender === "male" ? "Nam" : "Nữ"})
- Trụ Năm: ${pillars[0].gan} ${pillars[0].zhi} (${pillars[0].nayin}) - Thần Sát: ${commonShenSha.year.join(", ")}
- Trụ Tháng: ${pillars[1].gan} ${pillars[1].zhi} (${pillars[1].nayin}) (Nguyệt Lệnh) - Thần Sát: ${commonShenSha.month.join(", ")}
- Trụ Ngày: ${pillars[2].gan} ${pillars[2].zhi} (${pillars[2].nayin}) (Nhật Chủ) - Thần Sát: ${commonShenSha.day.join(", ")}
- Trụ Giờ: ${pillars[3].gan} ${pillars[3].zhi} (${pillars[3].nayin}) - Thần Sát: ${commonShenSha.hour.join(", ")}
- Đại Vận: ${daYunStr || "Không xác định"}
- Thai Nguyên: ${thaiNguyen}, Mệnh Cung: ${menhCung}

QUY TẮC PHẢN HỒI:
1. TRỰC DIỆN, súc tích, chuyên sâu. Dùng Markdown để làm nổi bật (in đậm, danh sách).
2. TUYỆT ĐỐI KHÔNG DÙNG LỜI CHÀO HAY CẢM ƠN. ĐI THẲNG VÀO BÀI PHÂN TÍCH.
3. Khi luận, hãy chỉ rõ Dụng/Kỵ Thần, điểm mạnh, điểm yếu lá số, Cách Cục, và lời khuyên rèn luyện bản thân để xu cát tị hung.`;

      const userPrompt = question
        ? question
        : "Hãy luận đoán tổng quan lá số của tôi (Nhật Chủ, Tài lộc, Sự nghiệp).";
      const displayUserMsg = question
        ? question
        : "Luận đoán tổng quan lá số bật định.";

      const apiContents = sanitizeApiContents(baziChat, userPrompt);

      setBaziChat((prev) => [
        ...prev,
        { role: "user", text: displayUserMsg },
        { role: "model", text: "" },
      ]);
      setBaziQuestion("");

      const aiInstance = getAI();
      const stream = await aiInstance.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: apiContents,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      let fullText = "";
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        fullText += c.text || "";
        setBaziChat((prev) => {
          if (prev.length === 0) return prev;
          const newChat = [...prev];
          newChat[newChat.length - 1] = { role: "model", text: fullText };
          return newChat;
        });
      }
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      const displayError = handleAIError(error);
      if (
        displayError.includes("API Key") ||
        displayError.includes("Quota") ||
        error?.message === "API_KEY_MISSING"
      )
        setShowSettings(true);

      setBaziChat((prev) => {
        if (prev.length === 0) return prev;
        const newChat = [...prev];
        newChat[newChat.length - 1] = {
          role: "model",
          text: displayError,
        };
        return newChat;
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeGieoQue = async (
    mainUpper: number,
    mainLower: number,
    changedUpper: number,
    changedLower: number,
    movingLines: Set<number>,
    question: string,
  ) => {
    setIsAnalyzingGieoQue(true);
    setGieoQueAnalysis("");
    try {
      const hexName = HEXAGRAM_NAMES[`${mainUpper},${mainLower}`];
      const changedHexName = HEXAGRAM_NAMES[`${changedUpper},${changedLower}`];
      const movingStr = Array.from(movingLines).join(", ") || "Không có";

      const prompt = `Bạn là Đại sư Kinh Dịch. Dựa vào quẻ được gieo bằng Lục Hào:
QUẺ CHÍNH: ${hexName}
QUẺ BIẾN: ${changedHexName}
Hào động: ${movingStr}

${question ? `CÂU HỎI: "${question}"` : ""}

YÊU CẦU:
1. Trả lời súc tích, đi thẳng vào vấn đề theo sát Quẻ Chính và Quẻ Biến trên.
2. Giải thích ý nghĩa hào động.
3. Đưa ra kết luận Cát/Hung.`;

      const aiInstance = getAI();
      const stream = await aiInstance.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let fullText = "";
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        fullText += c.text || "";
        setGieoQueAnalysis(fullText);
      }
    } catch (error: any) {
      console.error("Gieo Que AI Analysis Error:", error);
      const errStr = handleAIError(error);
      if (
        errStr.includes("API Key") ||
        errStr.includes("Quota") ||
        error?.message === "API_KEY_MISSING"
      )
        setShowSettings(true);
      setGieoQueAnalysis(errStr);
    } finally {
      setIsAnalyzingGieoQue(false);
    }
  };

  const analyzeLich = async (
    lunarInfo: any,
    question: string | undefined,
    changedHexNameStr: string,
    pillarHexNameStr: string,
  ) => {
    setIsAnalyzingLich(true);
    setLichAiAnalysis("");
    try {
      const mainUpper =
        (customRemainder !== null ? customRemainder : lunarInfo.remainder) % 8;
      const mainLower =
        (customQuotient !== null ? customQuotient : lunarInfo.finalQuotient) %
        8;
      const hexName = HEXAGRAM_NAMES[`${mainUpper},${mainLower}`];

      const prompt = `Bạn là Đại sư Kinh Dịch theo pháp Thiệu Vĩ Hoa. Hãy luận đoán quẻ sau.

THÔNG TIN THỜI GIAN: ${lunarInfo.lunarYearName}, ${lunarInfo.lunarMonthName}, ${lunarInfo.lunarDayName}, ${lunarInfo.lunarHourName}
QUẺ CHÍNH: ${hexName} (${mainUpper}/${mainLower}), Hào động (Hệ Thống): ${lunarInfo.changingLine}
QUẺ BIẾN (Theo Hào Động / Click): ${changedHexNameStr}
QUẺ BIẾN (Theo Tứ Trụ): ${pillarHexNameStr}

${
  question
    ? `CÂU HỎI CỤ THỂ: "${question}"

YÊU CẦU:
1. TRẢ LỜI TRỰC TIẾP vào câu hỏi trên. Tuyệt đối không trả lời tổng quát rườm rà.
2. Phân tích dựa trên Tượng, Số, Hào súc tích, giá trị cao. Bạn phải giải thích dựa trên CHÍNH XÁC Quẻ Chính và Quẻ Biến đã được cung cấp ở trên, không được tự ý đổi tên quẻ.`
    : `YÊU CẦU LUẬN ĐOÁN:
1. Ý nghĩa quẻ chính (Thể, Dụng tương tác).
2. Ý nghĩa sự biến đổi từ Quẻ Chính sang Quẻ Biến đã được cung cấp ở trên.
3. Luận đoán cụ thể (Công việc, Tài lộc, Tình cảm, Sức khỏe).
4. Lời khuyên tối ưu dựa trên triết lý Kinh Dịch.`
}

QUY TẮC: 
1. TUYỆT ĐỐI KHÔNG lời chào, không lời dẫn rườm rà. 
2. Đi thẳng vào quẻ dịch, súc tích, bám sát Thiệu Vĩ Hoa. 
3. Markdown, ngắn gọn tối đa nhưng giá trị cao.`;

      const aiInstance = getAI();
      const stream = await aiInstance.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let fullText = "";
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        fullText += c.text || "";
        setLichAiAnalysis(fullText);
      }
    } catch (error: any) {
      console.error("Lich AI Analysis Error:", error);
      const errStr = handleAIError(error);
      if (
        errStr.includes("API Key") ||
        errStr.includes("Quota") ||
        error?.message === "API_KEY_MISSING"
      )
        setShowSettings(true);
      setLichAiAnalysis(errStr);
    } finally {
      setIsAnalyzingLich(false);
    }
  };

  const handleMaleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMaleDate((prev) => ({
      ...prev,
      [name]: name === "name" ? value : value === "" ? "" : parseInt(value),
    }));
  };

  const handleFemaleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFemaleDate((prev) => ({
      ...prev,
      [name]: name === "name" ? value : value === "" ? "" : parseInt(value),
    }));
  };

  const mainUpper =
    (customRemainder !== null
      ? customRemainder
      : baguaLunarInfo?.remainder || 0) % 8;
  const mainLower =
    (customQuotient !== null
      ? customQuotient
      : baguaLunarInfo?.finalQuotient || 0) % 8;

  let changedUpper = mainUpper;
  let changedLower = mainLower;

  if (baguaLunarInfo) {
    const origUpperBin = [
      ...TRIGRAM_LINES[mainUpper as keyof typeof TRIGRAM_LINES].binary,
    ];
    const origLowerBin = [
      ...TRIGRAM_LINES[mainLower as keyof typeof TRIGRAM_LINES].binary,
    ];

    const activeLines = new Set([baguaLunarInfo.changingLine]);

    const newLowerBin = origLowerBin.map((val, idx) =>
      activeLines.has(idx + 1) ? (val === 1 ? 0 : 1) : val,
    );
    const newUpperBin = origUpperBin.map((val, idx) =>
      activeLines.has(idx + 4) ? (val === 1 ? 0 : 1) : val,
    );

    changedLower = getTrigramFromBinary(newLowerBin);
    changedUpper = getTrigramFromBinary(newUpperBin);
  }

  let secondChangedUpper = mainUpper;
  let secondChangedLower = mainLower;

  if (baguaLunarInfo) {
    const origUpperBin = [
      ...TRIGRAM_LINES[mainUpper as keyof typeof TRIGRAM_LINES].binary,
    ];
    const origLowerBin = [
      ...TRIGRAM_LINES[mainLower as keyof typeof TRIGRAM_LINES].binary,
    ];

    const pLines = baguaLunarInfo?.pillarLines
      ? new Set(baguaLunarInfo.pillarLines.map(Number))
      : new Set<number>();

    const newLowerBin = origLowerBin.map((val, idx) =>
      pLines.has(idx + 1) ? (val === 1 ? 0 : 1) : val,
    );
    const newUpperBin = origUpperBin.map((val, idx) =>
      pLines.has(idx + 4) ? (val === 1 ? 0 : 1) : val,
    );

    secondChangedLower = getTrigramFromBinary(newLowerBin);
    secondChangedUpper = getTrigramFromBinary(newUpperBin);
  }

  const solarMainUpper = baguaLunarInfo?.solarRemainder % 8 || 0;
  const solarMainLower = baguaLunarInfo?.solarFinalQuotient % 8 || 0;
  const solarChangingLine =
    (baguaLunarInfo?.solarSum || 0) % 6 === 0
      ? 6
      : (baguaLunarInfo?.solarSum || 0) % 6 || 1;
  let solarChangedUpper = solarMainUpper;
  let solarChangedLower = solarMainLower;

  if (baguaLunarInfo) {
    const origUpperBin = [
      ...TRIGRAM_LINES[solarMainUpper as keyof typeof TRIGRAM_LINES].binary,
    ];
    const origLowerBin = [
      ...TRIGRAM_LINES[solarMainLower as keyof typeof TRIGRAM_LINES].binary,
    ];

    const activeSolarLines = new Set([solarChangingLine]);

    const newSolarLowerBin = origLowerBin.map((val, idx) =>
      activeSolarLines.has(idx + 1) ? (val === 1 ? 0 : 1) : val,
    );
    const newSolarUpperBin = origUpperBin.map((val, idx) =>
      activeSolarLines.has(idx + 4) ? (val === 1 ? 0 : 1) : val,
    );

    solarChangedLower = getTrigramFromBinary(newSolarLowerBin);
    solarChangedUpper = getTrigramFromBinary(newSolarUpperBin);
  }

  let solarSecondChangedUpper = baguaLunarInfo?.solarRemainder % 8 || 0;
  let solarSecondChangedLower = baguaLunarInfo?.solarFinalQuotient % 8 || 0;

  if (baguaLunarInfo && baguaLunarInfo.solarPillarLines) {
    const origUpperBin = [
      ...TRIGRAM_LINES[solarSecondChangedUpper as keyof typeof TRIGRAM_LINES]
        .binary,
    ];
    const origLowerBin = [
      ...TRIGRAM_LINES[solarSecondChangedLower as keyof typeof TRIGRAM_LINES]
        .binary,
    ];

    // Solar pillar lines drive the change independently of toggled lines
    const pLines = new Set((baguaLunarInfo.solarPillarLines || []).map(Number));

    const newLowerBin = origLowerBin.map((val, idx) =>
      pLines.has(idx + 1) ? (val === 1 ? 0 : 1) : val,
    );
    const newUpperBin = origUpperBin.map((val, idx) =>
      pLines.has(idx + 4) ? (val === 1 ? 0 : 1) : val,
    );

    solarSecondChangedLower = getTrigramFromBinary(newLowerBin);
    solarSecondChangedUpper = getTrigramFromBinary(newUpperBin);
  }

  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualCastDate((prev) => ({
      ...prev,
      [name]: value === "" ? "" : parseInt(value),
    }));
  };

  useEffect(() => {
    try {
      const year = Number(manualCastDate.year);
      const month = Number(manualCastDate.month);
      const day = Number(manualCastDate.day);
      const hour = Number(manualCastDate.hour);

      if (
        !year ||
        year < 1 ||
        !month ||
        month < 1 ||
        month > 12 ||
        !day ||
        day < 1 ||
        day > 31 ||
        isNaN(hour) ||
        hour < 0 ||
        hour > 23
      ) {
        return;
      }

      const solarDate = Solar.fromYmdHms(year, month, day, hour || 0, 0, 0);
      const info = calculateLunarInfo(
        solarDate.getYear(),
        solarDate.getMonth(),
        solarDate.getDay(),
        hour,
        0,
        "male",
      );
      if (info) {
        setManualCastLunarInfo(info);
      }
    } catch (error) {
      console.error("Invalid manual date input", error);
    }
  }, [manualCastDate]);

  useEffect(() => {
    if (activeTab !== "lichBatQuai" || !baguaLunarInfo) return;

    const signature = `${mainUpper}-${mainLower}-${changedUpper}-${changedLower}-${baguaLunarInfo.lunarHourName}`;

    if (signature !== lastAutoAnalyzedSignature) {
      setLastAutoAnalyzedSignature(signature);

      const autoAnalyze = async () => {
        if (!isAutoAnalyzing) {
          // Avoid overlapping calls
          // 5 minute cooldown for the SAME signature
          const now = Date.now();
          if (
            signature === lastAutoAnalyzedSignature &&
            now - lastAutoAnalyzedTimeRef.current < 5 * 60 * 1000
          ) {
            console.log("Auto-analysis cooled down, skipping...");
            return;
          }

          setIsAutoAnalyzing(true);
          setAutoLichAnalysis("");
          try {
            const mainName = HEXAGRAM_NAMES[`${mainUpper},${mainLower}`];
            const changedName =
              HEXAGRAM_NAMES[`${changedUpper},${changedLower}`];

            const prompt = `Bạn là chuyên gia Kinh Dịch Thiệu Vĩ Hoa. 
Hiện tại: Năm ${baguaLunarInfo.lunarYearName}, Tháng ${baguaLunarInfo.lunarMonthName}, Ngày ${baguaLunarInfo.lunarDayName}, Giờ ${baguaLunarInfo.lunarHourName}.
Quẻ Chính: ${mainName}.
Quẻ Biến: ${changedName}.

Yêu cầu: Hãy viết một đoạn CHỈ 2 CÂU cực kỳ súc tích: Câu 1 nêu ý nghĩa chuyển biến từ quẻ ${mainName} sang ${changedName}, Câu 2 đưa ra kết luận Cát hay Hung hoặc lời khuyên ứng dụng VÀO NGAY GIỜ HIỆN TẠI (${baguaLunarInfo.lunarHourName}). Không dùng list, không giải thích dài dòng.`;

            const aiInstance = getAI();
            const stream = await aiInstance.models.generateContentStream({
              model: GEMINI_MODEL,
              contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            let fullText = "";
            for await (const chunk of stream) {
              const c = chunk as GenerateContentResponse;
              fullText += c.text || "";
              setAutoLichAnalysis(fullText);
            }
            lastAutoAnalyzedTimeRef.current = Date.now();
          } catch (error: any) {
            console.error("Auto Lich AI Analysis Error:", error);
            const errStr = handleAIError(error);
            if (
              errStr.includes("API Key") ||
              errStr.includes("Quota") ||
              error?.message === "API_KEY_MISSING"
            )
              setShowSettings(true);
            setAutoLichAnalysis(errStr);
          } finally {
            setIsAutoAnalyzing(false);
          }
        }
      };

      // We keep the logic but we'll trigger it carefully
      // Only auto-analyze if no analysis exists yet
      if (!autoLichAnalysis && !isAutoAnalyzing) {
        const timer = setTimeout(() => {
          autoAnalyze();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    baguaLunarInfo,
    customRemainder,
    customQuotient,
    changedUpper,
    changedLower,
    activeTab,
    // Removing lastAutoAnalyzedSignature from deps to prevent minute-by-minute triggers
  ]);

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#F5F5ED] text-slate-900 font-sans flex flex-col selection:bg-amber-200 selection:text-black">
      <header className="px-4 sm:px-10 py-2 sm:py-3 border-b border-[#E8E7DF] bg-[#F5F5ED]/90 backdrop-blur-xl flex justify-between items-center relative overflow-hidden h-[56px] sm:h-[72px] shrink-0 z-[100]">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-slate-400/10 to-transparent"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-slate-400/10 to-transparent"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-200/20 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex items-center gap-1 sm:gap-4 relative z-10 shrink-0">
          <h1 className="font-serif font-black tracking-tighter text-slate-900 uppercase flex items-center gap-1.5 sm:gap-2 leading-none shrink-0">
            <span className="bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent whitespace-nowrap text-[clamp(14px,3.5vw,24px)]">
              {t("header.title")}
            </span>
            <span className="px-1.5 py-0.5 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white text-[10px] sm:text-sm font-black transform -rotate-1 border border-white/30 shadow-sm flex-shrink-0">
              PRO
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 relative z-10">
          {lunarInfo?.jieQi && (
            <div
              onClick={() => setShowJieQiModal(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/60 backdrop-blur-md border border-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer group/jieqi"
            >
              <div className="flex flex-col">
                <span className="text-[7px] uppercase font-black text-slate-400 tracking-widest leading-none mb-0.5">
                  Tiết Khí
                </span>
                <span className="text-xs font-serif font-black text-amber-700">
                  {JIE_QI_VIET[lunarInfo.jieQi] || lunarInfo.jieQi}
                </span>
              </div>
              <Calendar className="w-4 h-4 text-slate-400 group-hover/jieqi:text-amber-600 transition-colors" />
            </div>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl transition-all shadow-lg border border-slate-700 group"
          >
            <div className="relative">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-700" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border border-slate-900"></div>
            </div>
            <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest">
              API Setup
            </span>
            <span className="sm:hidden text-[10px] font-black">API</span>
          </button>

          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all shadow-lg border border-amber-500 group animate-bounce-subtle"
              title="Cài đặt ứng dụng"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">
                Cài Đặt App
              </span>
            </button>
          )}
        </div>
      </header>

      <nav className="z-[90] border-b border-[#E8E7DF] bg-[#F4F4EC]/95 backdrop-blur-xl overflow-x-auto scrollbar-hide scroll-smooth shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto flex px-2 md:px-4 snap-x">
          {[
            { id: "lichBatQuai", label: t("tab.lich_bat_quai") },
            { id: "xemNgay", label: t("tab.xem_ngay") },
            { id: "gieoQue", label: t("tab.gieo_que") },
            { id: "honNhan", label: t("tab.hon_nhan") },
            { id: "tuTru", label: t("tab.tu_tru") },
            { id: "tuVi", label: t("tab.tu_vi") },
            { id: "thaiTo", label: t("tab.thai_to") },
            { id: "thaiAt", label: t("tab.thai_at") },
            { id: "kyMon", label: t("tab.ky_mon") },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex-shrink-0 snap-start px-4 sm:px-6 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab.id ? "text-amber-600" : "text-slate-400 hover:text-slate-600"}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
      </nav>

      <div className="hidden"></div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden p-6 relative">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-600" /> Cài Đặt Ứng Dụng
            </h3>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  AI API Key của bạn
                </label>
                <input
                  type="password"
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  placeholder="Nhập API Key..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 bg-white"
                />
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Khóa này chỉ lưu trên trình duyệt của bạn. Để lấy API Key miễn
                  phí, truy cập{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-600 font-bold hover:underline"
                  >
                    Google AI Studio
                  </a>
                  .
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Mã Truy Cập Hệ Thống (Nếu Có)
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Nhập mã truy cập..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Chọn AI Engine (Model)
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 bg-white"
                >
                  {RECOMMENDED_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {user?.email === "hodacanhduy1203@gmail.com" && (
              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowAdmin(true);
                }}
                className="w-full mb-4 px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" /> QUẢN LÝ MÃ TRUY CẬP
              </button>
            )}

            <div className="flex gap-3 justify-end items-center">
              {user ? (
                <div
                  className="flex items-center gap-2 mr-auto"
                  title={user.email}
                >
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full border border-slate-200"
                    />
                  )}
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">
                    {user.displayName || user.email}
                  </span>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const provider = new GoogleAuthProvider();
                      await signInWithPopup(auth, provider);
                    } catch (err: any) {
                      if (err.code === "auth/popup-blocked") {
                        alert(
                          "Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép popup để tiếp tục.",
                        );
                      } else {
                        console.error("Auth error:", err);
                      }
                    }
                  }}
                  className="mr-auto text-[10px] font-bold text-amber-600 hover:underline"
                >
                  Đăng nhập
                </button>
              )}
              <button
                onClick={saveSettings}
                className="px-6 py-2.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all font-serif"
              >
                LƯU CẤU HÌNH
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}

      <main
        className={`${activeTab === "xemNgay" ? "flex" : "hidden"} flex-1 px-1 py-2 max-w-full mx-auto w-full bg-[#FDFBF7] text-slate-900 overflow-auto`}
      >
        {activeTab === "xemNgay" && (
          <XemNgayTab
            onSwitchToKyMon={() => setActiveTab("kyMon")}
            onRequireApiKey={() => setShowSettings(true)}
          />
        )}
      </main>

      <main
        className={`${activeTab === "tuVi" ? "flex" : "hidden"} flex-1 p-1 md:p-2 flex-col items-center justify-start max-w-full mx-auto w-full bg-[#FDFBF7] text-slate-900 overflow-auto`}
      >
        {activeTab === "tuVi" && (
          <TuViTab onRequireApiKey={() => setShowSettings(true)} />
        )}
      </main>

      <main
        className={`${activeTab === "kyMon" ? "flex" : "hidden"} flex-1 p-1 md:p-2 flex-col items-center justify-start max-w-full mx-auto w-full bg-[#FDFBF7] text-slate-900 overflow-auto`}
      >
        {activeTab === "kyMon" && (
          <KyMonTab onRequireApiKey={() => setShowSettings(true)} />
        )}
      </main>

      <main
        className={`${activeTab === "thaiAt" ? "flex" : "hidden"} flex-1 p-1 md:p-2 flex-col items-center justify-start max-w-full mx-auto w-full bg-[#FDFBF7] text-slate-900 overflow-auto`}
      >
        {activeTab === "thaiAt" && (
          <ThaiAtApp
            date={baguaDate}
            lunarInfo={baguaLunarInfo}
            onRequireApiKey={() => setShowSettings(true)}
          />
        )}
      </main>

      <main
        className={`${activeTab === "thaiTo" ? "flex" : "hidden"} flex-1 p-1 md:p-2 flex-col items-center justify-start max-w-full mx-auto w-full bg-[#FDFBF7] text-slate-900 overflow-auto`}
      >
        {activeTab === "thaiTo" && (
          <ThaiToTab
            date={baguaDate}
            lunarInfo={baguaLunarInfo}
            manualYear={undefined}
            onChange={handleBaguaInputChange}
            onAutoUpdateChange={setIsBaguaAutoUpdate}
            isAutoUpdate={isBaguaAutoUpdate}
            renderColoredCanChi={renderColoredCanChi}
            onRequireApiKey={() => setShowSettings(true)}
          />
        )}
      </main>

      <main
        className={`${activeTab === "tuTru" ? "flex" : "hidden"} flex-1 p-2 md:p-4 max-w-7xl mx-auto w-full bg-[#FDFBF7] text-slate-900 overflow-auto flex-col pb-[50vh] md:pb-8`}
      >
        {activeTab === "tuTru" &&
          (() => {
            if (!lunarInfo) {
              return (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="text-gray-400 text-sm">
                    Vui lòng nhập ngày tháng năm sinh hợp lệ
                  </div>
                </div>
              );
            }

            const year = Number(date.year);
            const month = Number(date.month);
            const day = Number(date.day);
            const hour = Number(date.hour);

            const lunar = lunarInfo.lunar;
            if (!lunar) return null;

            const yearZhi = pillars[0].zhi;
            const monthZhi = pillars[1].zhi;
            const dayZhi = pillars[2].zhi;
            const hourZhi = pillars[3].zhi;

            // Luck Cycles (Đại Vận) - Precise calculation
            const eightChar = lunar.getEightChar(2);
            const isForward =
              (gender === "male" &&
                GAN_INFO[pillars[0].gan]?.polarity === "Yang") ||
              (gender === "female" &&
                GAN_INFO[pillars[0].gan]?.polarity === "Yin");

            const solarBirth = lunar.getSolar();
            const jieQi = isForward ? lunar.getNextJie() : lunar.getPrevJie();
            const jqSolar = jieQi.getSolar();

            // Total difference in minutes using Solar getters to avoid getCalendar error
            const jqDate = new Date(
              jqSolar.getYear(),
              jqSolar.getMonth() - 1,
              jqSolar.getDay(),
              jqSolar.getHour(),
              jqSolar.getMinute(),
              jqSolar.getSecond(),
            );
            const birthDate = new Date(
              solarBirth.getYear(),
              solarBirth.getMonth() - 1,
              solarBirth.getDay(),
              solarBirth.getHour(),
              solarBirth.getMinute(),
              solarBirth.getSecond(),
            );
            const diffMs = Math.abs(jqDate.getTime() - birthDate.getTime());
            const totalMinutes = Math.floor(diffMs / (1000 * 60));

            const diffDaysVal = Math.floor(totalMinutes / (24 * 60));
            const remainMinAfterDays = totalMinutes % (24 * 60);
            const diffHoursVal = Math.floor(remainMinAfterDays / 60);
            const diffMinsVal = remainMinAfterDays % 60;

            // User's formula: 3 days = 1 year, 1 day = 4 months, 1 hour = 5 days, 12 minutes = 1 day
            // Consistent rule: 12 minutes distance = 1 life day
            const totalLifeDays = Math.floor(totalMinutes / 12);

            const rawYearOffset = Math.floor(totalLifeDays / 360);
            const leftoverLifeDays = totalLifeDays % 360;
            const rawMonthOffset = Math.floor(leftoverLifeDays / 30);
            const sDayOffset = leftoverLifeDays % 30;

            // Normalize years/months
            const sYearOffset = rawYearOffset + Math.floor(rawMonthOffset / 12);
            const sMonthOffset = rawMonthOffset % 12;

            // Calculate precisely when the first Major Cycle starts
            const startSolarDate = new Date(birthDate.getTime());
            startSolarDate.setFullYear(
              startSolarDate.getFullYear() + sYearOffset,
            );
            startSolarDate.setMonth(startSolarDate.getMonth() + sMonthOffset);
            startSolarDate.setDate(startSolarDate.getDate() + sDayOffset);
            const startYear = startSolarDate.getFullYear();
            const startMonth = startSolarDate.getMonth() + 1;

            const yun = eightChar.getYun(gender === "male" ? 1 : 0);
            const rawDaYunList = yun.getDaYun();
            // Filter out the pre-yun (usually empty Ganzhi or starts before first real cycle)
            const daYunList = rawDaYunList.filter(
              (dy: any) => dy.getGanZhi().length > 0,
            );

            // Prepare shifted Minor Cycles (Mapping from birth year onwards)
            const shiftedXiaoYunMap: Record<
              number,
              { g: string; z: string; ttGan: string; ttZhi: string }
            > = {};
            const standardXiaoYuns: any[] = [];

            // Collect ALL Xiao Yuns including pre-yun cycles
            rawDaYunList.forEach((dy: any) => {
              if (typeof dy.getXiaoYun === "function") {
                standardXiaoYuns.push(...dy.getXiaoYun());
              }
            });

            // Map each standard Xiao Yun sequence starting from the BIRTH year
            const birthYear = solarBirth.getYear();
            standardXiaoYuns.forEach((xy, idx) => {
              const targetYear = birthYear + idx;
              const gz = translateGanZhi(xy.getGanZhi());
              const [g, z] = gz.split(" ");
              shiftedXiaoYunMap[targetYear] = {
                g,
                z,
                ttGan: getThapThan(dayGan, g),
                ttZhi: getThapThan(dayGan, TANG_DON[z]?.[0] || ""),
              };
            });

            const thaiNguyen = getThaiNguyen(pillars[1].gan, pillars[1].zhi);
            const nienKhong = getKhongVong(pillars[0].gan, pillars[0].zhi);
            const nhatKhong = getKhongVong(pillars[2].gan, pillars[2].zhi);
            const commonShenSha = getShenSha(
              dayGan,
              yearZhi,
              monthZhi,
              dayZhi,
              hourZhi,
              pillars[0].gan,
              pillars,
            );

            // New Thăng Long calculations
            const menhCung = getMenhCung(
              ZHIS.indexOf(pillars[1].zhi),
              ZHIS.indexOf(pillars[3].zhi),
              pillars[0].gan,
            );

            const nowYear = new Date().getFullYear();
            return (
              <div className="flex flex-col gap-3">
                {/* Controls Panel */}
                <div className="bg-[#EAEADF] border border-slate-200/60 rounded-2xl p-4 sm:p-5 mb-2 shadow-sm">
                  <div className="flex flex-col lg:flex-row gap-5">
                    {/* Person Info */}
                    <div className="flex-1 lg:max-w-[400px] flex flex-col gap-4">
                      <div className="flex gap-3">
                        <div className="flex flex-col gap-1.5 flex-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            {t("form.name")}
                          </label>
                          <FastInput
                            type="text"
                            name="name"
                            value={date.name}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-[#F2F2EB] border border-slate-200/80 hover:border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 outline-none transition-all"
                            placeholder="Nhập họ tên..."
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 w-28 shrink-0">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 text-center">
                            {t("form.gender")}
                          </label>
                          <div className="flex bg-slate-50 border border-slate-200/80 p-1 rounded-xl h-[38px]">
                            <button
                              onClick={() => setGender("male")}
                              className={`flex-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center ${gender === "male" ? "bg-[#F2F2EB] text-blue-600 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
                            >
                              {t("form.male")}
                            </button>
                            <button
                              onClick={() => setGender("female")}
                              className={`flex-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center ${gender === "female" ? "bg-[#F2F2EB] text-pink-600 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600"}`}
                            >
                              {t("form.female")}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 h-full">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            {t("form.inputMode")}
                          </label>
                          <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200/40">
                            <button
                              onClick={() => setIsLunarInput(false)}
                              className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all uppercase ${!isLunarInput ? "bg-[#F2F2EB] text-amber-600 shadow-sm" : "text-slate-400"}`}
                            >
                              {t("form.solar")}
                            </button>
                            <button
                              onClick={() => setIsLunarInput(true)}
                              className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all uppercase ${isLunarInput ? "bg-[#F2F2EB] text-amber-600 shadow-sm" : "text-slate-400"}`}
                            >
                              {t("form.lunar")}
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-auto pt-2 border-t border-slate-200/40">
                          <button
                            onClick={saveCurrentProfile}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-200/50 uppercase tracking-wider"
                          >
                            <Save className="w-3 h-3" />
                            {t("label.saveProfile")}
                          </button>
                          <button
                            onClick={() => setShowProfileList(true)}
                            className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider"
                          >
                            <Users className="w-3 h-3" />
                            {t("label.list")}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Profile Selection Modal */}
                    <AnimatePresence>
                      {showProfileList && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#FDFBF7] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] border border-white/20"
                          >
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white/50">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-xl">
                                  <Users className="w-5 h-5 text-amber-600" />
                                </div>
                                <h3 className="font-serif text-xl font-black text-slate-800">
                                  {t("label.savedProfiles")}
                                </h3>
                              </div>
                              <button
                                onClick={() => setShowProfileList(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                              {savedProfiles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                                  <FolderOpen className="w-12 h-12 opacity-20" />
                                  <p className="text-sm">
                                    {t("label.noProfiles")}
                                  </p>
                                </div>
                              ) : (
                                savedProfiles.map((p) => (
                                  <div
                                    key={p.id}
                                    className="bg-white border border-slate-100 rounded-2xl p-4 flex justify-between items-center hover:border-amber-300 hover:shadow-md transition-all group cursor-pointer"
                                    onClick={() => loadProfile(p)}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-800">
                                        {p.name}
                                      </span>
                                      <span className="text-[11px] text-slate-400 font-medium">
                                        {p.day}/{p.month}/{p.year} {p.hour}h -{" "}
                                        {p.gender === "male"
                                          ? t("form.male")
                                          : t("form.female")}{" "}
                                        (
                                        {p.isLunar
                                          ? t("form.lunar")
                                          : t("form.solar")}
                                        )
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteProfile(p.id);
                                        }}
                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        title={t("form.delete")}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                      <div className="p-2 text-amber-500 bg-amber-50 rounded-lg">
                                        <Plus className="w-4 h-4 rotate-45" />
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
                                {t("label.browserStorage")}
                              </p>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                    {/* Divider for tight layouts */}
                    <div className="hidden lg:block w-px bg-slate-100"></div>

                    {/* Time Info */}
                    <div className="flex-1 grid grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 text-center">
                          {t("form.day")}
                        </label>
                        <FastInput
                          type="number"
                          name="day"
                          min="1"
                          max="31"
                          value={date.day}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-[#F2F2EB] border border-slate-200/80 hover:border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-500 rounded-xl px-2 py-2 text-sm font-mono font-bold text-slate-800 outline-none text-center transition-all bg-[#F2F2EB]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 text-center">
                          {t("form.month")}
                        </label>
                        <FastInput
                          type="number"
                          name="month"
                          min="1"
                          max="12"
                          value={date.month}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-[#F2F2EB] border border-slate-200/80 hover:border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-500 rounded-xl px-2 py-2 text-sm font-mono font-bold text-slate-800 outline-none text-center transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 text-center">
                          {t("form.year")}
                        </label>
                        <FastInput
                          type="number"
                          name="year"
                          value={date.year}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-[#F2F2EB] border border-slate-200/80 hover:border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-500 rounded-xl px-2 py-2 text-sm font-mono font-bold text-slate-800 outline-none text-center transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest pl-1 text-center">
                          {t("form.hour")}
                        </label>
                        <FastInput
                          type="number"
                          name="hour"
                          min="0"
                          max="23"
                          value={date.hour}
                          onChange={handleInputChange}
                          className="w-full bg-amber-50/30 hover:bg-amber-50 focus:bg-[#F2F2EB] border border-amber-200/60 hover:border-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-500 rounded-xl px-2 py-2 text-sm font-mono font-bold text-amber-800 outline-none text-center transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  {/* Header Row from Thăng Long */}
                  <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap gap-x-6 gap-y-2 text-[10px] sm:text-xs">
                    <div className="flex gap-2">
                      <span className="font-bold text-slate-400 capitalize">
                        Dương / Âm lịch (GMT+7):
                      </span>
                      <span className="font-bold text-slate-800">
                        {day}/{month}/{year} - {lunar.getDay()}/
                        {Math.abs(lunar.getMonth())}/{lunar.getYear()} -{" "}
                        {JIE_QI_MAP[lunar.getJieQi()] || ""}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-slate-400 capitalize">
                        Thai Nguyên:
                      </span>
                      <span className="font-bold text-slate-800">
                        {thaiNguyen}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-slate-400 capitalize">
                        Cung mệnh:
                      </span>
                      <span className="font-bold text-slate-800">
                        {menhCung}
                      </span>
                    </div>
                  </div>

                  {/* Bazi Table Structure */}
                  <div className="w-full overflow-hidden">
                    <table className="w-full table-fixed border-collapse text-center text-[9px] sm:text-[10px] md:text-[11px]">
                      <thead>
                        <tr className="bg-slate-100/50 border-b border-slate-200">
                          <th className="p-1 sm:p-2 border-r border-slate-200 w-16 sm:w-24 text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                            Trụ
                          </th>
                          <th className="p-1 sm:p-2 border-r border-slate-200 font-black text-slate-600 leading-tight">
                            Năm sinh
                            <br />
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">
                              (Niên trụ)
                            </span>
                          </th>
                          <th className="p-1 sm:p-2 border-r border-slate-200 font-black text-slate-600 leading-tight">
                            Tháng sinh
                            <br />
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">
                              (Nguyệt trụ)
                            </span>
                          </th>
                          <th className="p-1 sm:p-2 border-r border-slate-200 font-black text-blue-700 bg-blue-50/30 leading-tight">
                            Ngày sinh
                            <br />
                            <span className="text-[8px] sm:text-[9px] font-bold text-blue-400">
                              (Nhật trụ)
                            </span>
                          </th>
                          <th className="p-1 sm:p-2 font-black text-slate-600 leading-tight">
                            Giờ sinh
                            <br />
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">
                              (Thời trụ)
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* DƯƠNG LỊCH */}
                        <tr>
                          <td className="p-1 sm:p-2 bg-slate-50 border-r border-slate-200 font-bold text-slate-400 uppercase text-[7px] sm:text-[8px] tracking-widest">
                            DƯƠNG LỊCH
                          </td>
                          <td className="p-1 sm:p-2 border-r border-slate-100 font-mono text-slate-500 font-bold text-[9px] sm:text-[11px]">
                            {year}
                          </td>
                          <td className="p-1 sm:p-2 border-r border-slate-100 font-mono text-slate-500 font-bold text-[9px] sm:text-[11px]">
                            {month}
                          </td>
                          <td className="p-1 sm:p-2 border-r border-slate-100 font-mono font-bold bg-blue-50/10 text-blue-900 text-[9px] sm:text-[11px]">
                            {day}
                          </td>
                          <td className="p-1 sm:p-2 font-mono text-slate-500 font-bold text-[9px] sm:text-[11px]">
                            {hour}:00
                          </td>
                        </tr>
                        {/* CHỦ TÌNH */}
                        <tr>
                          <td className="p-1 sm:p-2 bg-slate-50 border-r border-slate-200 font-bold text-slate-400 uppercase text-[7px] sm:text-[8px] tracking-widest">
                            CHỦ TÌNH
                          </td>
                          {pillars.map((p, i) => (
                            <td
                              key={i}
                              className={`p-1 sm:p-2 border-r border-slate-100 font-bold uppercase ${i === 2 ? "bg-blue-50/10" : ""}`}
                            >
                              {i === 2 ? (
                                <span className="text-amber-600">NHẬT CHỦ</span>
                              ) : (
                                <span className="text-slate-500">
                                  {getThapThan(dayGan, p.gan)}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                        {/* BÁT TỰ */}
                        <tr className="h-20 sm:h-28">
                          <td className="p-1 sm:p-2 bg-slate-50 border-r border-slate-200 font-bold text-slate-400 uppercase text-[7px] sm:text-[8px] tracking-widest">
                            BÁT TỰ
                          </td>
                          {pillars.map((p, i) => (
                            <td
                              key={i}
                              className={`p-1 sm:p-2 border-r border-slate-100 ${i === 2 ? "bg-blue-50/20" : ""}`}
                            >
                              <div className="flex flex-col items-center justify-center gap-1 sm:gap-2">
                                <div
                                  className="text-2xl sm:text-3xl font-black drop-shadow-sm"
                                  style={{
                                    color:
                                      ELEMENT_COLORS[GAN_INFO[p.gan]?.element],
                                  }}
                                >
                                  {p.gan}
                                </div>
                                <div
                                  className="text-2xl sm:text-3xl font-black drop-shadow-sm"
                                  style={{
                                    color:
                                      ELEMENT_COLORS[ZHI_INFO[p.zhi]?.element],
                                  }}
                                >
                                  {p.zhi}
                                </div>
                              </div>
                            </td>
                          ))}
                        </tr>
                        {/* CAN TÀNG */}
                        <tr>
                          <td className="p-1 sm:p-2 bg-slate-50 border-r border-slate-200 font-bold text-slate-400 uppercase text-[7px] sm:text-[8px] tracking-widest leading-tight">
                            CAN TÀNG
                          </td>
                          {pillars.map((p, i) => (
                            <td
                              key={i}
                              className={`p-1 sm:p-2 border-r border-slate-100 align-top ${i === 2 ? "bg-blue-50/10" : ""}`}
                            >
                              <div className="flex flex-col items-center py-0.5">
                                {(TANG_DON[p.zhi] || []).map((tg, idx) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col items-center py-1 sm:py-1.5 w-full border-b border-slate-100 last:border-0"
                                  >
                                    <span
                                      className="font-black text-[12px] sm:text-[14px] leading-none mb-0.5"
                                      style={{
                                        color:
                                          ELEMENT_COLORS[GAN_INFO[tg]?.element],
                                      }}
                                    >
                                      {tg}
                                    </span>
                                    <div className="flex flex-col items-center -gap-0.5">
                                      <span className="text-[8px] sm:text-[9px] text-slate-700 font-black uppercase tracking-tighter leading-tight">
                                        {getThapThan(dayGan, tg)}
                                      </span>
                                      <span className="text-[6.5px] sm:text-[7.5px] text-slate-400 font-bold uppercase tracking-[0.1em] opacity-80 leading-tight">
                                        {getTruongSinh(tg, p.zhi)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          ))}
                        </tr>
                        {/* NHẬT KIẾN */}
                        <tr>
                          <td className="p-1 sm:p-2 bg-slate-50 border-r border-slate-200 font-bold text-slate-400 uppercase text-[7px] sm:text-[8px] tracking-widest leading-tight">
                            NHẬT KIẾN
                          </td>
                          {pillars.map((p, i) => (
                            <td
                              key={i}
                              className={`p-1 sm:p-2 border-r border-slate-100 font-black uppercase text-slate-500 ${i === 2 ? "bg-blue-50/10" : ""}`}
                            >
                              {getTruongSinh(dayGan, p.zhi)}
                            </td>
                          ))}
                        </tr>
                        {/* NGUYỆT KIẾN */}
                        <tr>
                          <td className="p-1 sm:p-2 bg-slate-50 border-r border-slate-200 font-bold text-slate-400 uppercase text-[7px] sm:text-[8px] tracking-widest leading-tight">
                            NGUYỆT KIẾN
                          </td>
                          {pillars.map((p, i) => (
                            <td
                              key={i}
                              className={`p-1 sm:p-2 border-r border-slate-100 font-black uppercase text-slate-500 ${i === 2 ? "bg-blue-50/10" : ""}`}
                            >
                              {getTruongSinh(p.gan, pillars[1].zhi)}
                            </td>
                          ))}
                        </tr>
                        {/* TRỤ */}
                        <tr>
                          <td className="p-1 sm:p-2 bg-slate-50 border-r border-slate-200 font-bold text-slate-400 uppercase text-[7px] sm:text-[8px] tracking-widest leading-tight">
                            TRỤ
                          </td>
                          {pillars.map((p, i) => (
                            <td
                              key={i}
                              className={`p-1 sm:p-2 border-r border-slate-100 font-black uppercase text-slate-500 ${i === 2 ? "bg-blue-50/10" : ""}`}
                            >
                              {getTruongSinh(p.gan, p.zhi)}
                            </td>
                          ))}
                        </tr>
                        {/* THẦN SÁT */}
                        <tr>
                          <td className="p-1 sm:p-2 bg-slate-50 border-r border-slate-200 font-bold text-slate-400 uppercase text-[7px] sm:text-[8px] tracking-widest leading-tight">
                            THẦN SÁT
                          </td>
                          {pillars.map((p, i) => {
                            const key =
                              i === 0
                                ? "year"
                                : i === 1
                                  ? "month"
                                  : i === 2
                                    ? "day"
                                    : "hour";
                            return (
                              <td
                                key={i}
                                className={`p-1 sm:p-2 border-r border-slate-100 align-top ${i === 2 ? "bg-blue-50/10" : ""}`}
                              >
                                <div className="flex flex-wrap justify-center gap-x-1 gap-y-0.5 py-1">
                                  {(commonShenSha[key] || []).map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[7px] sm:text-[9px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-0.5 sm:px-1 rounded-sm whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        {/* NẠP ÂM */}
                        <tr>
                          <td className="p-1 sm:p-2 bg-slate-50 border-r border-slate-200 font-bold text-slate-400 uppercase text-[7px] sm:text-[8px] tracking-widest leading-tight">
                            NẠP ÂM
                          </td>
                          {pillars.map((p, i) => (
                            <td
                              key={i}
                              className={`p-1 sm:p-2 border-r border-slate-100 font-bold text-[8px] sm:text-[10px] text-slate-500 ${i === 2 ? "bg-blue-50/10" : ""}`}
                            >
                              {p.nayin}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-2 sm:p-3 bg-slate-800 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <span>
                        Khởi đại vận:{" "}
                        <span className="text-amber-400">
                          {sYearOffset} tuổi {sMonthOffset} tháng {sDayOffset}{" "}
                          ngày
                        </span>
                      </span>
                      <span className="text-amber-400 border-l border-slate-700 pl-0 sm:pl-4">
                        Từ:{" "}
                        <span className="text-white">
                          Tháng {startMonth}/{startYear} (Dương lịch)
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-slate-500 uppercase font-black">
                        Bát tự đồ
                      </span>
                      <div className="h-px bg-slate-600 w-8"></div>
                    </div>
                  </div>
                </div>
                <div className="flex border-b border-slate-300 overflow-hidden bg-white">
                  <div className="flex flex-col items-center justify-center bg-[#2C3E50] text-white min-w-[44px] max-w-[44px] sm:min-w-[50px] sm:max-w-[50px] md:min-w-[56px] md:max-w-[56px] lg:min-w-[65px] lg:max-w-[65px] shrink-0 px-1 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.1)] py-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                      ĐẠI
                      <br />
                      VẬN
                    </span>
                    <div className="w-5 h-[2px] bg-blue-500 my-2 rounded-full"></div>
                    <span className="text-[8px] font-medium opacity-60 text-center uppercase tracking-tighter">
                      10 Năm
                    </span>
                  </div>

                  <div
                    className="flex overflow-x-auto scroll-smooth select-none hide-scrollbar flex-1"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <div className="flex items-stretch w-full">
                      {daYunList.slice(0, 10).map((dy: any, i: number) => {
                        const gz = translateGanZhi(dy.getGanZhi());
                        const [g, z] = gz.split(" ");
                        const ttGan = getThapThan(dayGan, g);
                        const ttZhi = getThapThan(
                          dayGan,
                          TANG_DON[z]?.[0] || "",
                        );
                        const startYearLabel = startYear + i * 10;
                        const startAgeLabel = sYearOffset + i * 10;
                        const isCurrentLuck =
                          nowYear >= startYearLabel &&
                          nowYear < startYearLabel + 10;
                        const elementGan = GAN_INFO[g]?.element || "Wood";
                        const elementZhi = ZHI_INFO[z]?.element || "Wood";
                        const bgClass = getInteractionBgClass(g, z, pillars);
                        const txtClass = getInteractionTextClass(g, z, pillars);

                        return (
                          <div
                            key={i}
                            className={`flex flex-col items-center justify-between border-r border-slate-200 min-w-[42px] sm:min-w-[51px] md:min-w-[61px] lg:min-w-[70px] flex-1 shrink-0 py-1.5 sm:py-3 transition-all ${
                              bgClass ||
                              (isCurrentLuck ? "bg-blue-50" : "bg-white")
                            } ${isCurrentLuck ? "ring-2 ring-inset ring-blue-400/30" : ""}`}
                          >
                            <div className="flex flex-col items-center w-full">
                              <span
                                className={`${txtClass} text-[7px] sm:text-[9px] font-black tracking-widest uppercase mb-0.5`}
                              >
                                {t(ttGan)}
                              </span>
                              <div
                                className="text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-black tracking-tighter sm:tracking-normal leading-tight whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5"
                                style={{ color: ELEMENT_COLORS[elementGan] }}
                              >
                                {t(g)}
                              </div>
                              <div
                                className="text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-black tracking-tighter sm:tracking-normal leading-tight whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5"
                                style={{ color: ELEMENT_COLORS[elementZhi] }}
                              >
                                {t(z)}
                              </div>
                              <span
                                className={`${txtClass} text-[7px] sm:text-[9px] font-black tracking-widest uppercase mt-0.5`}
                              >
                                {t(ttZhi)}
                              </span>
                            </div>

                            <div className="mt-2 text-center leading-none">
                              <div className="text-[10px] sm:text-xs font-black text-slate-800">
                                {startAgeLabel}
                              </div>
                              <div className="text-[8px] sm:text-[9px] font-mono font-bold text-slate-400 mt-0.5 whitespace-nowrap">
                                T{startMonth}-{startYearLabel}
                              </div>
                            </div>

                            {isCurrentLuck && (
                              <div className="mt-1 bg-blue-600 text-[6px] px-1.5 py-0.5 rounded-full text-white font-bold uppercase tracking-tighter">
                                Hiện tại
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Minor Cycles (Tiểu Vận) */}
                <div className="flex border-b border-slate-300 overflow-hidden bg-white">
                  <div className="flex flex-col items-center justify-center bg-[#34495E] text-white min-w-[44px] max-w-[44px] sm:min-w-[50px] sm:max-w-[50px] md:min-w-[56px] md:max-w-[56px] lg:min-w-[65px] lg:max-w-[65px] shrink-0 px-1 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.1)] py-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                      TIỂU
                      <br />
                      VẬN
                    </span>
                    <div className="w-5 h-[2px] bg-amber-500 my-2 rounded-full"></div>
                    <span className="text-[8px] font-medium opacity-60 text-center uppercase tracking-tighter">
                      1 Năm
                    </span>
                  </div>

                  <div
                    ref={tieuVanRef}
                    className="flex overflow-x-auto scroll-smooth select-none hide-scrollbar flex-1"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <div className="flex items-stretch w-full">
                      {liuNianYears.map((item) => {
                        const currentYear = item.year;
                        const xy = shiftedXiaoYunMap[currentYear];
                        if (!xy)
                          return (
                            <div
                              key={currentYear}
                              className="w-[50px] sm:w-[65px] overflow-hidden border-r border-slate-200 flex items-center justify-center bg-slate-50 opacity-40"
                            >
                              <span className="text-[8px] font-mono font-bold text-slate-300">
                                {currentYear}
                              </span>
                            </div>
                          );

                        const { g, z, ttGan, ttZhi } = xy;
                        const isSelected = selectedLiuNian === currentYear;
                        const isNow = new Date().getFullYear() === currentYear;
                        const bgClass = getInteractionBgClass(g, z, pillars);
                        const txtClass = getInteractionTextClass(g, z, pillars);

                        return (
                          <div
                            key={currentYear}
                            data-year={currentYear}
                            onClick={() => {
                              setSelectedLiuNian(currentYear);
                              setSelectedMonthIdx(0);
                              setSelectedDayIdx(0);
                            }}
                            className={`flex flex-col items-center justify-between border-r border-slate-200 w-[8.333333%] shrink-0 py-1.5 sm:py-3 cursor-pointer transition-all ${
                              bgClass ||
                              (isSelected ? "bg-amber-50" : "bg-white")
                            } ${isSelected ? "ring-2 ring-inset ring-amber-400/40" : ""} hover:opacity-80`}
                          >
                            <div className="flex flex-col items-center w-full">
                              <span
                                className={`${txtClass} text-[6px] sm:text-[7px] font-black uppercase tracking-tighter mb-0.5`}
                              >
                                {t(ttGan)}
                              </span>
                              <div
                                className="text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-black tracking-tighter sm:tracking-normal leading-tight whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5"
                                style={{
                                  color: ELEMENT_COLORS[GAN_INFO[g]?.element],
                                }}
                              >
                                {t(g)}
                              </div>
                              <div
                                className="text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-black tracking-tighter sm:tracking-normal leading-tight whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5"
                                style={{
                                  color: ELEMENT_COLORS[ZHI_INFO[z]?.element],
                                }}
                              >
                                {t(z)}
                              </div>
                              <span
                                className={`${txtClass} text-[6px] sm:text-[7px] font-black uppercase tracking-tighter mt-0.5`}
                              >
                                {t(ttZhi)}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-col items-center leading-none">
                              <span
                                className={`text-[9px] sm:text-[10px] font-mono font-black ${isSelected ? "text-amber-800" : "text-slate-400"}`}
                              >
                                {currentYear}
                              </span>
                              {isNow && (
                                <div className="mt-1 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.3)]"></div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Annual Cycles (Lưu Năm) */}
                <div className="flex border-b border-slate-300 overflow-hidden bg-white">
                  <div className="flex flex-col items-center justify-center bg-[#2980B9] text-white min-w-[44px] max-w-[44px] sm:min-w-[50px] sm:max-w-[50px] md:min-w-[56px] md:max-w-[56px] lg:min-w-[65px] lg:max-w-[65px] shrink-0 px-1 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.1)] py-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                      LƯU
                      <br />
                      NĂM
                    </span>
                    <div className="w-5 h-[2px] bg-white my-2 rounded-full opacity-50"></div>
                  </div>

                  <div
                    ref={liuNianRef}
                    className="flex overflow-x-auto scroll-smooth select-none hide-scrollbar flex-1"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <div className="flex items-stretch w-full">
                      {liuNianYears.map((item, idx) => {
                        const currentYear = item.year;
                        const g = item.g;
                        const z = item.z;
                        const ttGan = item.ttGan;
                        const ttZhi = item.ttZhi;
                        const bgClass = getInteractionBgClass(g, z, pillars);
                        const txtClass = getInteractionTextClass(g, z, pillars);
                        const isSelected = selectedLiuNian === currentYear;
                        const isNow = new Date().getFullYear() === currentYear;

                        return (
                          <div
                            key={currentYear}
                            data-year={currentYear}
                            onClick={() => {
                              setSelectedLiuNian(currentYear);
                              setSelectedMonthIdx(0);
                              setSelectedDayIdx(0);
                            }}
                            className={`flex flex-col items-center justify-between border-r border-slate-200 w-[8.333333%] shrink-0 py-1.5 sm:py-3 cursor-pointer transition-all ${
                              bgClass ||
                              (isSelected ? "bg-blue-50" : "bg-white")
                            } ${isSelected ? "ring-2 ring-inset ring-blue-500/30" : ""} hover:opacity-80`}
                          >
                            <div className="flex flex-col items-center w-full">
                              <span
                                className={`text-[6px] sm:text-[7px] font-black tracking-tight mb-0.5 whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5 ${txtClass}`}
                              >
                                {t(ttGan)}
                              </span>
                              <div
                                className="text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-black tracking-tighter sm:tracking-normal leading-tight whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5"
                                style={{
                                  color: ELEMENT_COLORS[GAN_INFO[g]?.element],
                                }}
                              >
                                {t(g)}
                              </div>
                              <div
                                className="text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-black tracking-tighter sm:tracking-normal leading-tight whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5 mt-0.5"
                                style={{
                                  color: ELEMENT_COLORS[ZHI_INFO[z]?.element],
                                }}
                              >
                                {t(z)}
                              </div>
                              <span
                                className={`text-[6px] sm:text-[7px] font-black tracking-tight mt-0.5 whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5 ${txtClass}`}
                              >
                                {t(ttZhi)}
                              </span>
                            </div>
                            <div
                              className={`text-[9px] sm:text-[10px] font-mono mt-2 font-black ${isSelected ? "text-blue-800" : "text-slate-400"}`}
                            >
                              {currentYear}
                              {isNow && (
                                <div className="mt-0.5 w-1 h-1 bg-red-400 mx-auto rounded-full"></div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Monthly Cycles (Lưu Tháng) */}
                <div className="flex border-b border-slate-300 overflow-hidden bg-white">
                  <div className="flex flex-col items-center justify-center bg-[#D35400] text-white min-w-[44px] max-w-[44px] sm:min-w-[50px] sm:max-w-[50px] md:min-w-[56px] md:max-w-[56px] lg:min-w-[65px] lg:max-w-[65px] shrink-0 px-1 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.1)] py-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                      LƯU
                      <br />
                      THÁNG
                    </span>
                    <div className="w-5 h-[2px] bg-white my-2 rounded-full opacity-50"></div>
                    <span className="text-[8px] font-bold opacity-70">
                      ({selectedLiuNian})
                    </span>
                  </div>

                  <div
                    ref={liuThangRef}
                    className="flex overflow-x-auto scroll-smooth select-none hide-scrollbar flex-1"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <div className="flex items-center w-full">
                      {baziMonths.map((item, i) => {
                        const monthGan = item.gan;
                        const monthZhi = item.zhi;
                        const ttGan = getThapThan(dayGan, monthGan);
                        const ttZhi = getThapThan(
                          dayGan,
                          TANG_DON[monthZhi]?.[0] || "",
                        );
                        const bgClass = getInteractionBgClass(
                          monthGan,
                          monthZhi,
                          pillars,
                        );
                        const txtClass = getInteractionTextClass(
                          monthGan,
                          monthZhi,
                          pillars,
                        );
                        const isSelectedMonth = selectedMonthIdx === i;

                        return (
                          <div
                            key={i}
                            onClick={() => {
                              setSelectedMonthIdx(i);
                              setSelectedDayIdx(0);
                            }}
                            className={`flex flex-col items-center justify-between border-r border-slate-200 w-[8.333333%] shrink-0 py-1.5 sm:py-3 cursor-pointer transition-all ${
                              bgClass ||
                              (isSelectedMonth ? "bg-amber-50" : "bg-white")
                            } ${isSelectedMonth ? "ring-2 ring-inset ring-amber-500/30" : ""} hover:opacity-80`}
                          >
                            <div className="flex flex-col items-center w-full">
                              <span
                                className={`text-[6px] sm:text-[7px] font-black tracking-tight mb-0.5 whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5 ${txtClass}`}
                              >
                                {t(ttGan)}
                              </span>
                              <div
                                className="text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-black tracking-tighter sm:tracking-normal leading-tight whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5"
                                style={{
                                  color:
                                    ELEMENT_COLORS[GAN_INFO[monthGan]?.element],
                                }}
                              >
                                {t(monthGan)}
                              </div>
                              <div
                                className="text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-black tracking-tighter sm:tracking-normal leading-tight whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5 mt-0.5"
                                style={{
                                  color:
                                    ELEMENT_COLORS[ZHI_INFO[monthZhi]?.element],
                                }}
                              >
                                {t(monthZhi)}
                              </div>
                              <span
                                className={`text-[6px] sm:text-[7px] font-black tracking-tight mt-0.5 whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5 ${txtClass}`}
                              >
                                {t(ttZhi)}
                              </span>
                            </div>
                            <div
                              className={`text-[8px] sm:text-[9px] font-mono font-black mt-2 tabular-nums uppercase ${isSelectedMonth ? "text-amber-800" : "text-slate-400"}`}
                            >
                              T.{i + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Daily Cycles (Lưu Ngày) */}
                <div className="flex border-b border-slate-300 overflow-hidden bg-white">
                  <div className="flex flex-col items-center justify-center bg-[#8E44AD] text-white min-w-[44px] max-w-[44px] sm:min-w-[50px] sm:max-w-[50px] md:min-w-[56px] md:max-w-[56px] lg:min-w-[65px] lg:max-w-[65px] shrink-0 px-1 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.1)] py-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                      LƯU
                      <br />
                      NGÀY
                    </span>
                    <div className="w-5 h-[2px] bg-white my-2 rounded-full opacity-50"></div>
                    <span className="text-[8px] font-bold opacity-70">
                      ({selectedMonthIdx + 1})
                    </span>
                  </div>

                  <div
                    ref={liuNgayRef}
                    className="flex overflow-x-auto scroll-smooth select-none hide-scrollbar flex-1"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <div className="flex items-center w-full">
                      {(() => {
                        const selectedMonthObj = baziMonths[selectedMonthIdx];
                        if (!selectedMonthObj) return null;

                        return selectedMonthObj.days.map((solarDay, idx) => {
                          const lDay = solarDay.getLunar();
                          const ec = lDay.getEightChar(2);
                          const dGanStr = translateGanZhi(ec.getDayGan());
                          const dZhiStr = translateGanZhi(ec.getDayZhi());

                          const tGan = getThapThan(dayGan, dGanStr);
                          const tZhi = getThapThan(
                            dayGan,
                            TANG_DON[dZhiStr]?.[0] || "",
                          );
                          const bgClassForDay = getInteractionBgClass(
                            dGanStr,
                            dZhiStr,
                            pillars,
                          );
                          const txtClassForDay = getInteractionTextClass(
                            dGanStr,
                            dZhiStr,
                            pillars,
                          );
                          const isSelectedDay = selectedDayIdx === idx;

                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedDayIdx(idx)}
                              className={`flex flex-col items-center justify-between border-r border-slate-200 w-[8.333333%] shrink-0 py-1.5 sm:py-3 cursor-pointer transition-all ${
                                bgClassForDay ||
                                (isSelectedDay ? "bg-purple-50" : "bg-white")
                              } ${isSelectedDay ? "ring-2 ring-inset ring-purple-500/30" : ""} hover:opacity-80`}
                            >
                              <div className="flex flex-col items-center w-full">
                                <span
                                  className={`text-[6px] sm:text-[7px] font-black tracking-tight mb-0.5 whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5 ${txtClassForDay}`}
                                >
                                  {t(tGan)}
                                </span>
                                <div
                                  className="text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-black tracking-tighter sm:tracking-normal leading-tight whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5"
                                  style={{
                                    color:
                                      ELEMENT_COLORS[
                                        GAN_INFO[dGanStr]?.element
                                      ],
                                  }}
                                >
                                  {t(dGanStr)}
                                </div>
                                <div
                                  className="text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-black tracking-tighter sm:tracking-normal leading-tight whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5 mt-0.5"
                                  style={{
                                    color:
                                      ELEMENT_COLORS[
                                        ZHI_INFO[dZhiStr]?.element
                                      ],
                                  }}
                                >
                                  {t(dZhiStr)}
                                </div>
                                <span
                                  className={`text-[6px] sm:text-[7px] font-black tracking-tight mt-0.5 whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5 ${txtClassForDay}`}
                                >
                                  {t(tZhi)}
                                </span>
                              </div>
                              <div
                                className={`text-[8px] sm:text-[9px] font-mono font-bold mt-2 tabular-nums text-center ${isSelectedDay ? "text-purple-800" : "text-slate-400"}`}
                              >
                                {solarDay.getDay()}/{solarDay.getMonth()}
                                <div className="text-[7.5px] font-black opacity-60">
                                  AL:{lDay.getDay()}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Hourly Cycles (Lưu Giờ) */}
                <div className="flex border-b border-slate-300 overflow-hidden bg-white">
                  <div className="flex flex-col items-center justify-center bg-[#16A085] text-white min-w-[44px] max-w-[44px] sm:min-w-[50px] sm:max-w-[50px] md:min-w-[56px] md:max-w-[56px] lg:min-w-[65px] lg:max-w-[65px] shrink-0 px-1 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.1)] py-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                      LƯU
                      <br />
                      GIỜ
                    </span>
                    <div className="w-5 h-[2px] bg-white my-2 rounded-full opacity-50"></div>
                  </div>

                  <div
                    className="flex overflow-x-auto scroll-smooth select-none hide-scrollbar flex-1"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    <div className="flex items-center w-full">
                      {(() => {
                        const selectedMonthObj = baziMonths[selectedMonthIdx];
                        if (!selectedMonthObj) return null;
                        const solarDay =
                          selectedMonthObj.days[selectedDayIdx] ||
                          selectedMonthObj.days[0];
                        if (!solarDay) return null;

                        const hours = [
                          { h: 0, name: "Tý", range: "23-1" },
                          { h: 2, name: "Sửu", range: "1-3" },
                          { h: 4, name: "Dần", range: "3-5" },
                          { h: 6, name: "Mão", range: "5-7" },
                          { h: 8, name: "Thìn", range: "7-9" },
                          { h: 10, name: "Tị", range: "9-11" },
                          { h: 12, name: "Ngọ", range: "11-13" },
                          { h: 14, name: "Mùi", range: "13-15" },
                          { h: 16, name: "Thân", range: "15-17" },
                          { h: 18, name: "Dậu", range: "17-19" },
                          { h: 20, name: "Tuất", range: "19-21" },
                          { h: 22, name: "Hợi", range: "21-23" },
                        ];

                        return hours.map((hourObj, idx) => {
                          const sHour = Solar.fromYmdHms(
                            solarDay.getYear(),
                            solarDay.getMonth(),
                            solarDay.getDay(),
                            hourObj.h,
                            0,
                            0,
                          );
                          const lDateForHour = sHour.getLunar();
                          const ec = lDateForHour.getEightChar(2);
                          const hGanStr = translateGanZhi(ec.getTimeGan());
                          const hZhiStr = translateGanZhi(ec.getTimeZhi());

                          const tGan = getThapThan(dayGan, hGanStr);
                          const tZhi = getThapThan(
                            dayGan,
                            TANG_DON[hZhiStr]?.[0] || "",
                          );
                          const bgClassForHour = getInteractionBgClass(
                            hGanStr,
                            hZhiStr,
                            pillars,
                          );
                          const txtClassForHour = getInteractionTextClass(
                            hGanStr,
                            hZhiStr,
                            pillars,
                          );
                          const isSelectedHour = selectedHourIdx === idx;

                          const currentLunar = sHour.getLunar();
                          const nextJie = currentLunar.getNextJieQi();
                          const nextJieSolar = nextJie.getSolar();
                          const isTransitionInHour =
                            nextJieSolar.getYear() === solarDay.getYear() &&
                            nextJieSolar.getMonth() === solarDay.getMonth() &&
                            nextJieSolar.getDay() === solarDay.getDay() &&
                            nextJieSolar.getHour() >= hourObj.h &&
                            nextJieSolar.getHour() < hourObj.h + 2;

                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedHourIdx(idx)}
                              className={`flex flex-col items-center justify-between border-r border-slate-200 w-[8.333333%] shrink-0 py-1.5 sm:py-3 cursor-pointer transition-all ${
                                bgClassForHour ||
                                (isSelectedHour ? "bg-teal-50" : "bg-white")
                              } ${isSelectedHour ? "ring-2 ring-inset ring-teal-500/30" : ""} hover:opacity-80 relative`}
                            >
                              <div className="flex flex-col items-center w-full">
                                <span
                                  className={`text-[6px] sm:text-[7px] font-black tracking-tight mb-0.5 whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5 ${txtClassForHour}`}
                                >
                                  {t(tGan)}
                                </span>
                                <div
                                  className="text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-black tracking-tighter sm:tracking-normal leading-tight whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5"
                                  style={{
                                    color:
                                      ELEMENT_COLORS[
                                        GAN_INFO[hGanStr]?.element
                                      ],
                                  }}
                                >
                                  {t(hGanStr)}
                                </div>
                                <div
                                  className="text-[9px] sm:text-[11px] md:text-[13px] lg:text-[15px] font-black tracking-tighter sm:tracking-normal leading-tight whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5 mt-0.5"
                                  style={{
                                    color:
                                      ELEMENT_COLORS[
                                        ZHI_INFO[hZhiStr]?.element
                                      ],
                                  }}
                                >
                                  {t(hZhiStr)}
                                </div>
                                <span
                                  className={`text-[6px] sm:text-[7px] font-black tracking-tight mt-0.5 whitespace-nowrap text-center text-clip overflow-hidden w-full px-0.5 ${txtClassForHour}`}
                                >
                                  {t(tZhi)}
                                </span>
                              </div>
                              <div
                                className={`text-[8px] sm:text-[9px] font-mono font-black mt-2 tabular-nums uppercase flex flex-col items-center ${isSelectedHour ? "text-teal-800" : "text-slate-400"}`}
                              >
                                {t(hZhiStr)}
                                <div className="text-[5px] opacity-60 lowercase font-bold">
                                  {hourObj.range}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Footer Sections */}
                <div className="grid grid-cols-4">
                  <div className="col-span-1 border-r border-gray-300">
                    <div className="grid grid-cols-2 border-b border-gray-300">
                      <div className="p-2 bg-blue-50 font-bold text-[9px] text-blue-800 border-r border-gray-300">
                        {t("bazi.thaiNguyen")}
                      </div>
                      <div className="p-2 text-xs font-bold text-center">
                        {t(thaiNguyen)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 border-b border-gray-300">
                      <div className="p-2 bg-blue-50 font-bold text-[9px] text-blue-800 border-r border-gray-300">
                        {t("bazi.nienKhong")}
                      </div>
                      <div className="p-2 text-xs font-bold text-center">
                        {t(nienKhong)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 border-b border-gray-300">
                      <div className="p-2 bg-blue-50 font-bold text-[9px] text-blue-800 border-r border-gray-300">
                        {t("bazi.nhatKhong")}
                      </div>
                      <div className="p-2 text-xs font-bold text-center">
                        {t(nhatKhong)}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="p-2 bg-blue-50 font-bold text-[10px] text-blue-800 border-b border-gray-300 text-center">
                      {t("bazi.thanSatNguyenCuc")}
                    </div>
                    <div className="grid grid-cols-4 h-full">
                      {pillars.map((p, i) => {
                        const key =
                          i === 0
                            ? "year"
                            : i === 1
                              ? "month"
                              : i === 2
                                ? "day"
                                : "hour";
                        return (
                          <div
                            key={i}
                            className="p-2 border-r border-gray-300 flex flex-col items-center gap-1"
                          >
                            <div className="text-[9px] text-gray-400 uppercase">
                              {t(
                                `bazi.${i === 0 ? "nienThan" : i === 1 ? "nguyetThan" : i === 2 ? "nhatThan" : "thoiThan"}`,
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              {(commonShenSha[key] || []).map((s, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-bold text-gray-700"
                                >
                                  {t(s)}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Five Elements Chart */}
                <FiveElementsChart
                  pillars={pillars}
                  dayMasterElement={GAN_INFO[dayGan]?.element || ""}
                  gender={gender}
                />

                {/* AI Analysis Section */}
                <div className="mt-8 border border-slate-200 rounded-3xl overflow-hidden shadow-lg bg-[#F2F2EB] flex flex-col">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#F2F2EB]/10 rounded-2xl flex items-center justify-center text-amber-400 border border-white/20 backdrop-blur-sm shadow-xl">
                        <Sparkles size={24} />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-serif text-lg font-black text-white uppercase tracking-wider mb-0.5">
                          {t("ai.geminiLuanGiai")}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
                          {t("ai.advancedBaziAnalysis")}
                        </span>
                      </div>
                    </div>
                    {baziChat.length === 0 && (
                      <button
                        onClick={() =>
                          analyzeBazi(
                            pillars,
                            lunar,
                            gender,
                            date.name,
                            baziQuestion,
                          )
                        }
                        disabled={isAnalyzing}
                        className={`group relative overflow-hidden px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isAnalyzing ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:from-amber-300 hover:to-amber-500 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)]"}`}
                      >
                        {isAnalyzing ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="animate-spin h-4 w-4 text-slate-400"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            {t("ai.analyzing")}
                          </span>
                        ) : (
                          <>
                            <span className="relative z-10">
                              {t("ai.startAnalysis")}
                            </span>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10 transition-all group-hover:h-full group-active:bg-black/20"></div>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Chat Timeline */}
                  <div className="p-2 sm:p-3 bg-[#F2F2EB] min-h-[250px] max-h-[600px] overflow-y-auto flex flex-col gap-4 sm:gap-5 border-b border-slate-200/50">
                    {baziChat.length === 0 && !isAnalyzing && (
                      <div className="flex flex-col items-center justify-center py-12 text-center h-full my-auto">
                        <p className="text-gray-400 text-sm max-w-md">
                          {t("ai.emptyStateText")}
                        </p>
                      </div>
                    )}

                    {baziChat.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-full`}
                      >
                        {msg.role === "user" ? (
                          <div className="bg-amber-100 text-amber-900 px-3.5 py-2 rounded-2xl rounded-tr-sm text-[13px] font-medium w-max max-w-[85%] whitespace-pre-wrap leading-relaxed shadow-sm">
                            {msg.text}
                          </div>
                        ) : (
                          <div className="bg-white/60 text-slate-800 p-3 sm:p-4 rounded-2xl rounded-tl-sm border border-slate-200/50 w-full prose prose-amber max-w-none text-[13px] leading-relaxed markdown-body shadow-sm relative group">
                            {msg.text && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.text);
                                  setCopiedIndex(idx);
                                  setTimeout(() => setCopiedIndex(null), 2000);
                                }}
                                className="absolute top-2 right-2 p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Sao chép"
                              >
                                {copiedIndex === idx ? (
                                  <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {msg.text ? (
                              <Markdown>{msg.text}</Markdown>
                            ) : (
                              <div className="flex gap-2 items-center h-6">
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                              </div>
                            )}
                            {isAnalyzing &&
                              idx === baziChat.length - 1 &&
                              msg.text && (
                                <div className="inline-block w-1.5 h-4 bg-amber-400 ml-1 animate-pulse align-middle"></div>
                              )}
                          </div>
                        )}
                      </div>
                    ))}

                    {isAnalyzing && baziChat.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                        </div>
                        <p className="text-sm text-amber-800 font-medium animate-pulse">
                          Đại Sư AI đang nghiên cứu lá số của bạn...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 bg-white/40 flex gap-3 items-end sticky bottom-0 z-50 backdrop-blur-md border-t border-amber-100/30">
                    <textarea
                      onFocus={(e) => {
                        setTimeout(() => {
                          e.target.scrollIntoView({
                            behavior: "smooth",
                            block: "end",
                          });
                        }, 300);
                      }}
                      disabled={isAnalyzing}
                      className="flex-1 p-3.5 bg-white/95 border border-slate-200 rounded-2xl text-[16px] md:text-sm focus:outline-none focus:border-amber-400 min-h-[50px] max-h-[150px] resize-y shadow-md transition-colors disabled:bg-slate-50 disabled:text-slate-400"
                      style={{ scrollMarginBottom: "100px" }}
                      placeholder={t("ai.chatPlaceholder")}
                      value={baziQuestion}
                      onChange={(e) => setBaziQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (baziQuestion.trim() && !isAnalyzing) {
                            analyzeBazi(
                              pillars,
                              lunar,
                              gender,
                              date.name,
                              baziQuestion,
                            );
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() =>
                        analyzeBazi(
                          pillars,
                          lunar,
                          gender,
                          date.name,
                          baziQuestion,
                        )
                      }
                      disabled={
                        isAnalyzing ||
                        (!baziQuestion.trim() && baziChat.length > 0)
                      }
                      className={`h-[50px] px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                        isAnalyzing ||
                        (!baziQuestion.trim() && baziChat.length > 0)
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-amber-500 text-white hover:bg-amber-400 active:scale-95 shadow-md hover:shadow-lg hover:shadow-amber-500/20"
                      }`}
                    >
                      {t("ai.send")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
      </main>
      <main
        className={`${activeTab === "lichBatQuai" ? "flex" : "hidden"} flex-1 p-0 sm:p-1 md:p-2 flex-col xl:flex-row gap-2 max-w-7xl mx-auto w-full bg-[#FDFBF7] text-slate-900 overflow-y-auto pb-40 md:pb-12`}
      >
        {activeTab === "lichBatQuai" && (
          <React.Fragment>
            {/* Left Panel: Date Table */}
            <div className="w-full xl:flex-[2] flex flex-col gap-2">
              <div className="bg-[#F2F2EB] border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50/50 to-[#FAFAFA] border-b border-blue-100/50 p-2.5 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
                    <div className="flex flex-col">
                      <h2 className="font-serif text-[16px] font-extrabold text-slate-800 uppercase tracking-wide leading-none mb-1">
                        Bát Tự
                      </h2>
                      <div>
                        {isBaguaAutoUpdate ? (
                          <button
                            onClick={() => setIsBaguaAutoUpdate(false)}
                            className="inline-flex items-center px-3 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm cursor-pointer hover:bg-emerald-100 transition-all uppercase tracking-widest"
                            title="Đang tự động cập nhật (Nhấn để dừng)"
                          >
                            <div className="w-1 h-1 rounded-full bg-emerald-500 mr-1.5 animate-bounce"></div>
                            Auto
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setIsBaguaAutoUpdate(true);
                            }}
                            className="inline-flex items-center px-3 py-0.5 rounded-full text-[9px] font-black bg-slate-50 text-slate-400 border border-slate-200 shadow-sm cursor-pointer hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-100 transition-all uppercase tracking-widest"
                            title="Đã dừng tự động (Nhấn để bật)"
                          >
                            <div className="w-1 h-1 rounded-full bg-slate-300 mr-1.5"></div>
                            Manual
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      Tổng Âm:{" "}
                      <span className="text-lg font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50 shrink-0 shadow-sm">
                        {baguaLunarInfo?.sum || 0}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      Tổng Dương:{" "}
                      <span className="text-lg font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100/50 shadow-sm h-fit">
                        {baguaLunarInfo?.solarSum || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table Content */}
                <div className="p-0 w-full border border-slate-200 rounded-lg shadow-sm bg-white overflow-hidden focus-mode-compact-bagua-table">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <th className="py-1 px-0.5 font-black text-[9px] sm:text-[10px] uppercase tracking-tighter text-slate-500 text-center w-[10%] leading-none">
                          Trụ
                        </th>
                        <th className="py-1 px-0.5 font-black text-[9px] sm:text-[10px] uppercase tracking-tighter text-slate-500 text-center w-[18%] leading-none">
                          Dương
                        </th>
                        <th className="py-1 px-0.5 font-black text-[9px] sm:text-[10px] uppercase tracking-tighter text-slate-500 text-center w-[6%] leading-none">
                          Âm
                        </th>
                        <th className="py-1 px-0.5 font-black text-[9px] sm:text-[10px] uppercase tracking-tighter text-slate-500 text-center w-[20%] leading-none">
                          Can Chi
                        </th>
                        <th className="py-1 px-0.5 font-black text-[9px] sm:text-[10px] uppercase tracking-tighter text-slate-500 text-center w-[8%] leading-none">
                          Hóa
                        </th>
                        <th className="py-1 px-0.5 font-black text-[9px] sm:text-[10px] uppercase tracking-tighter text-slate-500 text-center w-[12%] leading-none">
                          Mệnh
                        </th>
                        <th className="py-1 px-0.5 font-black text-[9px] sm:text-[10px] uppercase tracking-tighter text-slate-500 text-center w-[13%] leading-none">
                          Phi
                        </th>
                        <th className="py-1 px-0.5 font-black text-[9px] sm:text-[10px] uppercase tracking-tighter text-slate-500 text-center w-[13%] leading-none">
                          Sinh
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {["year", "month", "day", "hour"].map((type) => {
                        const label =
                          type === "year"
                            ? "Năm"
                            : type === "month"
                              ? "Tháng"
                              : type === "day"
                                ? "Ngày"
                                : "Giờ";
                        const lunarVal =
                          type === "year"
                            ? baguaLunarInfo?.lunarYear
                            : type === "month"
                              ? baguaLunarInfo?.lunarMonth
                              : type === "day"
                                ? baguaLunarInfo?.lunarDay
                                : baguaLunarInfo?.lunarHourIndex;
                        const name =
                          type === "year"
                            ? baguaLunarInfo?.lunarYearName
                            : type === "month"
                              ? baguaLunarInfo?.lunarMonthName
                              : type === "day"
                                ? baguaLunarInfo?.lunarDayName
                                : baguaLunarInfo?.lunarHourName;
                        const mang =
                          type === "year"
                            ? baguaLunarInfo?.yearMang
                            : type === "month"
                              ? baguaLunarInfo?.monthMang
                              : type === "day"
                                ? baguaLunarInfo?.dayMang
                                : baguaLunarInfo?.hourMang;
                        const phi =
                          type === "year"
                            ? baguaLunarInfo?.yearPhiCung
                            : type === "month"
                              ? baguaLunarInfo?.monthPhiCung
                              : type === "day"
                                ? baguaLunarInfo?.dayPhiCung
                                : baguaLunarInfo?.hourPhiCung;
                        const sinh =
                          type === "year"
                            ? baguaLunarInfo?.yearSinhCung
                            : type === "month"
                              ? baguaLunarInfo?.monthSinhCung
                              : type === "day"
                                ? baguaLunarInfo?.daySinhCung
                                : baguaLunarInfo?.hourSinhCung;

                        return (
                          <tr
                            key={type}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="py-0.5 px-0.5 text-center font-bold text-[10px] sm:text-[12px]">
                              {label}
                            </td>
                            <td className="py-0.5 px-0.5">
                              {type === "hour" ? (
                                <div className="flex items-center gap-0 w-full justify-center">
                                  <input
                                    type="number"
                                    name="hour"
                                    min="0"
                                    max="23"
                                    value={baguaDate.hour}
                                    onChange={handleBaguaInputChange}
                                    className="w-[45%] bg-slate-50 border border-slate-200 rounded text-slate-700 text-[10px] sm:text-[12px] py-0 text-center px-0 flex-shrink-0"
                                  />
                                  <span className="text-slate-400 text-[10px] mx-0.5">
                                    :
                                  </span>
                                  <input
                                    type="number"
                                    name="minute"
                                    min="0"
                                    max="59"
                                    value={baguaDate.minute}
                                    onChange={handleBaguaInputChange}
                                    className="w-[45%] bg-slate-50 border border-slate-200 rounded text-slate-700 text-[10px] sm:text-[12px] py-0 text-center px-0 flex-shrink-0"
                                  />
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  name={type}
                                  value={baguaDate[type]}
                                  onChange={handleBaguaInputChange}
                                  className="w-[90%] mx-auto block bg-slate-50 border border-slate-200 rounded text-slate-700 text-[10px] sm:text-[12px] py-0 text-center px-0"
                                />
                              )}
                            </td>
                            <td className="py-0.5 px-0.5 text-center text-[10px] sm:text-[12px] font-mono font-medium text-slate-500 tabular-nums">
                              {lunarVal}
                            </td>
                            <td className="py-0.5 px-0.5 text-center bg-amber-50/5">
                              <div className="flex flex-col items-center justify-center -space-y-0.5 sm:space-y-0 text-[10px] sm:text-[12px]">
                                {renderColoredCanChi(name)}
                              </div>
                            </td>
                            <td className="py-0.5 px-0.5 text-center text-[9px] sm:text-[10px] text-indigo-500 font-bold tracking-tighter">
                              {type === "hour"
                                ? "Lộc"
                                : type === "day"
                                  ? "Quyền"
                                  : type === "month"
                                    ? "Khoa"
                                    : "Kỵ"}
                            </td>
                            <td className="py-0.5 px-0.5 text-center text-[9px] sm:text-[11px] font-semibold text-slate-500 leading-[1.1] truncate">
                              {mang}
                            </td>
                            <td className="py-0.5 px-0.5 text-center text-[10px] sm:text-[12px] font-semibold text-blue-600 italic">
                              {phi}
                            </td>
                            <td className="py-0.5 px-0.5 text-center text-[10px] sm:text-[12px] font-semibold text-emerald-600 italic">
                              {sinh}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Panel: Trigram Result */}
            <div className="w-full xl:flex-1 bg-[#F2F2EB] border border-slate-200/80 rounded-xl shadow-sm flex flex-col mt-1.5 xl:mt-0 xl:ml-2 min-w-0">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 py-1.5 px-2 border-b border-amber-200/60 flex items-center justify-center gap-2">
                <div className="w-0.5 h-4 bg-amber-500 rounded-full"></div>
                <h2 className="font-serif text-[15px] font-extrabold text-slate-800 uppercase tracking-tight">
                  KẾT QUẢ BÁT QUÁI
                </h2>
              </div>

              <div className="p-2 lg:p-3 flex flex-col items-center">
                <div className="w-full flex flex-col gap-2.5">
                  {/* Four Pillars */}
                  <div className="grid grid-cols-4 divide-x divide-slate-100 bg-slate-50/60 border border-slate-200/60 rounded-lg w-full shadow-sm mb-1.5 overflow-hidden">
                    <div className="flex flex-col items-center py-1 md:py-2 px-0.5 hover:bg-white transition-colors">
                      <div className="text-[7.5px] md:text-[9px] text-slate-400 uppercase tracking-widest mb-0">
                        {" "}
                        Năm{" "}
                      </div>
                      <div className="text-[9.5px] md:text-sm font-black text-amber-700 uppercase tracking-tighter text-center">
                        {" "}
                        {baguaLunarInfo?.lunarYearName}{" "}
                      </div>
                    </div>
                    <div className="flex flex-col items-center py-1 md:py-2 px-0.5 hover:bg-white transition-colors">
                      <div className="text-[7.5px] md:text-[9px] text-slate-400 uppercase tracking-widest mb-0">
                        {" "}
                        Tháng{" "}
                      </div>
                      <div className="text-[9.5px] md:text-sm font-black text-amber-700 uppercase tracking-tighter text-center">
                        {" "}
                        {baguaLunarInfo?.lunarMonthName}{" "}
                      </div>
                    </div>
                    <div className="flex flex-col items-center py-1 md:py-2 px-0.5 hover:bg-white transition-colors">
                      <div className="text-[7.5px] md:text-[9px] text-slate-400 uppercase tracking-widest mb-0">
                        {" "}
                        Ngày{" "}
                      </div>
                      <div className="text-[9.5px] md:text-sm font-black text-amber-700 uppercase tracking-tighter text-center">
                        {" "}
                        {baguaLunarInfo?.lunarDayName}{" "}
                      </div>
                    </div>
                    <div className="flex flex-col items-center py-1 md:py-2 px-0.5 bg-amber-50/50 hover:bg-amber-100/30 transition-colors">
                      <div className="text-[7.5px] md:text-[9px] text-amber-600/70 uppercase tracking-widest mb-0">
                        {" "}
                        Giờ{" "}
                      </div>
                      <div className="text-[9.5px] md:text-sm font-black text-amber-800 uppercase tracking-tighter text-center">
                        {" "}
                        {baguaLunarInfo?.lunarHourName}{" "}
                      </div>
                    </div>
                  </div>

                  {/* 1. Lập Tiên Thiên - Âm Lịch */}
                  <div className="w-full border-t border-slate-200/60 flex flex-col items-center pt-2">
                    <div className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-2 bg-blue-50 border border-blue-100 px-2 py-1 rounded shadow-sm text-center">
                      Quẻ Tiên Thiên - Âm Lịch ({baguaLunarInfo?.sum})
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full justify-items-center">
                      <HexagramDisplay
                        upper={mainUpper}
                        lower={mainLower}
                        title="Quẻ Chính"
                        dayChi={baguaLunarInfo?.lunarDayName?.split(" ")[1]}
                        changingLine={baguaLunarInfo?.changingLine}
                        showStems={true}
                      />
                      <HexagramDisplay
                        upper={changedUpper}
                        lower={changedLower}
                        title="Quẻ Biến"
                        isChangedView={true}
                        palaceUpper={getPalaceInfo(mainUpper, mainLower).palace}
                        palaceLower={getPalaceInfo(mainUpper, mainLower).palace}
                        forcedPalaceElement={
                          getPalaceInfo(mainUpper, mainLower).palaceElement
                        }
                        withLucThuSpace={!!baguaLunarInfo?.lunarDayName}
                        showStems={true}
                      />
                    </div>
                  </div>

                  {/* 2. Biến Quẻ Theo Từng Trụ (Âm) */}
                  <div className="w-full mt-2 pt-2 border-t border-slate-200 flex flex-col items-center">
                    <div className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">
                      Biến Theo Từng Trụ Âm (Dư chia 6)
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full justify-items-center">
                      <HexagramDisplay
                        upper={mainUpper}
                        lower={mainLower}
                        title="Quẻ Chính"
                        dayChi={baguaLunarInfo?.lunarDayName?.split(" ")[1]}
                        movingLines={
                          baguaLunarInfo?.pillarLines
                            ? new Set(baguaLunarInfo.pillarLines)
                            : undefined
                        }
                        showStems={true}
                      />
                      <HexagramDisplay
                        upper={secondChangedUpper}
                        lower={secondChangedLower}
                        title="Quẻ Biến"
                        isChangedView={true}
                        palaceUpper={getPalaceInfo(mainUpper, mainLower).palace}
                        palaceLower={getPalaceInfo(mainUpper, mainLower).palace}
                        forcedPalaceElement={
                          getPalaceInfo(mainUpper, mainLower).palaceElement
                        }
                        withLucThuSpace={!!baguaLunarInfo?.lunarDayName}
                        showStems={true}
                      />
                    </div>
                  </div>

                  {/* 3. Lập Tiên Thiên - Dương Lịch */}
                  <div className="w-full mt-2 pt-2 border-t border-slate-200 flex flex-col items-center">
                    <div className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-rose-600 mb-2 bg-rose-50 border border-rose-100 px-2 py-1 rounded shadow-sm text-center">
                      Quẻ Tiên Thiên - Dương Lịch ({baguaLunarInfo?.solarSum})
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full justify-items-center">
                      <HexagramDisplay
                        upper={solarMainUpper}
                        lower={solarMainLower}
                        title="Quẻ Chính"
                        dayChi={baguaLunarInfo?.lunarDayName?.split(" ")[1]}
                        changingLine={solarChangingLine}
                        showStems={true}
                      />
                      <HexagramDisplay
                        upper={solarChangedUpper}
                        lower={solarChangedLower}
                        title="Quẻ Biến"
                        isChangedView={true}
                        palaceUpper={
                          getPalaceInfo(solarMainUpper, solarMainLower).palace
                        }
                        palaceLower={
                          getPalaceInfo(solarMainUpper, solarMainLower).palace
                        }
                        forcedPalaceElement={
                          getPalaceInfo(solarMainUpper, solarMainLower)
                            .palaceElement
                        }
                        withLucThuSpace={!!baguaLunarInfo?.lunarDayName}
                        showStems={true}
                      />
                    </div>
                  </div>

                  {/* 4. Biến Quẻ Theo Từng Trụ Tiên Thiên (Dương) */}
                  <div className="w-full mt-2 pt-2 border-t border-slate-200 flex flex-col items-center">
                    <div className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">
                      Biến Theo Từng Trụ Dương (Dư chia 6)
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full justify-items-center">
                      <HexagramDisplay
                        upper={solarMainUpper}
                        lower={solarMainLower}
                        title="Quẻ Chính"
                        dayChi={baguaLunarInfo?.lunarDayName?.split(" ")[1]}
                        movingLines={
                          baguaLunarInfo?.solarPillarLines
                            ? new Set(baguaLunarInfo.solarPillarLines)
                            : undefined
                        }
                        showStems={true}
                      />
                      <HexagramDisplay
                        upper={solarSecondChangedUpper}
                        lower={solarSecondChangedLower}
                        title="Quẻ Biến"
                        isChangedView={true}
                        palaceUpper={
                          getPalaceInfo(solarMainUpper, solarMainLower).palace
                        }
                        palaceLower={
                          getPalaceInfo(solarMainUpper, solarMainLower).palace
                        }
                        forcedPalaceElement={
                          getPalaceInfo(solarMainUpper, solarMainLower)
                            .palaceElement
                        }
                        withLucThuSpace={!!baguaLunarInfo?.lunarDayName}
                        showStems={true}
                      />
                    </div>
                  </div>

                  {/* Auto Analysis Block */}
                  {(isAutoAnalyzing || autoLichAnalysis) && (
                    <div className="w-full mt-4 p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-bold uppercase flex items-center gap-2 text-blue-800">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                          Giờ Hiện Tại
                        </div>
                        <button
                          onClick={() => setAutoLichAnalysis("")}
                          disabled={isAutoAnalyzing}
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${isAutoAnalyzing ? "animate-spin" : ""}`}
                          />
                        </button>
                      </div>
                      <div className="text-sm markdown-body">
                        <Markdown>
                          {autoLichAnalysis || "Đang phân tích..."}
                        </Markdown>
                      </div>
                    </div>
                  )}

                  {/* AI Analysis Section */}
                  <div className="mt-4 border border-amber-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="p-4 bg-amber-50/50 border-b border-amber-100 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                          <Zap className="w-4 h-4" /> AI Luận Quẻ
                        </h3>
                        <button
                          onClick={() =>
                            analyzeLich(
                              baguaLunarInfo,
                              lichQuestion,
                              HEXAGRAM_NAMES[`${changedUpper},${changedLower}`],
                              HEXAGRAM_NAMES[
                                `${secondChangedUpper},${secondChangedLower}`
                              ],
                            )
                          }
                          disabled={isAnalyzingLich}
                          className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold disabled:bg-slate-300"
                        >
                          {isAnalyzingLich ? "Đang luận..." : "Luận Quẻ"}
                        </button>
                      </div>
                      <textarea
                        className="w-full p-2 border border-amber-200 rounded-lg text-xs min-h-[60px] resize-none"
                        placeholder="Hỏi AI về quẻ này..."
                        value={lichQuestion}
                        onChange={(e) => setLichQuestion(e.target.value)}
                      />
                    </div>
                    <div className="p-4 min-h-[60px]">
                      {lichAiAnalysis ? (
                        <div className="markdown-body text-xs">
                          <Markdown>{lichAiAnalysis}</Markdown>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-[10px] italic">
                          Chưa có kết quả luận
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        )}
      </main>

      <main
        className={`${activeTab === "gieoQue" ? "flex" : "hidden"} flex-1 p-2 md:p-4 flex-col md:flex-row items-stretch justify-start max-w-7xl mx-auto w-full gap-4 text-slate-900 my-2 pb-[10vh] md:pb-8 overflow-y-auto relative z-0`}
      >
        {activeTab === "gieoQue" && (
          <React.Fragment>
            <div className="w-full md:w-[260px] bg-white rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-row md:flex-col gap-2 md:gap-3 flex-shrink-0 min-h-fit md:h-fit md:sticky md:top-4 overflow-x-auto scrollbar-hide z-20">
              <div className="hidden md:flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-inner">
                  <Menu className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[15px]">
                  Danh Mục
                </h3>
              </div>

              <button
                onClick={() => {
                  setGieoQueMode("thuCong");
                  setManualLines([true, true, true, true, true, true]);
                  setManualMovingLines(new Set());
                  setManualIsCast(false);
                  setGieoQueAnalysis("");
                  setGieoQueQuestion("");
                }}
                className={`flex-shrink-0 flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2.5 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl font-bold text-[13px] md:text-sm transition-all group ${gieoQueMode === "thuCong" ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 md:translate-x-1" : "bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700 md:hover:translate-x-1"}`}
              >
                <div
                  className={`hidden md:flex w-8 h-8 rounded-xl items-center justify-center transition-colors ${gieoQueMode === "thuCong" ? "bg-white/20" : "bg-white shadow-sm group-hover:bg-amber-100"}`}
                >
                  <Hand
                    className={`w-4 h-4 ${gieoQueMode === "thuCong" ? "text-white" : "text-slate-400 group-hover:text-amber-600"}`}
                  />
                </div>
                <Hand
                  className={`w-4 h-4 md:hidden ${gieoQueMode === "thuCong" ? "text-white" : "text-slate-500"}`}
                />
                Thủ Công
              </button>
              <button
                onClick={() => {
                  setGieoQueMode("linhUng");
                  setLinhUngLines([]);
                  setLinhUngDateInfo(null);
                  setLinhUngShowMain(false);
                  setLinhUngShowChanged(false);
                  setGieoQueAnalysis("");
                  setGieoQueQuestion("");
                }}
                className={`flex-shrink-0 flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2.5 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl font-bold text-[13px] md:text-sm transition-all group ${gieoQueMode === "linhUng" ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 md:translate-x-1" : "bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700 md:hover:translate-x-1"}`}
              >
                <div
                  className={`hidden md:flex w-8 h-8 rounded-xl items-center justify-center transition-colors ${gieoQueMode === "linhUng" ? "bg-white/20" : "bg-white shadow-sm group-hover:bg-amber-100"}`}
                >
                  <Sparkles
                    className={`w-4 h-4 ${gieoQueMode === "linhUng" ? "text-white" : "text-slate-400 group-hover:text-amber-600"}`}
                  />
                </div>
                <Sparkles
                  className={`w-4 h-4 md:hidden ${gieoQueMode === "linhUng" ? "text-white" : "text-slate-500"}`}
                />
                Linh Ứng
              </button>
              <button
                onClick={() => {
                  setGieoQueMode("yNghia");
                  setSelectedLookupHex(null);
                  setGieoQueAnalysis("");
                  setGieoQueQuestion("");
                }}
                className={`flex-shrink-0 flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2.5 md:px-4 md:py-3.5 rounded-xl md:rounded-2xl font-bold text-[13px] md:text-sm transition-all group ${gieoQueMode === "yNghia" ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 md:translate-x-1" : "bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700 md:hover:translate-x-1"}`}
              >
                <div
                  className={`hidden md:flex w-8 h-8 rounded-xl items-center justify-center transition-colors ${gieoQueMode === "yNghia" ? "bg-white/20" : "bg-white shadow-sm group-hover:bg-amber-100"}`}
                >
                  <Book
                    className={`w-4 h-4 ${gieoQueMode === "yNghia" ? "text-white" : "text-slate-400 group-hover:text-amber-600"}`}
                  />
                </div>
                <Book
                  className={`w-4 h-4 md:hidden ${gieoQueMode === "yNghia" ? "text-white" : "text-slate-500"}`}
                />
                Ý Nghĩa Quẻ
              </button>
            </div>

            <div className="flex-1 w-full bg-white p-3 md:p-8 rounded-2xl md:rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-start min-h-[500px]">
              {gieoQueMode === "thuCong" && (
                <>
                  <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-widest mb-2">
                    Gieo Quẻ Thủ Công
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 mb-8 text-center max-w-lg">
                    Nhấp vào thanh hào để đổi Âm/Dương. Nhấp vào nút "Động" bên
                    cạnh để đánh dấu hào động (thành màu đỏ). Sau khi hoàn tất,
                    bấm "Lập Quẻ".
                  </p>

                  <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                    {!manualIsCast && (
                      <div className="flex flex-col gap-2 w-full max-w-[260px] items-center justify-center min-h-[300px] bg-slate-50/50 rounded-xl p-4 sm:p-6 border border-slate-200">
                        {[5, 4, 3, 2, 1, 0].map((idx) => {
                          const lineNum = idx + 1;
                          const isYang = manualLines[idx];
                          const isMoving = manualMovingLines.has(lineNum);
                          return (
                            <div
                              key={lineNum}
                              className="flex items-center gap-3 w-full group"
                            >
                              <span className="text-xs font-bold text-slate-500 w-12 text-right uppercase tracking-widest">
                                Hào {lineNum}
                              </span>

                              <div
                                className="flex-1 h-2.5 md:h-3 flex items-center justify-center cursor-pointer transition-transform group-hover:scale-[1.02]"
                                onClick={() => {
                                  setManualLines((prev) => {
                                    const n = [...prev];
                                    n[idx] = !n[idx];
                                    return n;
                                  });
                                }}
                              >
                                {isYang ? (
                                  <div
                                    className={`h-full w-full shadow-sm transition-colors ${isMoving ? "bg-red-500" : "bg-slate-800"}`}
                                  ></div>
                                ) : (
                                  <div className="h-full w-full flex justify-between">
                                    <div
                                      className={`h-full w-[45%] shadow-sm transition-colors ${isMoving ? "bg-red-500" : "bg-slate-800"}`}
                                    ></div>
                                    <div
                                      className={`h-full w-[45%] shadow-sm transition-colors ${isMoving ? "bg-red-500" : "bg-slate-800"}`}
                                    ></div>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => {
                                  setManualMovingLines((prev) => {
                                    const n = new Set(prev);
                                    if (n.has(lineNum)) n.delete(lineNum);
                                    else n.add(lineNum);
                                    return n;
                                  });
                                }}
                                className={`w-14 h-6 rounded-md text-[10px] font-bold uppercase transition-colors shadow-sm ${isMoving ? "bg-red-500 text-white" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
                              >
                                {isMoving ? "Động" : "Tĩnh"}
                              </button>
                            </div>
                          );
                        })}

                        <div className="flex gap-3 w-full mt-6">
                          <button
                            onClick={() => setManualIsCast(true)}
                            className="flex-1 py-3 bg-amber-600 text-white font-black uppercase text-sm rounded-xl shadow-lg hover:bg-amber-700 transition-all"
                          >
                            Lập Quẻ
                          </button>
                          <button
                            onClick={() => {
                              setManualLines([
                                true,
                                true,
                                true,
                                true,
                                true,
                                true,
                              ]);
                              setManualMovingLines(new Set());
                            }}
                            className="px-4 py-3 bg-slate-200 text-slate-600 font-bold uppercase text-xs rounded-xl shadow-sm hover:bg-slate-300 transition-all"
                          >
                            Làm Mới
                          </button>
                        </div>
                      </div>
                    )}

                    {manualIsCast &&
                      (() => {
                        const mainBinary = manualLines.map((v) => (v ? 1 : 0));
                        const currentMoving = manualMovingLines;
                        const changedBinary = manualLines.map((v, idx) => {
                          const isMoving = currentMoving.has(idx + 1);
                          if (isMoving) return v ? 0 : 1;
                          return v ? 1 : 0;
                        });

                        const qMainLower = getTrigramFromBinary(
                          mainBinary.slice(0, 3),
                        );
                        const qMainUpper = getTrigramFromBinary(
                          mainBinary.slice(3, 6),
                        );
                        const qChangedLower = getTrigramFromBinary(
                          changedBinary.slice(0, 3),
                        );
                        const qChangedUpper = getTrigramFromBinary(
                          changedBinary.slice(3, 6),
                        );

                        const mainPalaceInfo = getPalaceInfo(
                          qMainUpper,
                          qMainLower,
                        );

                        return (
                          <div className="flex flex-col items-center w-full max-w-4xl content-start">
                            <div className="flex w-full justify-start mb-6">
                              <button
                                onClick={() => {
                                  setManualIsCast(false);
                                  setManualToggledLines(new Set());
                                }}
                                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-full hover:bg-slate-200 transition-all flex items-center gap-2"
                              >
                                ← Biên tập lại quẻ
                              </button>
                            </div>

                            {/* Date Inputs & Can Chi Info */}
                            <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm mb-8 overflow-hidden">
                              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                                  Thời Điểm Lập Quẻ
                                </h3>
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                              </div>
                              <div className="p-4 sm:p-5">
                                <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full">
                                  {/* Giờ */}
                                  <div className="flex flex-col gap-2">
                                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase text-center w-full tracking-widest">
                                      Giờ
                                    </label>
                                    <input
                                      type="number"
                                      name="hour"
                                      value={manualCastDate.hour}
                                      onChange={handleManualDateChange}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-1 py-1.5 sm:py-2 text-xs sm:text-sm text-center font-mono font-bold text-slate-700 hover:border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-inner"
                                    />
                                    {manualCastLunarInfo ? (
                                      <div className="bg-amber-50/80 text-amber-800 text-[10px] sm:text-xs font-bold text-center py-2 px-1 rounded-xl border border-amber-200/50 min-h-[36px] flex items-center justify-center">
                                        {manualCastLunarInfo.lunarHourName}
                                      </div>
                                    ) : (
                                      <div className="h-[36px]"></div>
                                    )}
                                  </div>
                                  {/* Ngày */}
                                  <div className="flex flex-col gap-2">
                                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase text-center w-full tracking-widest">
                                      Ngày
                                    </label>
                                    <input
                                      type="number"
                                      name="day"
                                      value={manualCastDate.day}
                                      onChange={handleManualDateChange}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-1 py-1.5 sm:py-2 text-xs sm:text-sm text-center font-mono font-bold text-slate-700 hover:border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-inner"
                                    />
                                    {manualCastLunarInfo ? (
                                      <div className="bg-amber-50/80 text-amber-800 text-[10px] sm:text-xs font-bold text-center py-2 px-1 rounded-xl border border-amber-200/50 min-h-[36px] flex items-center justify-center">
                                        {manualCastLunarInfo.lunarDayName}
                                      </div>
                                    ) : (
                                      <div className="h-[36px]"></div>
                                    )}
                                  </div>
                                  {/* Tháng */}
                                  <div className="flex flex-col gap-2">
                                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase text-center w-full tracking-widest">
                                      Tháng
                                    </label>
                                    <input
                                      type="number"
                                      name="month"
                                      value={manualCastDate.month}
                                      onChange={handleManualDateChange}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-1 py-1.5 sm:py-2 text-xs sm:text-sm text-center font-mono font-bold text-slate-700 hover:border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-inner"
                                    />
                                    {manualCastLunarInfo ? (
                                      <div className="bg-amber-50/80 text-amber-800 text-[10px] sm:text-xs font-bold text-center py-2 px-1 rounded-xl border border-amber-200/50 min-h-[36px] flex items-center justify-center">
                                        {manualCastLunarInfo.lunarMonthName}
                                      </div>
                                    ) : (
                                      <div className="h-[36px]"></div>
                                    )}
                                  </div>
                                  {/* Năm */}
                                  <div className="flex flex-col gap-2">
                                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase text-center w-full tracking-widest">
                                      Năm
                                    </label>
                                    <input
                                      type="number"
                                      name="year"
                                      value={manualCastDate.year}
                                      onChange={handleManualDateChange}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-1 py-1.5 sm:py-2 text-xs sm:text-sm text-center font-mono font-bold text-slate-700 hover:border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-inner"
                                    />
                                    {manualCastLunarInfo ? (
                                      <div className="bg-amber-50/80 text-amber-800 text-[10px] sm:text-xs font-bold text-center py-2 px-1 rounded-xl border border-amber-200/50 min-h-[36px] flex items-center justify-center">
                                        {manualCastLunarInfo.lunarYearName}
                                      </div>
                                    ) : (
                                      <div className="h-[36px]"></div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row justify-center items-stretch gap-2 sm:gap-4 w-full mb-6 overflow-x-auto pb-2 custom-scrollbar">
                              <HexagramDisplay
                                upper={qMainUpper}
                                lower={qMainLower}
                                title="Quẻ Chính"
                                movingLines={currentMoving}
                                dayChi={
                                  manualCastLunarInfo?.lunarDayName?.split(
                                    " ",
                                  )[1]
                                }
                                showStems={true}
                                narrowWidth={false}
                              />
                              {currentMoving.size > 0 && (
                                <HexagramDisplay
                                  upper={qChangedUpper}
                                  lower={qChangedLower}
                                  title="Quẻ Biến/Hỗ"
                                  movingLines={currentMoving}
                                  forcedPalaceElement={
                                    mainPalaceInfo.palaceElement
                                  }
                                  withLucThuSpace={!!manualCastLunarInfo}
                                  showStems={true}
                                  narrowWidth={false}
                                  isChangedView={true}
                                />
                              )}
                            </div>
                            <div className="w-full bg-[#1e293b] rounded-2xl p-4 shadow-xl">
                              <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                                    ✨
                                  </div>
                                  <h3 className="font-bold text-white uppercase tracking-tight text-sm">
                                    AI Luận Giải Gieo Quẻ
                                  </h3>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 w-full mb-4 sticky bottom-0 z-50 bg-white/40 backdrop-blur-md p-2 rounded-xl">
                                <input
                                  type="text"
                                  onFocus={(e) => {
                                    setTimeout(() => {
                                      e.target.scrollIntoView({
                                        behavior: "smooth",
                                        block: "end",
                                      });
                                    }, 300);
                                  }}
                                  placeholder="Nhập điều bạn đang mong cầu hỏi quẻ..."
                                  className="flex-1 px-4 py-3 border-none rounded-lg text-[16px] md:text-sm bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full"
                                  style={{ scrollMarginBottom: "100px" }}
                                  value={gieoQueQuestion}
                                  onChange={(e) =>
                                    setGieoQueQuestion(e.target.value)
                                  }
                                />
                                <button
                                  onClick={() => {
                                    const questionWrapper = manualCastLunarInfo
                                      ? `Thời gian gieo quẻ: ${manualCastLunarInfo.lunarYearName}, ${manualCastLunarInfo.lunarMonthName}, ${manualCastLunarInfo.lunarDayName}, ${manualCastLunarInfo.lunarHourName}. ${gieoQueQuestion}`
                                      : gieoQueQuestion;
                                    analyzeGieoQue(
                                      qMainUpper,
                                      qMainLower,
                                      qChangedUpper,
                                      qChangedLower,
                                      currentMoving,
                                      questionWrapper,
                                    );
                                  }}
                                  disabled={isAnalyzingGieoQue}
                                  className={`px-4 py-2 sm:py-0 whitespace-nowrap rounded-lg font-bold text-xs transition-all shadow-sm ${isAnalyzingGieoQue ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-amber-600 text-white hover:bg-amber-700 active:scale-95 hover:shadow-md"}`}
                                >
                                  {isAnalyzingGieoQue
                                    ? "ĐANG LUẬN..."
                                    : "HỎI ĐẠI SƯ"}
                                </button>
                              </div>
                              {gieoQueAnalysis && (
                                <div className="w-full bg-[#f8fafc] rounded-xl p-4 text-sm leading-relaxed text-slate-700 border border-slate-200">
                                  <div className="markdown-body text-sm bg-transparent">
                                    <Markdown remarkPlugins={[remarkGfm]}>
                                      {gieoQueAnalysis}
                                    </Markdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                </>
              )}

              {gieoQueMode === "linhUng" && (
                <div className="flex flex-col items-center w-full">
                  <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-widest mb-2">
                    Gieo Quẻ Linh Ứng
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 mb-8 text-center max-w-lg">
                    Chỉ cần giữ tâm thanh tịnh, niệm câu hỏi trong đầu và bấm
                    nút một lần duy nhất. Đất trời sẽ cộng hưởng để lập ngay cho
                    bạn một Lục Hào Phệ khuyết thông qua trường năng lượng.
                  </p>

                  {linhUngLines.length === 0 ? (
                    <button
                      onClick={() => {
                        const lines = [];
                        for (let i = 0; i < 6; i++) {
                          const heads = [
                            Math.random() > 0.5,
                            Math.random() > 0.5,
                            Math.random() > 0.5,
                          ].filter((c) => c).length;
                          if (heads === 0) lines.push(9);
                          else if (heads === 1) lines.push(8);
                          else if (heads === 2) lines.push(7);
                          else lines.push(6);
                        }
                        setLinhUngLines(lines);

                        // Lấy ngày giờ hiện tại
                        const now = new Date();
                        const solarDate = Solar.fromYmdHms(
                          now.getFullYear(),
                          now.getMonth() + 1,
                          now.getDate(),
                          now.getHours() || 0,
                          0,
                          0,
                        );
                        const info = calculateLunarInfo(
                          solarDate.getYear(),
                          solarDate.getMonth(),
                          solarDate.getDay(),
                          now.getHours(),
                          0,
                          "male",
                        );
                        setLinhUngDateInfo(info);
                        setLinhUngShowMain(true);
                        setLinhUngShowChanged(true);
                        setLinhUngToggledLines(new Set());
                      }}
                      className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-black rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform text-sm sm:text-base mb-8 uppercase tracking-widest"
                    >
                      Thành Tâm Gieo Quẻ
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setLinhUngLines([]);
                        setLinhUngDateInfo(null);
                        setLinhUngShowMain(false);
                        setLinhUngShowChanged(false);
                        setGieoQueAnalysis("");
                        setGieoQueQuestion("");
                        setLinhUngToggledLines(new Set());
                      }}
                      className="px-6 py-2.5 bg-slate-200 text-slate-700 font-bold text-sm md:text-base rounded-full hover:bg-slate-300 transition-all mb-8 shadow-sm"
                    >
                      Xin Quẻ Mới
                    </button>
                  )}

                  <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                    {linhUngLines.length === 6 &&
                      (() => {
                        const mainBinary = linhUngLines.map((v) =>
                          v === 9 || v === 7 ? 1 : 0,
                        );
                        const movingSet = new Set<number>();
                        linhUngLines.forEach((v, idx) => {
                          if (v === 6 || v === 9) movingSet.add(idx + 1);
                        });

                        const currentMoving = movingSet;

                        const changedBinary = mainBinary.map((v, idx) => {
                          const isMoving = currentMoving.has(idx + 1);
                          if (isMoving) return v ? 0 : 1;
                          return v;
                        });

                        const qMainLower = getTrigramFromBinary(
                          mainBinary.slice(0, 3),
                        );
                        const qMainUpper = getTrigramFromBinary(
                          mainBinary.slice(3, 6),
                        );
                        const qChangedLower = getTrigramFromBinary(
                          changedBinary.slice(0, 3),
                        );
                        const qChangedUpper = getTrigramFromBinary(
                          changedBinary.slice(3, 6),
                        );

                        const mainPalaceInfo = getPalaceInfo(
                          qMainUpper,
                          qMainLower,
                        );

                        return (
                          <div className="flex flex-col items-center w-full max-w-4xl content-start">
                            {/* Date Info Block - ReadOnly */}
                            {linhUngDateInfo && (
                              <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm mb-8 overflow-hidden">
                                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                                    Thời Điểm Linh Ứng
                                  </h3>
                                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                </div>
                                <div className="p-4 sm:p-5">
                                  <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full">
                                    <div className="flex flex-col gap-2">
                                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase text-center w-full tracking-widest">
                                        Giờ
                                      </span>
                                      <div className="bg-amber-50/80 text-amber-800 text-[10px] sm:text-xs font-bold text-center py-2 sm:py-3 px-1 rounded-xl border border-amber-200/50 flex flex-col items-center justify-center shadow-inner">
                                        {linhUngDateInfo.lunarHourName}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase text-center w-full tracking-widest">
                                        Ngày
                                      </span>
                                      <div className="bg-amber-50/80 text-amber-800 text-[10px] sm:text-xs font-bold text-center py-2 sm:py-3 px-1 rounded-xl border border-amber-200/50 flex flex-col items-center justify-center shadow-inner">
                                        {linhUngDateInfo.lunarDayName}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase text-center w-full tracking-widest">
                                        Tháng
                                      </span>
                                      <div className="bg-amber-50/80 text-amber-800 text-[10px] sm:text-xs font-bold text-center py-2 sm:py-3 px-1 rounded-xl border border-amber-200/50 flex flex-col items-center justify-center shadow-inner">
                                        {linhUngDateInfo.lunarMonthName}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase text-center w-full tracking-widest">
                                        Năm
                                      </span>
                                      <div className="bg-amber-50/80 text-amber-800 text-[10px] sm:text-xs font-bold text-center py-2 sm:py-3 px-1 rounded-xl border border-amber-200/50 flex flex-col items-center justify-center shadow-inner">
                                        {linhUngDateInfo.lunarYearName}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-row justify-center items-stretch gap-1.5 sm:gap-4 w-full mb-6 overflow-x-auto pb-2">
                              {linhUngShowMain ? (
                                <HexagramDisplay
                                  upper={qMainUpper}
                                  lower={qMainLower}
                                  title="Quẻ Chính"
                                  movingLines={currentMoving}
                                  dayChi={
                                    linhUngDateInfo?.lunarDayName?.split(" ")[1]
                                  }
                                  showStems={true}
                                  narrowWidth={false}
                                />
                              ) : (
                                <div
                                  onClick={() => setLinhUngShowMain(true)}
                                  className="flex flex-col mt-1 min-h-[150px] sm:min-h-[200px] flex-grow flex-shrink basis-0 min-w-[155px] sm:max-w-[200px] md:max-w-[240px] lg:max-w-[280px] rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-dashed border-amber-300 flex items-center justify-center cursor-pointer hover:border-amber-500 hover:shadow-lg transition-all h-full"
                                >
                                  <span className="text-amber-700 font-bold uppercase tracking-widest text-xs sm:text-sm text-center px-2">
                                    Lật Quẻ
                                    <br />
                                    Chính
                                  </span>
                                </div>
                              )}

                              {currentMoving.size > 0 &&
                                (linhUngShowChanged ? (
                                  <HexagramDisplay
                                    upper={qChangedUpper}
                                    lower={qChangedLower}
                                    title="Quẻ Biến/Hỗ"
                                    movingLines={currentMoving}
                                    forcedPalaceElement={
                                      mainPalaceInfo.palaceElement
                                    }
                                    withLucThuSpace={!!linhUngDateInfo}
                                    showStems={true}
                                    narrowWidth={false}
                                    isChangedView={true}
                                  />
                                ) : (
                                  <div
                                    onClick={() => setLinhUngShowChanged(true)}
                                    className="flex flex-col mt-1 min-h-[150px] sm:min-h-[200px] flex-grow flex-shrink basis-0 min-w-[155px] sm:max-w-[200px] md:max-w-[240px] lg:max-w-[280px] rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-500 hover:shadow-lg transition-all h-full"
                                  >
                                    <span className="text-slate-600 font-bold uppercase tracking-widest text-xs sm:text-sm text-center px-2">
                                      Lật Quẻ
                                      <br />
                                      Biến
                                    </span>
                                  </div>
                                ))}
                            </div>

                            {linhUngShowMain && (
                              <div className="w-full bg-[#1e293b] rounded-2xl p-4 shadow-xl">
                                <div className="flex justify-between items-center mb-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                                      ✨
                                    </div>
                                    <h3 className="font-bold text-white uppercase tracking-tight text-sm">
                                      AI Luận Giải Gieo Quẻ Linh Ứng
                                    </h3>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full mb-4">
                                  <input
                                    type="text"
                                    placeholder="Nhập điều bạn đang mong cầu..."
                                    className="flex-1 px-4 py-2 border-none rounded-lg text-sm bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full"
                                    value={gieoQueQuestion}
                                    onChange={(e) =>
                                      setGieoQueQuestion(e.target.value)
                                    }
                                  />
                                  <button
                                    onClick={() => {
                                      const questionWrapper = linhUngDateInfo
                                        ? `Thời gian gieo quẻ: ${linhUngDateInfo.lunarYearName}, ${linhUngDateInfo.lunarMonthName}, ${linhUngDateInfo.lunarDayName}, ${linhUngDateInfo.lunarHourName}. ${gieoQueQuestion}`
                                        : gieoQueQuestion;
                                      analyzeGieoQue(
                                        qMainUpper,
                                        qMainLower,
                                        qChangedUpper,
                                        qChangedLower,
                                        currentMoving,
                                        questionWrapper,
                                      );
                                    }}
                                    disabled={isAnalyzingGieoQue}
                                    className={`px-4 py-2 sm:py-0 whitespace-nowrap rounded-lg font-bold text-xs transition-all shadow-sm ${isAnalyzingGieoQue ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-amber-600 text-white hover:bg-amber-700 active:scale-95 hover:shadow-md"}`}
                                  >
                                    {isAnalyzingGieoQue
                                      ? "ĐANG LUẬN..."
                                      : "HỎI ĐẠI SƯ"}
                                  </button>
                                </div>
                                {gieoQueAnalysis && (
                                  <div className="w-full bg-[#f8fafc] rounded-xl p-4 text-sm leading-relaxed text-slate-700 border border-slate-200">
                                    <div className="markdown-body text-sm bg-transparent">
                                      <Markdown remarkPlugins={[remarkGfm]}>
                                        {gieoQueAnalysis}
                                      </Markdown>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                  </div>
                </div>
              )}

              {gieoQueMode === "yNghia" && (
                <div className="flex flex-col items-center w-full">
                  {!selectedLookupHex ? (
                    <>
                      <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-widest mb-2 text-center">
                        Từ Điển 64 Quẻ Dịch
                      </h2>
                      <p className="text-xs md:text-sm text-slate-500 mb-6 text-center max-w-lg">
                        Tra cứu tóm tắt ý nghĩa và nguyên lý của 64 quẻ dịch.
                        Bấm vào mỗi quẻ để yêu cầu AI phân tích chi tiết các
                        khía cạnh.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 w-full max-w-4xl max-h-[600px] overflow-y-auto px-1 pb-4 custom-scrollbar">
                        {Object.entries(HEXAGRAM_NAMES).map(([key, name]) => {
                          const [upStr, lowStr] = key.split(",");
                          const up = parseInt(upStr);
                          const low = parseInt(lowStr);
                          const trigramsNames = [
                            "Càn (Thiên)",
                            "Đoài (Trạch)",
                            "Ly (Hỏa)",
                            "Chấn (Lôi)",
                            "Tốn (Phong)",
                            "Khảm (Thủy)",
                            "Cấn (Sơn)",
                            "Khôn (Địa)",
                          ];
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                setSelectedLookupHex({ upper: up, lower: low });
                                setGieoQueAnalysis("");
                                setGieoQueQuestion(
                                  "Phân tích tổng quan và ý nghĩa của quẻ này.",
                                );
                              }}
                              className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-amber-50 hover:border-amber-200 transition-all text-center flex flex-col items-center group cursor-pointer shadow-sm"
                            >
                              <div className="text-[10px] text-slate-400 mb-1 group-hover:text-amber-600 transition-colors uppercase tracking-widest">
                                {trigramsNames[up].split(" ")[0]} +{" "}
                                {trigramsNames[low].split(" ")[0]}
                              </div>
                              <div className="font-black text-slate-700 text-sm xl:text-[15px] group-hover:text-amber-700 transition-colors">
                                {name}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center w-full max-w-xl">
                      <button
                        onClick={() => setSelectedLookupHex(null)}
                        className="mb-6 px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-full hover:bg-slate-200 transition-all self-start flex items-center gap-2"
                      >
                        ← Quay lại danh sách
                      </button>

                      <div className="flex justify-center w-full mb-6">
                        <HexagramDisplay
                          upper={selectedLookupHex.upper}
                          lower={selectedLookupHex.lower}
                          title={
                            HEXAGRAM_NAMES[
                              `${selectedLookupHex.upper},${selectedLookupHex.lower}`
                            ]
                          }
                          showStems={true}
                          narrowWidth={true}
                        />
                      </div>

                      <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                          <Book className="w-5 h-5 text-amber-600" />
                          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">
                            Từ Điển Luận Giải Dịch Lý
                          </h3>
                        </div>

                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                            Ý nghĩa cốt lõi
                          </h4>
                          <p className="text-slate-700 text-sm leading-relaxed p-3 bg-slate-50 rounded-xl border border-slate-100">
                            {
                              HEXAGRAM_MEANINGS[
                                `${selectedLookupHex.upper},${selectedLookupHex.lower}`
                              ]
                            }
                          </p>
                        </div>

                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                            Cấu trúc Ngự Quái
                          </h4>
                          <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                                Ngoại Quái (Quẻ Thượng)
                              </div>
                              <div className="font-bold text-slate-800 text-sm mb-1">
                                {TRIGRAM_NATURES[selectedLookupHex.upper].name}{" "}
                                - Tượng:{" "}
                                {
                                  TRIGRAM_NATURES[selectedLookupHex.upper]
                                    .nature
                                }
                              </div>
                              <div className="text-[13px] text-slate-600">
                                {
                                  TRIGRAM_NATURES[selectedLookupHex.upper]
                                    .meaning
                                }
                              </div>
                            </div>
                            <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                                Nội Quái (Quẻ Hạ)
                              </div>
                              <div className="font-bold text-slate-800 text-sm mb-1">
                                {TRIGRAM_NATURES[selectedLookupHex.lower].name}{" "}
                                - Tượng:{" "}
                                {
                                  TRIGRAM_NATURES[selectedLookupHex.lower]
                                    .nature
                                }
                              </div>
                              <div className="text-[13px] text-slate-600">
                                {
                                  TRIGRAM_NATURES[selectedLookupHex.lower]
                                    .meaning
                                }
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                            Tượng Truyện & Hàm Ý Sâu Sắc
                          </h4>
                          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                            <p className="text-[13px] text-amber-900 leading-relaxed font-medium italic border-l-2 border-amber-400 pl-3 mb-3">
                              "
                              {
                                HEXAGRAM_RELATIONS[
                                  `${selectedLookupHex.upper},${selectedLookupHex.lower}`
                                ].connection
                              }
                              "
                            </p>
                            <p className="text-sm text-slate-800 leading-relaxed">
                              {
                                HEXAGRAM_RELATIONS[
                                  `${selectedLookupHex.upper},${selectedLookupHex.lower}`
                                ].deepMeaning
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-[#1e293b] rounded-2xl p-4 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                              ✨
                            </div>
                            <h3 className="font-bold text-white uppercase tracking-tight text-sm">
                              Yêu Cầu AI Dịch Nghĩa
                            </h3>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full mb-4">
                          <input
                            type="text"
                            placeholder="Bạn muốn hỏi AI khía cạnh rẽ nhánh nào (Sự nghiệp, tình duyên)?"
                            className="flex-1 px-4 py-2 border-none rounded-lg text-sm bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full"
                            value={gieoQueQuestion}
                            onChange={(e) => setGieoQueQuestion(e.target.value)}
                          />
                          <button
                            onClick={() =>
                              analyzeGieoQue(
                                selectedLookupHex.upper,
                                selectedLookupHex.lower,
                                selectedLookupHex.upper,
                                selectedLookupHex.lower,
                                new Set(),
                                gieoQueQuestion,
                              )
                            }
                            disabled={isAnalyzingGieoQue}
                            className={`px-4 py-2 sm:py-0 whitespace-nowrap rounded-lg font-bold text-xs transition-all shadow-sm ${isAnalyzingGieoQue ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 hover:shadow-md"}`}
                          >
                            {isAnalyzingGieoQue
                              ? "ĐANG LUẬN..."
                              : "PHÂN TÍCH QUẺ"}
                          </button>
                        </div>
                        {gieoQueAnalysis && (
                          <div className="w-full bg-[#f8fafc] rounded-xl p-4 text-sm leading-relaxed text-slate-700 border border-slate-200">
                            <div className="markdown-body text-sm bg-transparent">
                              <Markdown remarkPlugins={[remarkGfm]}>
                                {gieoQueAnalysis}
                              </Markdown>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        )}
      </main>

      <main
        className={`${activeTab === "honNhan" ? "flex" : "hidden"} flex-1 p-2 md:p-4 flex-col items-start justify-start max-w-7xl mx-auto w-full gap-4 bg-[#FDFBF7] text-slate-900 overflow-auto pb-[50vh] md:pb-8`}
      >
        {activeTab === "honNhan" && (
          <React.Fragment>
            <div className="flex flex-col lg:flex-row gap-4 w-full">
              <MarriageDateTable
                title="Nam"
                date={maleDate}
                lunarInfo={maleLunarInfo}
                onChange={handleMaleInputChange}
              />
              <MarriageDateTable
                title="Nữ"
                date={femaleDate}
                lunarInfo={femaleLunarInfo}
                onChange={handleFemaleInputChange}
              />
            </div>

            {(() => {
              const comp = getCompatibilityScore(
                maleLunarInfo,
                femaleLunarInfo,
                maleDate,
                femaleDate,
              );
              if (!comp) return null;

              return (
                <div className="w-full space-y-4">
                  {/* Header Result Summary */}
                  <div className="bg-[#F2F2EB] border border-slate-200/60 rounded-3xl p-6 shadow-sm overflow-hidden relative group transition-all hover:shadow-md">
                    {/* Background Accent */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700"></div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200/50">
                          <Heart size={32} fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                          <h2 className="text-2xl font-serif font-black text-slate-800 uppercase tracking-tight leading-none mb-2">
                            Kết Quả Hòa Hợp
                          </h2>
                          <div className="flex items-center gap-2">
                            <div className="h-0.5 w-8 bg-amber-500 rounded-full"></div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                              Compatibility Result
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
                        <div className="flex gap-8">
                          <div className="flex flex-col items-center group/item text-center">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1 group-hover/item:text-blue-500 transition-colors">
                              Nam tốt
                            </span>
                            <span className="text-3xl font-black text-blue-600 tracking-tighter tabular-nums drop-shadow-sm">
                              {comp.maleGoodPercent}%
                            </span>
                            <div className="w-8 h-1 bg-blue-100 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${comp.maleGoodPercent}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex flex-col items-center group/item text-center">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1 group-hover/item:text-pink-500 transition-colors">
                              Nữ tốt
                            </span>
                            <span className="text-3xl font-black text-pink-600 tracking-tighter tabular-nums drop-shadow-sm">
                              {comp.femaleGoodPercent}%
                            </span>
                            <div className="w-8 h-1 bg-pink-100 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="h-full bg-pink-500 rounded-full"
                                style={{ width: `${comp.femaleGoodPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="relative w-24 h-24 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="42"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="transparent"
                              className="text-slate-100"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="42"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="transparent"
                              strokeDasharray={263.8}
                              strokeDashoffset={
                                263.8 - (263.8 * comp.totalScore) / 100
                              }
                              strokeLinecap="round"
                              className="text-amber-500 transition-all duration-1000 ease-out shadow-sm"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-black text-slate-800 tracking-tighter">
                              {comp.totalScore}%
                            </span>
                            <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">
                              Hòa Hợp
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Analysis Section - Compact Version */}
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex flex-col gap-0.5">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                          <span className="w-6 h-[1.5px] bg-amber-500 rounded-full"></span>
                          Luận Giải Chi Tiết
                        </h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] ml-9">
                          Scientific Correlation
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      {comp.results.map((res: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-[#F2F2EB] border border-slate-200/50 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          {/* Ultra-Compact Pillar Header */}
                          <div className="bg-slate-50/50 px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 bg-slate-900 rounded-md flex items-center justify-center text-amber-400">
                                <span className="text-[10px] font-black">
                                  {idx + 1}
                                </span>
                              </div>
                              <span className="font-serif font-black text-slate-800 uppercase tracking-widest text-[11px]">
                                {res.label}
                              </span>
                            </div>
                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                              {idx === 0
                                ? "Năm"
                                : idx === 1
                                  ? "Tháng"
                                  : idx === 2
                                    ? "Ngày"
                                    : "Giờ"}
                            </div>
                          </div>

                          {/* Ultra-Streamlined Criteria List */}
                          <div className="divide-y divide-slate-100/40 p-0.5">
                            {[
                              {
                                label: "Can",
                                male: res.can.male,
                                female: res.can.female,
                                desc: res.can.desc,
                                score: res.can.score,
                              },
                              {
                                label: "Chi",
                                male: res.chi.male,
                                female: res.chi.female,
                                desc: res.chi.desc,
                                score: res.chi.score,
                              },
                              {
                                label: "Mệnh",
                                male: res.mang.male,
                                female: res.mang.female,
                                desc: res.mang.desc,
                                score: res.mang.score,
                              },
                              {
                                label: "Cung",
                                male: res.phiCung.male,
                                female: res.phiCung.female,
                                desc: res.phiCung.desc,
                                score: res.phiCung.score,
                              },
                              {
                                label: "Sinh",
                                male: res.sinhCung.male,
                                female: res.sinhCung.female,
                                desc: res.sinhCung.desc,
                                score: res.sinhCung.score,
                              },
                            ].map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5 p-1.5 px-2 hover:bg-slate-50/50 transition-colors"
                              >
                                {/* Criterion Label */}
                                <div className="w-6 shrink-0">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                    {item.label}
                                  </span>
                                </div>

                                {/* Values - Ultra Compact */}
                                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <div className="w-1 h-3 bg-blue-400 rounded-full shrink-0"></div>
                                    <span className="text-[11px] font-bold text-slate-800 truncate leading-none">
                                      {item.male}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-1 h-3 bg-pink-400 rounded-full shrink-0"></div>
                                    <span className="text-[11px] font-bold text-slate-800 truncate leading-none">
                                      {item.female}
                                    </span>
                                  </div>
                                </div>

                                {/* Simple Evaluation Badge */}
                                <div className="shrink-0 ml-auto">
                                  <span
                                    className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border ${item.score > 0 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : item.score < 0 ? "text-rose-600 bg-rose-50 border-rose-100" : "text-slate-400 bg-slate-100 border-slate-200"}`}
                                  >
                                    {item.desc}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-[#F2F2EB] border border-gray-200 rounded-xl shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                        Tổng Kết Khoa Học
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">
                        {comp.totalScore >= 80
                          ? "Chỉ số tương hợp đạt mức tối ưu (Đại Cát). Sự kết hợp mang lại cộng hưởng năng lượng tích cực, hỗ trợ mạnh mẽ cho sự phát triển chung."
                          : comp.totalScore >= 60
                            ? "Chỉ số tương hợp ở mức khá (Cát). Hai cá thể có nhiều điểm tương đồng, dễ dàng thiết lập sự thấu hiểu và đồng thuận."
                            : comp.totalScore >= 40
                              ? "Chỉ số tương hợp ở mức trung bình. Cần chú trọng vào việc điều chỉnh hành vi và tăng cường giao tiếp để hóa giải các điểm dị biệt."
                              : "Chỉ số tương hợp ở mức thấp. Cần áp dụng các biện pháp hóa giải phong thủy và nỗ lực vượt bậc trong việc thấu hiểu để duy trì sự ổn định."}
                      </p>
                    </div>
                  </div>

                  {/* AI Analysis Section for Marriage */}
                  <div className="mt-8 border border-slate-200 rounded-3xl overflow-hidden shadow-lg bg-[#F2F2EB] w-full">
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F2F2EB]/10 rounded-2xl flex items-center justify-center text-amber-400 border border-white/20 backdrop-blur-sm shadow-xl">
                          <Sparkles size={24} />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-serif text-lg font-black text-white uppercase tracking-wider mb-0.5">
                            Đại Sư AI Luận Giải Hôn Nhân
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
                            Scientific Marriage Analysis
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          analyzeMarriage(
                            maleLunarInfo,
                            femaleLunarInfo,
                            comp,
                            marriageQuestion,
                          )
                        }
                        disabled={isAnalyzingMarriage}
                        className={`group relative overflow-hidden px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isAnalyzingMarriage ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:from-amber-300 hover:to-amber-500 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)]"}`}
                      >
                        {isAnalyzingMarriage ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="animate-spin h-4 w-4 text-slate-400"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Đang phân tích...
                          </span>
                        ) : (
                          <>
                            <span className="relative z-10">
                              Phân tích hòa hợp
                            </span>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/10 transition-all group-hover:h-full group-active:bg-black/20"></div>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-4 bg-[#F2F2EB] border-b border-slate-100 sticky bottom-0 z-50 backdrop-blur-md">
                      <div className="relative">
                        <textarea
                          onFocus={(e) => {
                            setTimeout(() => {
                              e.target.scrollIntoView({
                                behavior: "smooth",
                                block: "end",
                              });
                            }, 300);
                          }}
                          className="w-full p-4 bg-slate-50/90 border border-slate-200 rounded-2xl text-[16px] md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all min-h-[100px] resize-none font-medium placeholder:text-slate-400"
                          style={{ scrollMarginBottom: "120px" }}
                          placeholder="Nhập câu hỏi cụ thể về sự hòa hợp của hai bạn (ví dụ: Hai tuổi này có phạm Tuyệt Mệnh không? Cách hóa giải xung khắc?)..."
                          value={marriageQuestion}
                          onChange={(e) => setMarriageQuestion(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50/30 min-h-[200px]">
                      {isAnalyzingMarriage && !marriageAiAnalysis ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                          <div className="flex gap-2">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                          </div>
                          <p className="text-sm text-amber-800 font-medium animate-pulse">
                            Đại Sư AI đang nghiên cứu sự hòa hợp của hai bạn...
                          </p>
                        </div>
                      ) : marriageAiAnalysis ? (
                        <div className="prose prose-amber max-w-none">
                          <div className="text-[13px] text-gray-800 font-medium markdown-body relative">
                            <Markdown>{marriageAiAnalysis}</Markdown>
                            {isAnalyzingMarriage && (
                              <div className="inline-block w-1.5 h-4 bg-amber-400 ml-1 animate-pulse align-middle"></div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <p className="text-gray-400 text-sm max-w-md">
                            Nhấn nút "Phân tích hòa hợp" để Đại Sư AI phân tích
                            chi tiết về sự tương hợp giữa hai người dựa trên Tứ
                            Trụ và Ngũ Hành.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </React.Fragment>
        )}
      </main>

      {showJieQiModal && typeof date.year === "number" && (
        <JieQiModal year={date.year} onClose={() => setShowJieQiModal(false)} />
      )}
      <AIChatAssistant
        userProfile={{
          name: date.name,
          year: date.year,
          month: date.month,
          day: date.day,
          hour: date.hour,
          gender: gender,
        }}
        onRequireApiKey={() => setShowSettings(true)}
      />
    </div>
  );
}
