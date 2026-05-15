import { Solar } from 'lunar-javascript';

export const ZODIACS = ["Tí", "Sửu", "Dần", "Mão", "Thìn", "Tị", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
export const STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];

const mod12 = (n: number) => ((n % 12) + 12) % 12;

export function getHourIndex(hour: number) {
  if (hour === 23 || hour === 0) return 0;
  return Math.floor((hour + 1) / 2);
}

export function calculateTuVi(solarYear: number, solarMonth: number, solarDay: number, hour: number, gender: 'M' | 'F', viewingYear: number = new Date().getFullYear()) {
  const solar = Solar.fromYmd(solarYear, solarMonth, solarDay);
  const lunar = solar.getLunar();
  const lunarMonth = Math.abs(lunar.getMonth());
  const lunarDay = lunar.getDay();
  
  const yearCan = lunar.getYearGanIndex(); // 0: Giap ... 9: Quy
  const yearChi = lunar.getYearZhiIndex(); // 0: Ti ... 11: Hoi
  const birthLunarYear = lunar.getYear();
  
  const hourIndex = getHourIndex(hour);

  const isThuan = (gender === 'M' && yearCan % 2 === 0) || (gender === 'F' && yearCan % 2 === 1);

  // Mệnh & Thân
  const monthPos = mod12(2 + (lunarMonth - 1)); // Dần = 2
  const menhPos = mod12(monthPos - hourIndex);
  const thanPos = mod12(monthPos + hourIndex);

  // Cục
  const canOfDan = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0][yearCan];
  const menhCan = (canOfDan + menhPos - 2 + 10) % 10;
  const canNapAm = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
  const chiNapAm = [1, 1, 2, 2, 3, 3, 1, 1, 2, 2, 3, 3];
  let sum = canNapAm[menhCan] + chiNapAm[menhPos];
  if (sum > 5) sum -= 5;
  const cucMap: Record<number, { val: number, name: string }> = { 
    1: { val: 3, name: 'Mộc Tam Cục' }, 
    2: { val: 4, name: 'Kim Tứ Cục' }, 
    3: { val: 2, name: 'Thủy Nhị Cục' }, 
    4: { val: 6, name: 'Hoả Lục Cục' }, 
    5: { val: 5, name: 'Thổ Ngũ Cục' } 
  };
  const cuc = cucMap[sum as keyof typeof cucMap];

  // Tử Vi
  let x = 0;
  while ((lunarDay + x) % cuc.val !== 0) {
    x++;
  }
  const quotient = Math.floor((lunarDay + x) / cuc.val);
  let tuViPos = 2 + (quotient - 1);
  if (x % 2 === 1) {
    tuViPos -= x;
  } else {
    tuViPos += x;
  }
  tuViPos = mod12(tuViPos);

  const thienPhuPos = mod12(16 - tuViPos);

  const cungNames = [
    "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", 
    "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", 
    "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"
  ];
  
  const cells = Array.from({ length: 12 }, (_, i) => {
    const hanhs = ["Thủy", "Thổ", "Mộc", "Mộc", "Thổ", "Hỏa", "Hỏa", "Thổ", "Kim", "Kim", "Thổ", "Thủy"];
    return {
      cung: '',
      canChi: '',
      daiHan: 0,
      trangSinh: '',
      isThan: false,
      chinhTinh: [] as string[],
      phuTinh: [] as string[],
      tuanTriet: [] as string[],
      cungHanh: hanhs[i],
    };
  });

  // Gán tên Cung (Clockwise từ Mệnh: Mệnh, Phụ, Phúc...)
  for (let i = 0; i < 12; i++) {
    const pos = mod12(menhPos + i);
    cells[pos].cung = cungNames[i];
    if (pos === thanPos) cells[pos].isThan = true;
  }

  // Gán Đại hạn (Thuận/Nghịch theo Dương Nam Âm Nữ)
  for (let i = 0; i < 12; i++) {
    const pos = isThuan ? mod12(menhPos + i) : mod12(menhPos - i);
    cells[pos].daiHan = cuc.val + i * 10;
  }

  // Can Chi cho từng cung (Tháng Dần là index 2 luôn luôn bắt đầu trước)
  for (let i = 0; i < 12; i++) {
    const cungCanIndex = (canOfDan + i - 2 + 10) % 10;
    cells[i].canChi = `${STEMS[cungCanIndex]} ${ZODIACS[i]}`;
  }

  // Add Star helper
  const addStar = (pos: number, star: string, type: 'chinhTinh'|'phuTinh') => {
    cells[mod12(pos)][type].push(star);
  };

  // Vòng Tử Vi
  addStar(tuViPos, 'Tử Vi', 'chinhTinh');
  addStar(tuViPos - 1, 'Thiên Cơ', 'chinhTinh');
  addStar(tuViPos - 3, 'Thái Dương', 'chinhTinh');
  addStar(tuViPos - 4, 'Vũ Khúc', 'chinhTinh');
  addStar(tuViPos - 5, 'Thiên Đồng', 'chinhTinh');
  addStar(tuViPos - 8, 'Liêm Trinh', 'chinhTinh');

  // Vòng Thiên Phủ
  addStar(thienPhuPos, 'Thiên Phủ', 'chinhTinh');
  addStar(thienPhuPos + 1, 'Thái Âm', 'chinhTinh');
  addStar(thienPhuPos + 2, 'Tham Lang', 'chinhTinh');
  addStar(thienPhuPos + 3, 'Cự Môn', 'chinhTinh');
  addStar(thienPhuPos + 4, 'Thiên Tướng', 'chinhTinh');
  addStar(thienPhuPos + 5, 'Thiên Lương', 'chinhTinh');
  addStar(thienPhuPos + 6, 'Thất Sát', 'chinhTinh');
  addStar(thienPhuPos + 10, 'Phá Quân', 'chinhTinh');

  // Lộc Tồn and Kình Đà
  const locTonMap = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
  const locTonPos = locTonMap[yearCan];
  addStar(locTonPos, 'Lộc Tồn', 'phuTinh');
  addStar(locTonPos + 1, 'Kình Dương', 'phuTinh'); // Always +1 mapping (forward)
  addStar(locTonPos - 1, 'Đà La', 'phuTinh'); // Always -1 mapping (backward)

  // Bác Sĩ (from Lộc Tồn)
  const bacSiNames = ["Bác Sĩ", "Lực Sĩ", "Thanh Long", "Tiểu Hao", "Tướng Quân", "Tấu Thư", "Phi Liêm", "Hỷ Thần", "Bệnh Phù", "Đại Hao", "Phục Binh", "Quan Phủ"];
  for (let i = 0; i < 12; i++) {
    const pos = isThuan ? locTonPos + i : locTonPos - i;
    addStar(pos, bacSiNames[i], 'phuTinh');
  }

  // Khôi Việt (Tuvilotuyen chuẩn Giáp Mậu Canh Sửu Mùi)
  const khoiMap = [1, 0, 11, 11, 1, 0, 1, 6, 3, 3];
  const vietMap = [7, 8,  9,  9, 7, 8, 7, 2, 5, 5];
  addStar(khoiMap[yearCan], 'Thiên Khôi', 'phuTinh');
  addStar(vietMap[yearCan], 'Thiên Việt', 'phuTinh');

  // Xương Khúc
  addStar(10 - hourIndex, 'Văn Xương', 'phuTinh');
  addStar(4 + hourIndex, 'Văn Khúc', 'phuTinh');

  // Không Kiếp
  addStar(11 + hourIndex, 'Địa Kiếp', 'phuTinh');
  addStar(11 - hourIndex, 'Địa Không', 'phuTinh');

  // Tả Hữu
  addStar(4 + (lunarMonth - 1), 'Tả Phụ', 'phuTinh');
  addStar(10 - (lunarMonth - 1), 'Hữu Bật', 'phuTinh');

  // Linh Hỏa
  let hoaStart, linhStart;
  const chiGroup = [4, 0, 8].includes(yearChi) ? 1 : // Thân Tý Thìn
                   [2, 6, 10].includes(yearChi) ? 2 : // Dần Ngọ Tuất
                   [5, 9, 1].includes(yearChi) ? 3 : // Tỵ Dậu Sửu
                   4; // Hợi Mão Mùi
  if (chiGroup === 2) { hoaStart = 1; linhStart = 3; }
  else if (chiGroup === 1) { hoaStart = 2; linhStart = 10; }
  else if (chiGroup === 3) { hoaStart = 3; linhStart = 10; }
  else { hoaStart = 9; linhStart = 10; }
  addStar(isThuan ? hoaStart + hourIndex : hoaStart - hourIndex, 'Hỏa Tinh', 'phuTinh');
  addStar(isThuan ? linhStart - hourIndex : linhStart + hourIndex, 'Linh Tinh', 'phuTinh'); // Linh is opposite

  // Thái Tuế
  const thaiTueNames = ["Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", "Tử Phù", "Tuế Phá", "Long Đức", "Bạch Hổ", "Phúc Đức", "Điếu Khách", "Trực Phù"];
  for (let i = 0; i < 12; i++) {
    addStar(mod12(yearChi + i), thaiTueNames[i], 'phuTinh');
  }

  // --- STANDARD MINOR STARS INJECTION ---
  
  // Thiên Mã, Đào Hoa, Kiếp Sát, Hoa Cái, Phá Toái
  const maMap = [2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5];
  const daoHoaMap = [9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3, 0];
  const kiepSatMap = [5, 2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8];
  const hoaCaiMap = [4, 1, 10, 7, 4, 1, 10, 7, 4, 1, 10, 7];
  const phaToaiMap = [5, 1, 9, 5, 1, 9, 5, 1, 9, 5, 1, 9];
  
  addStar(maMap[yearChi], 'Thiên Mã', 'phuTinh');
  addStar(daoHoaMap[yearChi], 'Đào Hoa', 'phuTinh');
  addStar(kiepSatMap[yearChi], 'Kiếp Sát', 'phuTinh');
  addStar(hoaCaiMap[yearChi], 'Hoa Cái', 'phuTinh');
  addStar(phaToaiMap[yearChi], 'Phá Toái', 'phuTinh');

  // Cô Thần, Quả Tú
  const coThanMap = [2, 2, 5, 5, 5, 8, 8, 8, 11, 11, 11, 2];
  const quaTuMap = [10, 10, 1, 1, 1, 4, 4, 4, 7, 7, 7, 10];
  addStar(coThanMap[yearChi], 'Cô Thần', 'phuTinh');
  addStar(quaTuMap[yearChi], 'Quả Tú', 'phuTinh');

  // Thiên Khốc, Thiên Hư, Thiên Không
  addStar(mod12(6 - yearChi), 'Thiên Khốc', 'phuTinh');
  addStar(mod12(6 + yearChi), 'Thiên Hư', 'phuTinh');
  addStar(mod12(yearChi + 1), 'Thiên Không', 'phuTinh');

  // Đẩu Quân
  addStar(mod12(yearChi - lunarMonth + 1 + hourIndex), 'Đẩu Quân', 'phuTinh');
  
  // Hồng Loan, Thiên Hỷ
  const hongLoanPos = mod12(3 - yearChi);
  addStar(hongLoanPos, 'Hồng Loan', 'phuTinh');
  addStar(mod12(hongLoanPos + 6), 'Thiên Hỷ', 'phuTinh');

  // Thiên Riêu, Thiên Y, Thiên Hình
  addStar(mod12(1 + lunarMonth - 1), 'Thiên Riêu', 'phuTinh');
  addStar(mod12(1 + lunarMonth - 1), 'Thiên Y', 'phuTinh');
  addStar(mod12(9 + lunarMonth - 1), 'Thiên Hình', 'phuTinh');

  // Long Trì, Phượng Các, Giải Thần
  addStar(mod12(4 + yearChi), 'Long Trì', 'phuTinh');
  addStar(mod12(10 - yearChi), 'Phượng Các', 'phuTinh');
  addStar(mod12(10 - yearChi), 'Giải Thần', 'phuTinh');

  // Thai Phụ, Phong Cáo
  const vanKhucPos = mod12(4 + hourIndex);
  addStar(mod12(vanKhucPos + 2), 'Thai Phụ', 'phuTinh');
  addStar(mod12(vanKhucPos - 2), 'Phong Cáo', 'phuTinh');

  // Đường Phù, Quốc Ấn
  addStar(mod12(locTonPos + 5), 'Đường Phù', 'phuTinh');
  addStar(mod12(locTonPos + 8), 'Quốc Ấn', 'phuTinh');

  // Thiên La, Địa Võng, Thiên Thương, Thiên Sứ
  addStar(4, 'Thiên La', 'phuTinh'); // Thìn
  addStar(10, 'Địa Võng', 'phuTinh'); // Tuất
  addStar(mod12(menhPos + 5), 'Thiên Thương', 'phuTinh'); // Cung Nô
  addStar(mod12(menhPos + 7), 'Thiên Sứ', 'phuTinh'); // Cung Tật Ách

  // Tam Thai, Bát Tọa, Ân Quang, Thiên Quý
  const taPhuPos = mod12(4 + lunarMonth - 1);
  const huuBatPos = mod12(10 - lunarMonth + 1);
  const vanXuongPos = mod12(10 - hourIndex);
  
  addStar(mod12(taPhuPos + lunarDay - 1), 'Tam Thai', 'phuTinh');
  addStar(mod12(huuBatPos - lunarDay + 1), 'Bát Tọa', 'phuTinh');
  addStar(mod12(vanXuongPos + lunarDay - 2), 'Ân Quang', 'phuTinh');
  addStar(mod12(vanKhucPos - lunarDay + 2), 'Thiên Quý', 'phuTinh');

  // Thiên Quan, Thiên Phúc, Lưu Hà, Thiên Trù
  const thienQuanMap = [7, 4, 5, 2, 3, 9, 11, 9, 10, 6];
  const thienPhucMap = [9, 8, 0, 11, 3, 2, 6, 5, 6, 5];
  const luuHaMap = [9, 10, 7, 8, 5, 6, 4, 3, 11, 2]; // Giáp Dậu, Ất Tuất, Bính Mùi, Đinh Thân, Mậu Tỵ, Kỷ Ngọ, Canh Thìn, Tân Mão, Nhâm Hợi, Quý Dần
  const thienTruMap = [5, 6, 0, 5, 6, 8, 2, 6, 9, 11];

  addStar(thienQuanMap[yearCan], 'Thiên Quan', 'phuTinh');
  addStar(thienPhucMap[yearCan], 'Thiên Phúc', 'phuTinh');
  addStar(luuHaMap[yearCan], 'Lưu Hà', 'phuTinh');
  addStar(thienTruMap[yearCan], 'Thiên Trù', 'phuTinh');

  // Thiên Tài, Thiên Thọ
  addStar(mod12(menhPos + yearChi), 'Thiên Tài', 'phuTinh');
  addStar(mod12(thanPos + yearChi), 'Thiên Thọ', 'phuTinh');

  // Tuần Triệt
  const targetTuan = mod12(yearChi - yearCan);
  const tuan1 = mod12(targetTuan - 1);
  const tuan2 = mod12(targetTuan - 2);
  cells[tuan1].tuanTriet.push('Tuần');
  cells[tuan2].tuanTriet.push('Tuần');

  const trietStarts = [8, 6, 4, 2, 0]; // Giáp-8, Ất-6, Bính-4, Đinh-2, Mậu-0
  const trietBase = trietStarts[yearCan % 5];
  cells[trietBase].tuanTriet.push('Triệt');
  cells[trietBase + 1].tuanTriet.push('Triệt');

  // Vòng Tràng Sinh
  // Vị trí Tràng Sinh theo Cục: Thủy(8), Mộc(11), Kim(5), Thổ(8), Hỏa(2)
  const trangSinhByCuc: Record<number, number> = {
    2: 8, // Thủy Nhị Cục -> Thân
    3: 11, // Mộc Tam Cục -> Hợi
    4: 5, // Kim Tứ Cục -> Tỵ
    5: 8, // Thổ Ngũ Cục -> Thân
    6: 2 // Hỏa Lục Cục -> Dần
  };
  const trangSinhPos = trangSinhByCuc[cuc.val];
  const trangSinhNames = ["Trường Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"];
  
  // Nam thuận, Nữ nghịch vs Âm Dương Nam Nữ => Nam Dương thuận, Nam Âm nghịch. Nữ Dương nghịch, Nữ Âm thuận (Same as isThuan).
  for (let i = 0; i < 12; i++) {
    const pos = isThuan ? trangSinhPos + i : trangSinhPos - i;
    cells[mod12(pos)].trangSinh = trangSinhNames[i];
  }

  // Tứ Hóa (Lộc, Quyền, Khoa, Kỵ) theo trang Tuvilotuyen.vn
  const tuHoaNames = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'];
  const tuHoaMap = [
    ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'], // Giáp
    ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'], // Ất
    ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'], // Bính
    ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'], // Đinh
    ['Tham Lang', 'Thái Âm', 'Hữu Bật', 'Thiên Cơ'], // Mậu (Tuvilotuyen: Tham Nguyệt Hữu Cơ)
    ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'], // Kỷ
    ['Thái Dương', 'Vũ Khúc', 'Thái Âm', 'Thiên Đồng'], // Canh (Tuvilotuyen: Nhật Vũ Âm Đồng)
    ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'], // Tân
    ['Thiên Lương', 'Tử Vi', 'Tả Phụ', 'Vũ Khúc'], // Nhâm (Tuvilotuyen: Lương Tử Phụ Vũ)
    ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang'], // Quý
  ];

  const yearTuHoa = tuHoaMap[yearCan];
  yearTuHoa.forEach((starTarget, idx) => {
    // Find where the target star is and prepend the Tu Hoa
    for (let i = 0; i < 12; i++) {
        if (cells[i].chinhTinh.includes(starTarget) || cells[i].phuTinh.includes(starTarget)) {
            cells[i].phuTinh.push(tuHoaNames[idx]);
            break;
        }
    }
  });

  // Calculate Viewing Year Transits (Tiểu Vận / Lưu Niên)
  const viewingYearCan = ((viewingYear - 4) % 10 + 10) % 10;
  const viewingYearChi = ((viewingYear - 4) % 12 + 12) % 12;
  const viewingAge = viewingYear - birthLunarYear + 1;

  // Cung Đại Vận Index
  let cungDaiVanIndex = -1;
  for (let i = 0; i < 12; i++) {
    const dh = cells[i].daiHan;
    if (viewingAge >= dh && viewingAge < dh + 10) {
      cungDaiVanIndex = i;
      break;
    }
  }
  if (cungDaiVanIndex === -1) {
     cungDaiVanIndex = menhPos; // default to Mệnh if not started.
  }

  // Cung Tiểu Vận Index
  const tieuVanTyPosMap = {
    8: 10, 0: 10, 4: 10, // Thân Tý Thìn -> Tuất (10)
    2: 4, 6: 4, 10: 4,   // Dần Ngọ Tuất -> Thìn (4)
    5: 7, 9: 7, 1: 7,    // Tỵ Dậu Sửu -> Mùi (7)
    11: 1, 3: 1, 7: 1    // Hợi Mão Mùi -> Sửu (1)
  };
  const tieuVanTyPos = tieuVanTyPosMap[yearChi as keyof typeof tieuVanTyPosMap];
  // Khoảng cách từ CHI năm sinh đến CHI năm cần xem
  const yearsOffset = mod12(viewingYearChi - yearChi);
  
  // Chiều đếm: Nam Thuận, Nữ Nghịch (luật bài Tiểu Vận)
  // Bắt đầu đặt Chi của năm sinh tại cung tieuVanTyPos
  const offsetTieuVan = gender === 'M' ? yearsOffset : -yearsOffset;
  const cungTieuVanIndex = mod12(tieuVanTyPos + offsetTieuVan);

  // Lưu Đại Vận
  let luuDaiVanIndex = cungDaiVanIndex;
  const ageStart = cells[cungDaiVanIndex].daiHan;
  const ageInDaiHan = viewingAge - ageStart; // Số năm tính từ đầu đại vận (0-indexed)

  if (ageInDaiHan === 1) {
    // Năm thứ 2 ở cung xung chiếu
    luuDaiVanIndex = mod12(cungDaiVanIndex + 6);
  } else if (ageInDaiHan > 1) {
    // Từ năm thứ 3 trở đi
    // Nam: Tiến 1 từ xung chiếu. Nữ: Lùi 1 từ xung chiếu.
    const step3 = gender === 'M' ? 1 : -1;
    const year3Base = mod12(cungDaiVanIndex + 6 + step3);
    
    // Sau đó đi theo chiều của Đại Hạn (Dương Nam Âm Nữ thuận, ngược lại nghịch)
    // Nhưng user ví dụ: Âm Nam đi nghịch đại vận (Mão->Tý), 36 là Mùi (tiến 1), sau đó lùi (Mùi->Ngọ->Tị->Thìn->Mão)
    // Tức là sau bước N+2, đi tiếp theo chiều của Đại Hạn.
    const periodDirection = isThuan ? 1 : -1;
    luuDaiVanIndex = mod12(year3Base + (ageInDaiHan - 2) * periodDirection);
  }

  // Lưu Tứ Hóa
  const luuTuHoaNames = ['Lưu Hóa Lộc', 'Lưu Hóa Quyền', 'Lưu Hóa Khoa', 'Lưu Hóa Kỵ'];
  const luuTuHoa = tuHoaMap[viewingYearCan];
  luuTuHoa.forEach((starTarget, idx) => {
    for (let i = 0; i < 12; i++) {
      if (cells[i].chinhTinh.includes(starTarget) || cells[i].phuTinh.includes(starTarget)) {
          cells[i].phuTinh.push(luuTuHoaNames[idx]);
          break;
      }
    }
  });

  // Lưu Lộc Tồn, Lưu Kình Dương, Lưu Đà La
  const locTonPosLuu = locTonMap[viewingYearCan];
  cells[locTonPosLuu].phuTinh.push('Lưu Lộc Tồn');
  cells[mod12(locTonPosLuu + 1)].phuTinh.push('Lưu Kình Dương');
  cells[mod12(locTonPosLuu - 1)].phuTinh.push('Lưu Đà La');

  // Lưu Thái Tuế
  cells[viewingYearChi].phuTinh.push('Lưu Thái Tuế');
  cells[mod12(viewingYearChi + 2)].phuTinh.push('Lưu Tang Môn');
  cells[mod12(viewingYearChi + 6)].phuTinh.push('Lưu Bạch Hổ');
  cells[mod12(6 - viewingYearChi)].phuTinh.push('Lưu Thiên Khốc'); // Tí=6, Ngọ=0
  cells[mod12(6 + viewingYearChi)].phuTinh.push('Lưu Thiên Hư');
  
  // Lưu Thiên Mã
  const thienMaMapLuu = [2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5]; // Tí->Dần(2), Sửu->Hợi(11), Dần->Thân(8), Mão->Tỵ(5)
  cells[thienMaMapLuu[viewingYearChi]].phuTinh.push('Lưu Thiên Mã');

  return {
    lunarInfo: `${lunarDay}/${lunarMonth}/${birthLunarYear} (Âm Lịch)`,
    lunarYearName: `${STEMS[yearCan]} ${ZODIACS[yearChi]}`,
    cuc: cuc.name,
    menh: `${STEMS[menhCan]} ${ZODIACS[menhPos]}`,
    chuMenh: getChuMenh(yearChi),
    chuThan: getChuThan(yearChi),
    viewingYear,
    viewingYearName: `${STEMS[viewingYearCan]} ${ZODIACS[viewingYearChi]}`,
    viewingAge,
    cungDaiVanIndex,
    cungTieuVanIndex,
    luuDaiVanIndex,
    cells,
    yearTuHoaInfo: `${yearTuHoa[0]} (Lộc), ${yearTuHoa[1]} (Quyền), ${yearTuHoa[2]} (Khoa), ${yearTuHoa[3]} (Kỵ)`,
    luuTuHoaInfo: `${luuTuHoa[0]} (Lưu Lộc), ${luuTuHoa[1]} (Lưu Quyền), ${luuTuHoa[2]} (Lưu Khoa), ${luuTuHoa[3]} (Lưu Kỵ)`
  };
}

function getChuMenh(chi: number) {
  const map = ['Tham Lang', 'Cự Môn', 'Lộc Tồn', 'Văn Khúc', 'Liêm Trinh', 'Vũ Khúc', 'Phá Quân', 'Vũ Khúc', 'Liêm Trinh', 'Văn Khúc', 'Lộc Tồn', 'Cự Môn'];
  return map[chi];
}

function getChuThan(chi: number) {
  const map = ['Linh Tinh', 'Thiên Tướng', 'Thiên Lương', 'Thiên Đồng', 'Văn Xương', 'Thiên Cơ', 'Hỏa Tinh', 'Thiên Tướng', 'Thiên Lương', 'Thiên Đồng', 'Văn Xương', 'Thiên Cơ'];
  return map[chi];
}
