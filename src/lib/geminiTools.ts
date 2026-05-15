import { FunctionDeclaration, Type } from "@google/genai";
import { Solar, Lunar } from "lunar-javascript";
import { calculateTuVi } from "./tuviLogic";

export const getLunarInfoTool: FunctionDeclaration = {
  name: "get_lunar_info",
  description: "Lấy thông tin âm lịch, bát tự (can chi), trực, tú, tiết khí, các sao cát hung của một ngày giờ dương lịch. Rất hữu ích khi Xem Ngày hoặc Lập quẻ Kỳ Môn, Thái Ất, Bát Quái, Tứ Trụ.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.NUMBER },
      month: { type: Type.NUMBER },
      year: { type: Type.NUMBER },
      hour: { type: Type.NUMBER, description: "Giờ (0-23)" },
      minute: { type: Type.NUMBER, description: "Phút (0-59)" },
    },
    required: ["day", "month", "year", "hour", "minute"],
  }
};

export const getTuViTool: FunctionDeclaration = {
  name: "get_tu_vi",
  description: "Lấy lá số Tử Vi (Vị trí 14 Chính tinh, các sao phụ, Cung mệnh/thân, Cục, Vòng Trường sinh...) của một người dựa trên ngày tháng năm sinh dương lịch.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.NUMBER, description: "Ngày sinh dương lịch" },
      month: { type: Type.NUMBER, description: "Tháng sinh dương lịch" },
      year: { type: Type.NUMBER, description: "Năm sinh dương lịch" },
      hour: { type: Type.NUMBER, description: "Giờ sinh (0-23)" },
      minute: { type: Type.NUMBER, description: "Phút sinh (0-59)" },
      gender: { type: Type.STRING, description: "'M' cho nam, 'F' cho nữ" },
      viewingYear: { type: Type.NUMBER, description: "Năm xem hạn (mặc định là năm nay)" }
    },
    required: ["day", "month", "year", "hour", "minute", "gender"],
  }
};

export const executeGetLunarInfo = (arg: {day: number, month: number, year: number, hour: number, minute: number}) => {
  try {
    const day = arg.day || new Date().getDate();
    const month = arg.month || (new Date().getMonth() + 1);
    const year = arg.year || new Date().getFullYear();
    const hour = arg.hour || new Date().getHours();
    const minute = arg.minute || new Date().getMinutes();
    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
    const lunar = solar.getLunar();
    
    return JSON.stringify({
      solarDate: `${year}-${month}-${day} ${hour}:${minute}`,
      lunarDate: `${lunar.getYear()}-${lunar.getMonth()}-${lunar.getDay()} ${lunar.getTimeZhi()} Thời`,
      ganZhi: `${lunar.getYearInGanZhi()} ${lunar.getMonthInGanZhi()} ${lunar.getDayInGanZhi()} ${lunar.getTimeInGanZhi()}`,
      jieQi: lunar.getJieQi(),
      tianShen: lunar.getDayTianShen(),
      zhiXing: typeof lunar.getZhiXing === "function" ? lunar.getZhiXing() : null,
      xiu: lunar.getXiu(),
      liuYao: lunar.getLiuYao(),
      caiShen: lunar.getPositionCaiDesc(),
      xiShen: lunar.getPositionXiDesc(),
      fuShen: lunar.getPositionFuDesc(),
      yi: lunar.getDayYi(),
      ji: lunar.getDayJi(),
      jiShen: lunar.getDayJiShen(),
      xiongSha: lunar.getDayXiongSha(),
      chong: lunar.getDayChongGan() + lunar.getDayChong(),
      sha: lunar.getDaySha(),
      nineStarYear: lunar.getYearNineStar().toString(),
      nineStarMonth: lunar.getMonthNineStar().toString(),
      nineStarDay: lunar.getDayNineStar().toString()
    });
  } catch (err: any) {
    return JSON.stringify({ error: err.message });
  }
};

export const executeGetTuVi = (arg: {day: number, month: number, year: number, hour: number, minute?: number, gender: 'M'|'F', viewingYear?: number}) => {
  try {
    const day = arg.day || new Date().getDate();
    const month = arg.month || (new Date().getMonth() + 1);
    const year = arg.year || new Date().getFullYear();
    const hour = arg.hour || new Date().getHours();
    const gender = arg.gender || 'M';
    const curYear = arg.viewingYear || new Date().getFullYear();
    const result = calculateTuVi(year, month, day, hour, gender, curYear);
    
    // simplify result so it won't exceed context easily, but actually TuVi data is reasonable size
    const summary = {
      info: result.lunarInfo,
      cuc: result.cuc,
      menh: result.menh,
      than: result.chuThan,
      cells: result.cells.map((cell: any, idx: number) => ({
        index: idx,
        name: cell.cung,
        isMenh: result.menh === cell.cung,
        isThan: cell.isThan,
        chinhTinh: cell.chinhTinh,
        goodPhuTinh: cell.phuTinh,
        hanGoc: cell.daiHan,
        truongSinh: cell.trangSinh
      }))
    };
    return JSON.stringify(summary);
  } catch (err: any) {
    return JSON.stringify({ error: err.message });
  }
};
