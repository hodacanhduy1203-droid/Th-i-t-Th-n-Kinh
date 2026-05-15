export const THAI_AT_16_PALACES = [
  // 16 Cung theo chuẩn Thái Ất Thần Kinh
  { id: 't1', name: 'Tý', direction: 'Bắc' },
  { id: 't2', name: 'Sửu', direction: 'Đông Bắc' },
  { id: 't3', name: 'Cấn', direction: 'Đông Bắc' },
  { id: 't4', name: 'Dần', direction: 'Đông' },
  { id: 't5', name: 'Mão', direction: 'Đông' },
  { id: 't6', name: 'Thìn', direction: 'Đông Nam' },
  { id: 't7', name: 'Tốn', direction: 'Đông Nam' },
  { id: 't8', name: 'Tỵ', direction: 'Nam' },
  { id: 't9', name: 'Ngọ', direction: 'Nam' },
  { id: 't10', name: 'Mùi', direction: 'Tây Nam' },
  { id: 't11', name: 'Khôn', direction: 'Tây Nam' },
  { id: 't12', name: 'Thân', direction: 'Tây' },
  { id: 't13', name: 'Dậu', direction: 'Tây' },
  { id: 't14', name: 'Tuất', direction: 'Tây Bắc' },
  { id: 't15', name: 'Càn', direction: 'Tây Bắc' },
  { id: 't16', name: 'Hợi', direction: 'Bắc' },
];

export const PALACES_RING_CLOCKWISE = [
  't15', 't16', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12', 't13', 't14'
];

export const THAI_AT_TO_16_PALACES: Record<number, string> = {
  1: 't15', // Càn
  2: 't9',  // Ly / Ngọ
  3: 't3',  // Cấn
  4: 't5',  // Chấn / Mão
  6: 't13', // Đoài / Dậu
  7: 't11', // Khôn
  8: 't1',  // Khảm / Tý
  9: 't7',  // Tốn
};

export const STAR_NAMES = {
  // Chính tinh
  THAI_AT: 'Thái Ất',
  THIEN_MUC: 'Thiên Mục (Văn Xương)',
  KHACH_MUC: 'Khách Mục (Thủy Kích)',
  CHU_TOAN: 'Chủ Toán',
  KHACH_TOAN: 'Khách Toán',
  DAI_TUONG: 'Đại Tướng (Chủ)',
  TIEU_TUONG: 'Tiểu Tướng (Chủ)',
  KHACH_DAI_TUONG: 'Đại Tướng (Khách)',
  KHACH_TIEU_TUONG: 'Tiểu Tướng (Khách)',
  
  // Du tinh
  DAI_DU: 'Đại Du',
  TIEU_DU: 'Tiểu Du',
  
  // Trực Phù
  TRUC_PHU: 'Trực Phù',
  TRUC_SU: 'Trực Sử',
  TRUC_HUU: 'Trực Hữu',
  TRUC_TA: 'Trực Tả',
  TRUC_TRUNG: 'Trực Trung',
  TRUC_HAU: 'Trực Hậu',
  TRUC_TIEN: 'Trực Tiền',
  TRUC_MON: 'Trực Môn',
  TRUC_NOI: 'Trực Nội',

  // Khác
  VO_KHUC: 'Võ Khúc',
};

// 8 Môn (Bát Môn Trực Sự)
export const BAT_MON = [
  'Khai', 'Hưu', 'Sinh', 'Thương', 'Đỗ', 'Cảnh', 'Tử', 'Kinh'
];

export const BAT_MON_INFO: Record<string, { desc: string; type: string }> = {
  'Khai': { desc: 'Âm khí tàng ẩn, chủ hình phạt, trấn giữ, lập thành hoàng.', type: 'Đại Cát (May lớn)' },
  'Hưu': { desc: 'Chỗ hưu binh, an binh, tụ chúng. Nên cẩn thận, dễ sinh nghi ngờ.', type: 'Đại Cát (May lớn)' },
  'Sinh': { desc: 'Vạn vật xuất sinh, chủ Hậu Phi, Hòa Đức, kết hoà, sinh dục.', type: 'Đại Cát (May lớn)' },
  'Thương': { desc: 'Vật đã xuất ra, chủ Lôi Đình, bệnh tật, đạo tặc, tổn thương. Tốt cho trưởng nam, săn bắn.', type: 'Đại Hung (Rất dữ, rất xấu)' },
  'Đỗ': { desc: 'Địa Hộ, dương khí tuyệt, chủ ải phục, chờ đợi, cố thủ. Không lợi hưng binh.', type: 'Đại Hung (Rất dữ, rất xấu)' },
  'Cảnh': { desc: 'Minh Đường, chủ tu đức, Văn Minh, cũng là tù ngục, binh giặc.', type: 'Cát Nhỏ (May nhỏ)' },
  'Tử': { desc: 'Chủ tàng ẩn, tử vong, tang tóc. Không nên xuất quân.', type: 'Đại Hung (Rất dữ, rất xấu)' },
  'Kinh': { desc: 'Chủ kinh hoảng, bôn tẩu, phục binh. Tốt cho Phương Tây. Dễ hoả hoạn.', type: 'Hung Nhỏ' },
};

// Chu kỳ 72 cục
export const NGUYEN_NAMES: Record<number, string> = {
  1: 'Thượng Nguyên',
  2: 'Trung Nguyên',
  3: 'Hạ Nguyên'
};
