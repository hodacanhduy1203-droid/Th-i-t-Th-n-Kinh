import { ThaiAtInput, ThaiAtChart, ThaiAtStar, ThaiAtPalaceInfo } from './types';
import { THAI_AT_16_PALACES, STAR_NAMES, THAI_AT_TO_16_PALACES, PALACES_RING_CLOCKWISE } from './constants';
import { Solar, Lunar } from 'lunar-javascript';

export class ThaiAtEngine {
  /**
   * Tính toán Tích Tuế và Kỷ Dư cho NĂM (Tuế Kể)
   * Phép Kể Năm (Trang 50-51)
   */
  static calcTueKe(lunarYear: number) {
    const tichTue = 10155916 + (lunarYear - 1999);
    let kyDu = tichTue % 360;
    if (kyDu === 0) kyDu = 360;
    const nguyen = Math.floor((kyDu - 1) / 72) + 1;
    let cuc = kyDu % 72;
    if (cuc === 0) cuc = 72;
    return { tichTue, kyDu, nguyen, cuc };
  }

  /**
   * Tính Nguyệt Kể theo trang 65-66 Thái Ất Thần Kinh
   */
  static calcNguyetKe(tuoKeKyDu: number, lunarMonth: number, isLeapMonth: boolean) {
    const tichThang = (tuoKeKyDu * 12) + 2 + (lunarMonth - 1); 
    let nguyetKyDu = tichThang % 360;
    if (nguyetKyDu === 0) nguyetKyDu = 360;
    const nguyenThang = Math.floor((nguyetKyDu - 1) / 72) + 1;
    let cucThang = nguyetKyDu % 72;
    if (cucThang === 0) cucThang = 72;
    return { tichThang, nguyetKyDu, nguyenThang, cucThang };
  }

  /**
   * Cập nhật Kể Giờ (Thời Kế) và Kể Ngày (Nhật Kế) theo lịch 
   */
  static calcNhatKeVaThoiKe(input: ThaiAtInput) {
    const solar = Solar.fromYmdHms(input.solarYear, input.solarMonth, input.solarDay, input.solarHour, 0, 0);
    const lunar = solar.getLunar();
    
    // Xác định Dương Cửu (từ Đông Chí đến trước Hạ Chí) và Âm Lục (từ Hạ Chí đến trước Đông Chí)
    const year = input.solarYear;
    
    // Tìm thời điểm Đông Chí (Dongzhi) và Hạ Chí (Xiazhi) của năm hiện tại
    const jieQiTable = lunar.getJieQiTable();
    
    // lunar-javascript's jieQiTable has names in Chinese
    const dongZhi = jieQiTable['冬至']; // Đông Chí
    const xiaZhi = jieQiTable['夏至'];   // Hạ Chí
    
    const currentDay = new Date(input.solarYear, input.solarMonth - 1, input.solarDay);
    let isYang = true;
    if (dongZhi && xiaZhi) {
      const dongZhiDate = new Date(dongZhi.getYear(), dongZhi.getMonth() - 1, dongZhi.getDay(), dongZhi.getHour(), dongZhi.getMinute());
      const xiaZhiDate = new Date(xiaZhi.getYear(), xiaZhi.getMonth() - 1, xiaZhi.getDay(), xiaZhi.getHour(), xiaZhi.getMinute());
      
      const currentTime = currentDay.getTime();
      
      // Nếu ngày hiện tại nằm trong khoảng [Đông Chí, Hạ Chí) -> Dương
      // Nếu [Hạ Chí, Đông Chí năm sau) -> Âm
      // Lưu ý: Đông Chí thường rơi vào cuối năm (tháng 12). 
      // Nếu đang ở đầu năm (trước Hạ Chí), thì mốc Đông Chí là của năm ngoái.
      
      if (currentTime >= xiaZhiDate.getTime()) {
        isYang = false; // Sau Hạ Chí là Âm Lục
      } else if (currentTime < dongZhiDate.getTime()) {
        // Nếu trước Đông Chí của năm nay (thường là tháng 12), nhưng sau Hạ Chí? 
        // Đã check sau Hạ Chí ở trên.
        // Vậy nếu trước Hạ Chí VÀ trước Đông Chí (tháng 1-6) -> Vẫn là Dương (vì kế thừa Đông Chí năm ngoái)
        isYang = true;
      }
    }
    
    // Mô phỏng số Tích Ngày theo chuẩn sách: (Năm - Năm gốc) * 365.25 + số ngày tích lũy
    // Gốc 1999
    const startOfYear = new Date(input.solarYear, 0, 0);
    const diff = currentDay.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    const daysSince1999 = Math.floor((input.solarYear - 1999) * 365.25) + dayOfYear;
    const tichNgay = 10155916 * 365 + daysSince1999; 
    let cucNgay = tichNgay % 72;
    if (cucNgay === 0) cucNgay = 72;

    // Tính Tích Giờ: [(Số ngày từ ngày gốc đến ngày xem − 1) × 12] + số giờ từ giờ Giáp Tý đến giờ cần xem.
    // Chuyển hour (0-23) thành 12 canh giờ (0=Tý, 1=Sửu, ..., 11=Hợi)
    const hourIdx = Math.floor((input.solarHour + 1) / 2) % 12;
    const tichGio = (tichNgay - 1) * 12 + hourIdx;
    
    let cucGio = tichGio % 72;
    if (cucGio === 0) cucGio = 72;

    return { 
      tichNgay, 
      cucNgay, 
      tichGio, 
      cucGio,
      isYang 
    };
  }

