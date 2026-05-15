import React from 'react';

interface TuViCellProps {
  label: string;
  isThan: boolean;
  zodiac: string;
  canChi: string;
  trangSinh: string;
  daiHan: number;
  chinhTinh: string[];
  phuTinh: string[];
  tuanTriet: string[];
  index: number;
  options?: {
    showPhuTinh: boolean;
    showThienHinh: boolean;
    showLuuTieuVan: boolean;
    showLuuNienKhac: boolean;
    showCungTieuVan: boolean;
    showLuuTuHoa: boolean;
    showLuuDaiVan: boolean;
    showCungDaiVan: boolean;
  };
  isCungDaiVan?: boolean;
  isCungTieuVan?: boolean;
  isLuuDaiVan?: boolean;
}

export const TuViCell: React.FC<TuViCellProps> = ({ label, isThan, zodiac, canChi, trangSinh, daiHan, chinhTinh, phuTinh, tuanTriet, options, isCungDaiVan, isCungTieuVan, isLuuDaiVan }) => {
  const ttSet = Array.from(new Set(tuanTriet));
  const ttDisplay = ttSet.join(' - ');

  const visiblePhuTinh = phuTinh.filter(star => {
    if (!options) return true;
    
    // Tùy chọn độc lập
    if (!options.showThienHinh && star === 'Thiên Hình') return false;
    
    // Lưu ý: options.showLuuTieuVan là dành cho LƯU Lộc, LƯU Kình, LƯU Đà. Không được ẩn gốc.
    if (!options.showLuuTieuVan && ['Lưu Lộc Tồn', 'Lưu Kình Dương', 'Lưu Đà La'].includes(star)) return false;
    
    // Tứ Hóa Lưu Niên
    if (!options.showLuuTuHoa && star.startsWith('Lưu Hóa')) return false;

    // Lưu Niên Khác (Lưu Thái Tuế, Lưu Tang Môn, Lưu Bạch Hổ, Lưu Thiên Khốc, Lưu Thiên Hư, Lưu Thiên Mã)
    if (!options.showLuuNienKhac && ['Lưu Thái Tuế', 'Lưu Tang Môn', 'Lưu Bạch Hổ', 'Lưu Thiên Khốc', 'Lưu Thiên Hư', 'Lưu Thiên Mã'].includes(star)) {
      return false;
    }

    // Tùy chọn "Các phụ tinh"
    if (!options.showPhuTinh) {
      // Bên Tuvilotuyen, khi tắt 'Các phụ tinh', họ VẪN GIỮ CÁC CÁT TINH SÁT TINH (Trung Tinh) QUAN TRỌNG:
      const alwaysVisibleStars = [
        'Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ',
        'Tả Phụ', 'Tả Phù', 'Hữu Bật',
        'Thiên Khôi', 'Thiên Việt',
        'Văn Xương', 'Văn Khúc',
        'Kình Dương', 'Đà La',
        'Hỏa Tinh', 'Linh Tinh',
        'Địa Không', 'Địa Kiếp',
        'Lộc Tồn', 'Thiên Mã',
        'Thiên Hình' // Thiên Hình có toggle riêng nên bypass ở đây
      ];
      if (!alwaysVisibleStars.includes(star) && !star.startsWith('Lưu ')) {
        return false;
      }
    }
    
    return true;
  });

  const getStarColor = (star: string) => {
    // Hỏa: Đỏ
    if (['Thái Dương', 'Liêm Trinh', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp', 'Thiên Khôi', 'Thiên Việt', 'Hoa Cái', 'Thiên Mã', 'Thiên Hình', 'Hồng Loan', 'Cô Thần', 'Quả Tú', 'Kiếp Sát', 'Quan Phù', 'Tử Phù', 'Bệnh Phù', 'Điếu Khách', 'Phục Binh'].includes(star)) return 'text-red-600';
    // Thủy: Đen
    if (['Thiên Đồng', 'Thái Âm', 'Cự Môn', 'Thiên Tướng', 'Phá Quân', 'Hóa Kỵ', 'Văn Khúc', 'Thiên Diêu', 'Thiên Hỷ', 'Thiên Y', 'Lưu Hà', 'Phá Toái', 'Thiên Khốc', 'Thiên Hư', 'Đại Hao', 'Tiểu Hao', 'Thiên Không', 'Thiên Sứ', 'Thanh Long'].includes(star)) return 'text-slate-900';
    // Thổ: Vàng (Amber)
    if (['Tử Vi', 'Thiên Phủ', 'Lộc Tồn', 'Hóa Lộc', 'Tả Phụ', 'Hữu Bật', 'Thiên Quan', 'Thiên Phúc', 'Đường Phù', 'Quốc Ấn', 'Thai Phụ', 'Phong Cáo', 'Tam Thai', 'Bát Tọa', 'Ân Quang', 'Thiên Quý', 'Thiên Tài', 'Thiên Thọ', 'Thiên Thương'].includes(star)) return 'text-amber-600';
    // Kim: Xám (Slate)
    if (['Vũ Khúc', 'Thất Sát', 'Kình Dương', 'Đà La', 'Văn Xương', 'Bạch Hổ', 'Tướng Quân', 'Phượng Các', 'Giải Thần', 'Đẩu Quân', 'Lực Sĩ'].includes(star)) return 'text-slate-500';
    // Mộc: Xanh lá (Green)
    if (['Thiên Cơ', 'Thiên Lương', 'Tham Lang', 'Hóa Khoa', 'Hóa Quyền', 'Đào Hoa', 'Tang Môn', 'Hỷ Thần', 'Thiên La', 'Địa Võng', 'Trực Phù', 'Tuế Phá', 'Thiếu Dương', 'Thiếu Âm', 'Long Đức', 'Phúc Đức', 'Thái Tuế'].includes(star)) return 'text-green-600';

    return 'text-slate-700';
  };

  const goodStarsFull = ['Lộc Tồn', 'Thiên Khôi', 'Thiên Việt', 'Tả Phụ', 'Hữu Bật', 'Văn Xương', 'Văn Khúc', 'Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Ân Quang', 'Thiên Quý', 'Long Trì', 'Phượng Các', 'Thiên Quan', 'Thiên Phúc', 'Đường Phù', 'Quốc Ấn', 'Thai Phụ', 'Phong Cáo', 'Tam Thai', 'Bát Tọa', 'Hồng Loan', 'Thiên Hỷ', 'Đào Hoa', 'Hoa Cái', 'Thiên Mã', 'Giải Thần', 'Thanh Long', 'Thiếu Dương', 'Thiếu Âm', 'Long Đức', 'Phúc Đức', 'Hỷ Thần', 'Thiên Trù', 'Thiên Tài', 'Thiên Thọ', 'Bác Sĩ', 'Tấu Thư'];
  
  const goodPhuTinh = visiblePhuTinh.filter(s => goodStarsFull.includes(s));
  const badPhuTinh = visiblePhuTinh.filter(s => !goodStarsFull.includes(s));

  return (
    <div className="w-full h-full bg-[#fdfdf7] relative p-2 flex flex-col justify-between group hover:bg-amber-50 transition-colors font-serif overflow-hidden border border-amber-100/20">
      <div className="flex flex-col gap-1.5">
        {/* Top Corners */}
        <div className="flex items-center gap-1 z-10 w-full justify-between">
          <span className="text-[14px] md:text-[16px] font-bold text-slate-800 tracking-wider flex-shrink-0">
            {canChi || zodiac}
          </span>
          {daiHan > 0 && options?.showLuuDaiVan !== false && (
            <span className="text-[12px] md:text-[13px] font-black text-rose-800 bg-rose-50 px-1 py-0.5 rounded flex-shrink-0 border border-rose-100">
              {daiHan}
            </span>
          )}
        </div>

        {/* Tuần Triệt Row */}
        <div className="w-full flex justify-center items-center mt-0.5 z-10">
          {ttDisplay && (
            <span className="text-[13px] md:text-[15px] font-black text-white bg-slate-800 px-2 py-0.5 rounded-sm uppercase tracking-widest shadow-md">
              {ttDisplay}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 justify-start pt-1 pb-1 overflow-hidden">
        {/* Major Stars (Chính tinh) */}
        <div className="flex flex-col items-center gap-0.5 mb-2 z-10">
          {chinhTinh.map((star, idx) => (
            <span key={idx} className={`text-[15px] md:text-[17px] font-black uppercase tracking-wide text-center leading-tight drop-shadow-md ${getStarColor(star)}`}>
              {star}
            </span>
          ))}
        </div>

        {/* Minor Stars (Phụ tinh) - 2 Columns */}
        <div className="grid grid-cols-2 gap-x-1 gap-y-0 text-[11.5px] md:text-[12.5px] z-10 w-full overflow-hidden content-start">
          <div className="flex flex-col items-start gap-y-0.5 content-start min-w-0">
            {goodPhuTinh.map((star, idx) => (
              <span key={idx} className={`leading-snug truncate w-full font-semibold ${getStarColor(star)}`} title={star}>
                {star}
              </span>
            ))}
          </div>
          <div className="flex flex-col items-start gap-y-0.5 content-start min-w-0">
            {badPhuTinh.map((star, idx) => (
              <span key={idx} className={`leading-snug truncate w-full font-semibold ${getStarColor(star)}`} title={star}>
                {star}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer Area with inline Label */}
      <div className="mt-auto flex flex-col pt-1 z-20 w-full bg-white/98 shadow-[-2px_-4px_8px_rgba(0,0,0,0.02)] rounded-t-lg">
        <div className={`text-[16px] sm:text-[18px] font-black uppercase tracking-[0.1em] text-center truncate mb-0.5 transition-all ${(label || '').normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase().includes('MENH') ? '!text-red-600 scale-105' : 'text-amber-950'}`}>
          {label}
        </div>
        
        <div className="flex items-center justify-between w-full relative z-10">
          <div className="flex items-center min-w-[20px]">
            {isThan && (
              <span className="text-[10px] md:text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-0.5 rounded shadow-sm leading-tight">
                THÂN
              </span>
            )}
          </div>
          
          {trangSinh && (
             <span className="text-[11.5px] md:text-[12.5px] font-black text-slate-700 tracking-wider">
               {trangSinh}
             </span>
          )}

          <div className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase min-w-[20px] text-right">
            {zodiac}
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] text-[50px] md:text-[60px] font-black text-slate-100 opacity-20 select-none uppercase z-0 pointer-events-none">
        {zodiac}
      </div>

      {options?.showCungDaiVan && isCungDaiVan && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[150%] text-[12px] font-black text-rose-500/80 uppercase z-0 pointer-events-none whitespace-nowrap rotate-[-15deg]">
          ĐẠI VẬN
        </div>
      )}
      {options?.showCungTieuVan && isCungTieuVan && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[100%] text-[11px] font-black text-amber-500/80 uppercase z-0 pointer-events-none whitespace-nowrap rotate-[15deg]">
          TIỂU VẬN
        </div>
      )}
      {options?.showLuuDaiVan && isLuuDaiVan && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-0 text-[11px] font-black text-blue-500/80 uppercase z-0 pointer-events-none whitespace-nowrap">
          LƯU ĐẠI VẬN
        </div>
      )}
    </div>
  );
};