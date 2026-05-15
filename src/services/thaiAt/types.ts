export interface ThaiAtInput {
  solarYear: number;
  solarMonth: number;
  solarDay: number;
  solarHour: number; // 0-23
  lunarYear: number;
  lunarMonth?: number;
  lunarDay?: number;
  isLeapMonth?: boolean;
  gender: 'nam' | 'nu';
  timezone?: number; // default +7
}

export interface ThaiAtStar {
  id: string;
  name: string;
  type: 'chinh' | 'phu' | 'du'; // Chính tinh / Phụ tinh / Du tinh
  palaceId: string | number; // ID của 1 trong 16 cung
  state?: string; // Miếu, Vượng, Đắc, Hãm...
  description?: string;
}

export interface ThaiAtPalaceInfo {
  id: string | number;
  name: string;
  stars: ThaiAtStar[];
  isMenh: boolean;
  isThan: boolean;
  batMon?: string; // Khai, Hưu, Sinh...
  cungPhu?: string; // Tên 12 cung vòng đời
}

export interface ThaiAtChart {
  // Thông số cơ bản
  tichTue: number;
  kyDu: number;
  nguyen: number; // Thượng, Trung, Hạ
  cuc: number;
  
  tichGio: number;
  cucGio: number;
  tongSoKe: number;

  // Các sao và cung
  stars: ThaiAtStar[];
  palaces: Record<string, ThaiAtPalaceInfo>;
  
  menhCung: string;
  thanCung: string;
  
  // Vận hạn
  daiVan: unknown[];
  tieuVan: unknown[];
  
  // Thể thức và Luận Giải
  theThuc: string[];
  binhPhap: string;
}