  /**
   * Get palace by moving steps along the 16 palaces ring
   */
  static movePalace(startCungId: string, steps: number, isClockwise: boolean = true): string {
    const idx = PALACES_RING_CLOCKWISE.indexOf(startCungId);
    if (idx === -1) return startCungId;
    
    const direction = isClockwise ? 1 : -1;
    let newIdx = (idx + steps * direction) % 16;
    if (newIdx < 0) newIdx += 16;
    
    return PALACES_RING_CLOCKWISE[newIdx];
  }

  /**
   * Lấy cung đối diện trong 16 cung (cách 8 cung)
   */
  static getOppositePalace(cungId: string): string {
    return this.movePalace(cungId, 8, true);
  }

  /**
   * Đặt sao Thái Ất
   */
  static anThaiAt(cuc: number, isYang: boolean): string {
    let rem24 = cuc % 24;
    if (rem24 === 0) rem24 = 24;
    
    const palaceIdx = Math.floor((rem24 - 1) / 3); // 0 đến 7
    
    const duongSequence = [1, 2, 3, 4, 6, 7, 8, 9];
    const amSequence = [9, 8, 7, 6, 4, 3, 2, 1];
    
    const htc = isYang ? duongSequence[palaceIdx] : amSequence[palaceIdx];
    return THAI_AT_TO_16_PALACES[htc];
  }

  /**
   * Đặt sao Văn Xương (Thiên Mục)
   */
  static anVanXuong(kyDu: number, isYang: boolean): string {
    let rem18 = kyDu % 18;
    if (rem18 === 0) rem18 = 18;
    
    const step = rem18 - 1;
    const startCung = isYang ? 't12' : 't4'; // Thân / Dần
    return this.movePalace(startCung, step, true); // Đều đi thuận 16 cung
  }

  /**
   * Đặt sao Khách Mục (Thủy Kích)
   */
  static anKhachMuc(kyDu: number, isYang: boolean): string {
    let rem16 = kyDu % 16;
    if (rem16 === 0) rem16 = 16;

    const step = rem16 - 1;
    const startCung = isYang ? 't1' : 't9'; // Tý / Ngọ
    return this.movePalace(startCung, step, true);
  }

  /**
   * Đặt 9 sao Trực Phù
   */
  static anTrucPhu(cucNgay: number, isYang: boolean): ThaiAtStar[] {
    const results: ThaiAtStar[] = [];
    const trucSao = [
      { id: 'truc_phu', name: STAR_NAMES.TRUC_PHU },
      { id: 'truc_su', name: STAR_NAMES.TRUC_SU },
      { id: 'truc_huu', name: STAR_NAMES.TRUC_HUU },
      { id: 'truc_ta', name: STAR_NAMES.TRUC_TA },
      { id: 'truc_trung', name: STAR_NAMES.TRUC_TRUNG },
      { id: 'truc_hau', name: STAR_NAMES.TRUC_HAU },
      { id: 'truc_tien', name: STAR_NAMES.TRUC_TIEN },
      { id: 'truc_mon', name: STAR_NAMES.TRUC_MON },
      { id: 'truc_noi', name: STAR_NAMES.TRUC_NOI },
    ];

    // Mô phỏng vị trí Trực Phù dựa vào cục hoặc can ngày
    // (tạm dùng số dư của cục Ngày % 10 làm Can)
    const canDay = cucNgay % 10;
    const startCung = isYang ? 't12' : 't4'; // Thân / Dần
    const posTrucPhu = this.movePalace(startCung, canDay, true);

    trucSao.forEach((sao, idx) => {
      // 9 sao xếp liên tiếp thuận chiều
      const palaceId = this.movePalace(posTrucPhu, idx, true);
      results.push({
        id: sao.id,
        name: sao.name,
        type: 'phu',
        palaceId: palaceId
      });
    });

    return results;
  }

