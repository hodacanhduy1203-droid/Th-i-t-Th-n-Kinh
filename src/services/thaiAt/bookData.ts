export interface TableOfContentItem {
  id: string;
  title: string;
  level: number;
  pages?: string;
  children?: TableOfContentItem[];
  content?: string; // Markdown or plain text
}

export const THAI_AT_BOOK_TOC: TableOfContentItem[] = [
  {
    id: 'intro',
    title: '1. Lời Mở Đầu',
    level: 1,
    pages: '1',
    content: '...(Nội dung sẽ được cập nhật từ sách)...',
  },
  {
    id: 'chin-dieu-dan-khoi',
    title: '2. Chín điều dẫn khởi Thái Ất Thần Kinh',
    level: 1,
    pages: '3',
    children: [
      { id: 'cd-a', title: 'A. Xuất xứ', level: 2, pages: '3' },
      { id: 'cd-b', title: 'B. Người dịch Thái Ất Thần Kinh của Trạng Trình', level: 2, pages: '4' },
      { id: 'cd-diem-a', title: 'Điểm A. Khoa toán Thái Ất không phải gốc từ nhà Hán', level: 2, pages: '5' },
      { id: 'cd-diem-b', title: 'Điểm B. Khoa toán Thái Ất thống tất cả Đạo học', level: 2, pages: '7' },
      { id: 'cd-diem-c', title: 'Điểm C. Thái Ất Thần Kinh là định luật tổng thể Vũ Trụ', level: 2, pages: '15' },
      { id: 'cd-diem-d', title: 'Điểm D. Cái Một Cả Vô Vi, Vô Tận, tự làm Nhân Quả', level: 2, pages: '22' },
      { id: 'cd-diem-e', title: 'Điểm E. Thái Ất Chân Nhân', level: 2, pages: '28' },
      { id: 'cd-diem-f', title: 'Điểm F. Thánh nhân mang tội Dị đoan Mê tín', level: 2, pages: '30' },
      { id: 'cd-diem-g', title: 'Điểm G. Lời nói đầu trọn bộ 5 cuốn trong bộ Huyền Phạm Tiết Yếu', level: 2, pages: '34' },
      { id: 'cd-diem-h', title: 'Điểm H. Tại sao Thái Ất Thần Kinh vắng bóng suốt 500 năm qua tại Việt Nam?', level: 2, pages: '35' },
      { id: 'cd-diem-k', title: 'Điểm K. Sách Thái Ất Dị Giản Lục của Lê Quý Đôn', level: 2, pages: '42' },
      { id: 'cd-diem-l', title: 'Điểm L. Sự dàn xếp nội dung toàn bộ Thái Ất Thần Kinh', level: 2, pages: '44' },
    ]
  },
  {
    id: 'cuon-6',
    title: 'Cuốn 6 – Thái Ất thực dụng I, Bầu trời Thái Ất cách tính phép lập bản đồ bản Thái Ất',
    level: 1,
    pages: '46',
    children: [
      {
        id: 'c6-phan1',
        title: 'Phần I. Vị trí các sao Thái Ất trong Bầu trời Thái Ất',
        level: 2,
        pages: '46',
        children: [
          { id: 'c6-p1-a', title: 'A. Chu kỳ và điểm xuất phát các sao Thái Ất', level: 3, pages: '46' },
          { id: 'c6-p1-b', title: 'B. Trung cổ Giáp Dần là điểm xuất phát chung thứ hai', level: 3, pages: '49' },
          { id: 'c6-p1-c', title: 'C. Cách tính vòng Kỷ Dư', level: 3, pages: '50' },
          { id: 'c6-p1-d', title: 'D. Tìm Tứ Kể Thái Ất chuyển cung', level: 3, pages: '51' },
          { id: 'c6-p1-e', title: 'E. Căn phép tính Thái Ất chuyển cung thần kinh', level: 3, pages: '53' },
        ]
      },
      {
        id: 'c6-phan2',
        title: 'Phần II. Bầu trời Thái Ất và chuyển cung thứ',
        level: 2,
        pages: '56',
        children: [
          { id: 'c6-p2-a', title: 'A. Cung chính', level: 3, pages: '56' },
          { id: 'c6-p2-b', title: 'B. Cung gián hay cung thứ', level: 3, pages: '57' },
          { id: 'c6-p2-c', title: 'C. Cung khí ở 16 thần cùng với 16 biệt danh', level: 3, pages: '57' },
        ]
      },
      { id: 'c6-phan3', title: 'Phần III. Bầu trời Thái Ất', level: 2, pages: '64' },
      { id: 'c6-phan4', title: 'Phần IV. Cách tính Kể Tháng Thái Ất', level: 2, pages: '65' },
      {
        id: 'c6-phan5',
        title: 'Phần V. Cách tính 9 sao phép tôn (Trực Phù)',
        level: 2,
        pages: '81',
        children: [
          { id: 'c6-p5-a', title: 'A. Cách tính 9 sao phép tôn (Cửu tinh Trực Phù)', level: 3, pages: '81' },
          { id: 'c6-p5-b', title: 'B. Tính Văn Xương Cửu Tinh (Bài văn 9 sao) giữ Phân dã Trực Sự', level: 3, pages: '86' },
        ]
      },
      { id: 'c6-phan7', title: 'Phần VII. Tìm 8 cửa vào việc (Bát môn Trực Sự)', level: 2, pages: '92' },
      { id: 'c6-phan8', title: 'Phần VIII. Phép tính Đại Du', level: 2, pages: '99' },
      { id: 'c6-phan9', title: 'Phần IX. Sao và điềm dự đoán', level: 2, pages: '112' },
      { id: 'c6-phan10', title: 'Phần X. Kiểm chứng Thái Ất vô thường (biên)', level: 2, pages: '118' },
    ]
  },
  {
    id: 'nhan-menh',
    title: 'Phần Nhân mệnh lập quẻ Ất Nhân Mệnh',
    level: 1,
    pages: '207',
    children: [
      { id: 'nm-1', title: 'Cách tính Mệnh Cung, Thân Cung', level: 2 },
      { id: 'nm-2', title: 'Đại Vận và Tiểu Vận', level: 2 },
      { id: 'nm-3', title: 'Luận giải qua Thể thức (Tù, Ép, Chặn, Bách)', level: 2 }
    ]
  },
  {
    id: 'binh-phap',
    title: 'Phần Binh pháp Thái Ất, Khí tượng Thái Ất, Quốc vận Thái Ất',
    level: 1,
    pages: '250+',
  }
];

export const findContentById = (items: TableOfContentItem[], id: string): TableOfContentItem | null => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findContentById(item.children, id);
      if (found) return found;
    }
  }
  return null;
};