  /**
   * Đặt 8 cửa Bát Môn Trực Sự
   * Tính theo Tuế Kế (Sách trang 92-95): Lấy Tuế Tích đem 240 trừ dần -> Tích Tuế % 240
   * Số dư trên 30 lấy 30 chia (tức là chia 30 lây phần nguyên + 1 để ra vị trí cửa).
   */
  static anBatMon(tichTue: number): Record<string, string> {
    const batMonStatus: Record<string, string> = {};
    const batMonNames = ['Khai', 'Hưu', 'Sinh', 'Thương', 'Đỗ', 'Cảnh', 'Tử', 'Kinh'];
    
    // Bài toán Bát môn Trực Sử (trang 92):
    // Tích Tuế % 240
    let du240 = tichTue % 240;
    if (du240 === 0) du240 = 240;
    
    // Mỗi cửa 30 năm
    // Vị trí cửa khởi điểm (Trực Sử)
    const cuaIdx = Math.floor((du240 - 1) / 30); // 0 đến 7 ứng với Khai -> Kinh
    
    // Dựa vào cung Khai (Càn - t15), Hưu (Khảm - t1), Sinh (Cấn - t3), Thương (Chấn - t5), Đỗ (Tốn - t7), Cảnh (Ly - t9), Tử (Khôn - t11), Kinh (Đoài - t13)
    const cungCua = ['t15', 't1', 't3', 't5', 't7', 't9', 't11', 't13'];
    
    // An 8 cửa vào 8 cung quái
    for (let i = 0; i < 8; i++) {
        const mon = batMonNames[(cuaIdx + i) % 8];
        const cung = cungCua[i];
        batMonStatus[cung] = mon;
    }
    
    return batMonStatus;
  }

  /**
   * Tính toán Thể thức: Tù - Ép - Chặn - Bách
   */
  static calcTheThuc(menhCung: string, thanCung: string, stars: ThaiAtStar[]): string[] {
    const theThuc = [];
    const khachMuc = stars.find(s => s.id === 'khach_muc');
    const daiDu = stars.find(s => s.id === 'dai_du');
    const tieuDu = stars.find(s => s.id === 'tieu_du');

    if (khachMuc && (khachMuc.palaceId === menhCung || this.getOppositePalace(khachMuc.palaceId as string) === menhCung)) {
      theThuc.push("Chặn: Mệnh bị Thủy Kích (Khách Mục) chặn, chủ về cản trở, thất bại.");
    }

    if (daiDu && tieuDu && (daiDu.palaceId === menhCung || tieuDu.palaceId === menhCung)) {
      theThuc.push("Bách: Mệnh bị bách bởi Đại Du/Tiểu Du, chủ về biến động lớn, thay đổi đột ngột.");
    }

    const gocPalaces = ['t15', 't3', 't7', 't11']; // Càn, Cấn, Tốn, Khôn
    if (gocPalaces.includes(menhCung)) {
      theThuc.push("Ép: Mệnh chịu cảnh Ép ở góc, chủ về áp lực, khó khăn hoặc bệnh tật.");
    }

    if (theThuc.length === 0) {
      theThuc.push("Bình hòa: Thể thức ổn định, không bị Tù-Ép-Chặn-Bách.");
    }

    return theThuc;
  }

  /**
   * Luận Binh Pháp / Trận Đồ
   */
  static calcBinhPhap(stars: ThaiAtStar[], menhCung: string): string {
    const chuToan = stars.find(s => s.id === 'chu_toan');
    const thaiAt = stars.find(s => s.id === 'thai_at');
    const khachMuc = stars.find(s => s.id === 'khach_muc');

    let isWin = false;
    // Nếu Chủ Toán hợp mệnh + Thái Ất không bị Thủy Kích bức
    if (chuToan && chuToan.palaceId === menhCung && khachMuc?.palaceId !== thaiAt?.palaceId) {
      isWin = true;
    }
    
    if (isWin) {
      return "Chủ thắng lợi: Quẻ Cát. Chủ Toán hợp Mệnh, Thái Ất vượng không bị Thủy Kích bức, quân nhà đại thắng, quốc thái dân an.";
    } else {
      return "Khách lấn Chủ: Quẻ Hung. Khách Toán đắc thế hoặc Thái Ất bị Thủy Kích chiếu, phòng ngừa binh biến, nội bộ gặp khó khăn.";
    }
  }

  /**
   * Giả lập điểm của 60 Hoa Giáp theo sách (trang 211)
   */
  static getHoaGiapScore(ganZhi: string): number {
    switch (ganZhi) {
      case 'Giáp Tuất': return 35;
      case 'Tân Mùi': return 43;
      case 'Giáp Tý': return 33;
      case 'Bính Dần': return 29;
      default: 
        // Logic giả định cho các ngày khác để không bị 0
        return 30 + (ganZhi.length % 15);
    }
  }

  /**
   * Hàm Core thực hiện việc an sao dựa vào các tham số thời gian
   */
  static calculateChart(input: ThaiAtInput): ThaiAtChart {
    const stars: ThaiAtStar[] = [];
    const palaces: Record<string, ThaiAtPalaceInfo> = {};
    
    THAI_AT_16_PALACES.forEach(p => {
      palaces[p.id] = { id: p.id, name: p.name, stars: [], isMenh: false, isThan: false };
    });

    const { tichTue, kyDu, nguyen, cuc } = this.calcTueKe(input.lunarYear);
    const { tichNgay, cucNgay, tichGio, cucGio, isYang } = this.calcNhatKeVaThoiKe(input);

    const solar = Solar.fromYmdHms(input.solarYear, input.solarMonth, input.solarDay, input.solarHour, 0, 0);
    const lunar = solar.getLunar();

    // 0. Tính Tổng Số (Năm + Tháng + Ngày + Giờ)
    const tongSoKe = this.getHoaGiapScore(lunar.getYearInGanZhi()) +
                     this.getHoaGiapScore(lunar.getMonthInGanZhi()) +
                     this.getHoaGiapScore(lunar.getDayInGanZhi()) +
                     this.getHoaGiapScore(lunar.getTimeInGanZhi());

    // 1. Xác định Mệnh Cung và Thân Cung (Nhân Mệnh Kể Ngày) theo trang 214-216
    const isYangYear = ["Giáp", "Bính", "Mậu", "Canh", "Nhâm"].includes(lunar.getYearGan());
    const isMale = input.gender === 'nam';
    const isClockwise = (isYangYear && isMale) || (!isYangYear && !isMale); // Dương Nam, Âm Nữ đi thuận

    const BRANCHES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    const CHI_TO_PALACE: Record<string, string> = {
      'Tý': 't1', 'Sửu': 't2', 'Dần': 't4', 'Mão': 't5', 'Thìn': 't6', 'Tỵ': 't8', 
      'Ngọ': 't9', 'Mùi': 't10', 'Thân': 't12', 'Dậu': 't13', 'Tuất': 't14', 'Hợi': 't16'
    };

    const yearChiIdx = BRANCHES.indexOf(lunar.getYearZhi());
    const monthNum = lunar.getMonth(); // 1..12
    const hourIdx = BRANCHES.indexOf(lunar.getTimeZhi());

    // Khởi từ chi năm, cộng (tháng - 1)
    const startIdx = (yearChiIdx + monthNum - 1) % 12;
    // Đếm thuận/nghịch số giờ sinh (chú ý số giờ 0 tới 11)
    const menhZhiIdx = isClockwise ? (startIdx + hourIdx) % 12 : (startIdx - hourIdx + 12) % 12;
    
    const menhCung = CHI_TO_PALACE[BRANCHES[menhZhiIdx]];
    const thanCung = this.getOppositePalace(menhCung);

    palaces[menhCung].isMenh = true;
    palaces[thanCung].isThan = true;

    // 2. An 12 Cung Phụ (Huynh, Phu/Thê, Tử...)
    const CUNG_PHU_NAMES = ['Mệnh', 'Huynh Đệ', input.gender === 'nam' ? 'Thê Thiếp' : 'Phu Quân', 'Tử Tức', 'Tài Bạch', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc', 'Tật Ách', 'Phúc Đức', 'Tướng Mạo', 'Phụ Mẫu'];
    const CHI_PALACES = ['t1','t2','t4','t5','t6','t8','t9','t10','t12','t13','t14','t16'];
    const startChiIdx = CHI_PALACES.indexOf(menhCung);
    
    CUNG_PHU_NAMES.forEach((name, idx) => {
        const palaceIdx = isClockwise ? (startChiIdx + idx) % 12 : (startChiIdx - idx + 12) % 12;
        const pId = CHI_PALACES[palaceIdx];
        if (palaces[pId]) palaces[pId].cungPhu = name;
    });

    // 3. Thái Ất Thời Kế
    const thaiAtCung = this.anThaiAt(cucGio, isYang);
    stars.push({
      id: 'thai_at',
      name: STAR_NAMES.THAI_AT,
      type: 'chinh',
      palaceId: thaiAtCung
    });

    // 2. Thiên Mục / Văn Xương
    const vanXuongCung = this.anVanXuong(tichGio % 360, isYang);
    stars.push({
      id: 'van_xuong',
      name: STAR_NAMES.THIEN_MUC,
      type: 'chinh',
      palaceId: vanXuongCung
    });

    // 3. Khách Mục / Thủy Kích
    const khachMucCung = this.anKhachMuc(tichGio % 360, isYang);
    stars.push({
      id: 'khach_muc',
      name: STAR_NAMES.KHACH_MUC,
      type: 'chinh',
      palaceId: khachMucCung
    });

    // 4. Chủ Toán & Khách Toán
    stars.push({
      id: 'chu_toan',
      name: STAR_NAMES.CHU_TOAN,
      type: 'chinh',
      palaceId: menhCung
    });

    stars.push({
      id: 'khach_toan',
      name: STAR_NAMES.KHACH_TOAN,
      type: 'chinh',
      palaceId: thanCung
    });

    // 5. Đại Du & Tiểu Du
    // Đại Du khởi Càn (t15) Dương / Tốn (t7) Âm
    const daiDuStart = isYang ? 't15' : 't7';
    const daiDuCung = this.movePalace(daiDuStart, cucGio % 16, isYang); // Dịch chuyển theo Cục Giờ
    stars.push({
      id: 'dai_du',
      name: STAR_NAMES.DAI_DU,
      type: 'du',
      palaceId: daiDuCung
    });

    // Tiểu Du khởi Khôn (t11)
    const tieuDuCung = this.movePalace('t11', cucGio % 16, isYang);
    stars.push({
      id: 'tieu_du',
      name: STAR_NAMES.TIEU_DU,
      type: 'du',
      palaceId: tieuDuCung
    });

    // 6. Trực Phù (9 sao)
    const trucPhuStars = this.anTrucPhu(cucNgay, isYang);
    stars.push(...trucPhuStars);

    // Bát Môn (Tính theo Tích Tuế)
    const batMonStatus = this.anBatMon(tichTue);

    // 7. Đại Tướng & Tiểu Tướng
    // Đại Tướng an tại cung Mệnh (Kể Ngày)
    const daiTuongCung = menhCung;
    stars.push({
      id: 'dai_tuong',
      name: STAR_NAMES.DAI_TUONG,
      type: 'chinh',
      palaceId: daiTuongCung
    });

    // Tiểu Tướng cách Đại Tướng 3 cung theo chiều (thuận/nghịch)
    const tieuTuongCung = this.movePalace(daiTuongCung, 3, isYang);
    stars.push({
      id: 'tieu_tuong',
      name: STAR_NAMES.TIEU_TUONG,
      type: 'chinh',
      palaceId: tieuTuongCung
    });


    // Cập nhật lại vào palaces
    stars.forEach(star => {
      if (palaces[star.palaceId]) {
        palaces[star.palaceId].stars.push(star);
      }
    });

    Object.keys(batMonStatus).forEach(cungId => {
      if (palaces[cungId]) {
        palaces[cungId].batMon = batMonStatus[cungId];
      }
    });

    const theThuc = this.calcTheThuc(menhCung, thanCung, stars);
    const binhPhap = this.calcBinhPhap(stars, menhCung);

    // Mô phỏng Đại Vận (8 năm / vận) và Tiểu Vận (1 năm)
    const daiVan = [
      { startAge: 1, endAge: 8, palaceId: menhCung },
      { startAge: 9, endAge: 16, palaceId: this.movePalace(menhCung, 1, true) },
      { startAge: 17, endAge: 24, palaceId: this.movePalace(menhCung, 2, true) },
    ];
    
    const tieuVan = [
      { year: input.solarYear, palaceId: menhCung }
    ];

    return {
      tichTue, kyDu, nguyen, cuc,
      tichGio, cucGio, tongSoKe,
      stars, palaces, menhCung, thanCung, daiVan, tieuVan, theThuc, binhPhap
    };
  }
}

