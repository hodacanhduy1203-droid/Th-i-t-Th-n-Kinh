import { handleAIError } from '../utils/aiErrorHandler';
import { sanitizeApiContents } from '../utils/aiHelpers';
import React, { useState, useEffect, useRef } from 'react';
import { calculateTuVi, ZODIACS } from '../lib/tuviLogic';
import { TuViCell } from './TuViCell';
import { Compass, Calendar, Save, List, Trash2, X, Maximize, Settings, Sparkles, BrainCircuit, UserCircle, Send, MessageSquareShare, Copy, Check, RefreshCw, Volume2, Square } from 'lucide-react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { VoiceInput } from './VoiceInput';
import { getAI } from '../services/aiService';
import { GEMINI_MODEL } from '../constants/ai';
import { THIEN_LUONG_THEORY } from '../constants/thienLuongTheory';
import { TU_VI_HAM_SO_THEORY } from '../constants/tuViHamSo';
import Markdown from 'react-markdown';
import { Solar, Lunar } from 'lunar-javascript';
import { setupSpeechSynthesis, cancelSpeech, speakText } from '../lib/speech';

interface SavedChart {
  id: string;
  name: string;
  solarDate?: string; // Legacy
  day?: number;
  month?: number;
  year?: number;
  hourStr: string;
  gender: 'M' | 'F';
  viewingYear?: number;
}

interface TuViProps {
  onRequireApiKey?: () => void;
}

const FastInput = React.memo(({ value, onChange, name, delay, ...props }: any) => {
	const handleChange = (e: any) => {
		if (onChange) {
			onChange(e);
		}
	};
	return <input name={name} value={value} onChange={handleChange} {...props} />;
});

export const TuViTab: React.FC<TuViProps> = ({ onRequireApiKey }) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  
  const [lDay, setLDay] = useState('');
  const [lMonth, setLMonth] = useState('');
  const [lYear, setLYear] = useState('');
  const [lIsLeap, setLIsLeap] = useState(false);
  const [activeInput, setActiveInput] = useState<'solar' | 'lunar'>('solar');

  const [viewingYear, setViewingYear] = useState(new Date().getFullYear().toString());
  const [hourStr, setHourStr] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [chartName, setChartName] = useState('');
  
  const [chartData, setChartData] = useState<any | null>(null);
  
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Settings State
  const [showPhuTinh, setShowPhuTinh] = useState(true);
  const [showThienHinh, setShowThienHinh] = useState(true);
  const [showLuuTieuVan, setShowLuuTieuVan] = useState(true);
  const [showLuuNienKhac, setShowLuuNienKhac] = useState(true); 
  const [showCungTieuVan, setShowCungTieuVan] = useState(false);
  const [showLuuTuHoa, setShowLuuTuHoa] = useState(false); // Lưu niên tứ hóa tiểu vận
  const [showLuuDaiVan, setShowLuuDaiVan] = useState(false);
  const [showCungDaiVan, setShowCungDaiVan] = useState(false);

  // AI Chat States
  const [tuviChat, setTuviChat] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [tuviQuestion, setTuviQuestion] = useState('');
  const [interimTuviQuestion, setInterimTuviQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isReadingIndex, setIsReadingIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setupSpeechSynthesis();
    return () => cancelSpeech();
  }, []);

  const handleSpeak = (text: string, index: number) => {
    if (isReadingIndex === index) {
      cancelSpeech();
      setIsReadingIndex(null);
      return;
    }

    speakText(
      text,
      () => setIsReadingIndex(index),
      () => setIsReadingIndex(null),
      () => setIsReadingIndex(null)
    );
  };

  useEffect(() => {
    // Scroll chat to bottom when updated
    if (chatEndRef.current && tuviChat.length > 0) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tuviChat]);

  const [scale, setScale] = useState(1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Bảng tử vi nguyên bản rộng 820px, có padding offset
        const newScale = Math.min(1, containerWidth / 800);
        setScale(newScale);
      }
    };
    
    // Initial scale check and trigger it gracefully
    updateScale();
    const timeoutProcess = setTimeout(updateScale, 150);
    
    // Add event listener
    window.addEventListener('resize', updateScale);
    return () => {
       window.removeEventListener('resize', updateScale);
       clearTimeout(timeoutProcess);
    };
  }, [chartData, isFullscreen]);

  useEffect(() => {
    try {
      const list = localStorage.getItem('saved_tuvi_charts');
      if (list) {
        setSavedCharts(JSON.parse(list));
      }
    } catch (e) {}
  }, []);

  const saveCharts = (charts: SavedChart[]) => {
    setSavedCharts(charts);
    try {
      localStorage.setItem('saved_tuvi_charts', JSON.stringify(charts));
    } catch (e) {
      console.warn("Could not save to localStorage. It might be full.");
    }
  };

  const analyzeTuVi = async (customQuestion?: string) => {
    if (!chartData) return;
    const questionToUse = customQuestion || tuviQuestion;
    
    setIsAnalyzing(true);
    try {
      const cungsInfos = chartData.cells.map((c: any, idx: number) => {
        const phu = Array.isArray(c.phuTinh) ? c.phuTinh : [];
        const tt = Array.isArray(c.tuanTriet) ? c.tuanTriet : [];
        const chinh = Array.isArray(c.chinhTinh) ? c.chinhTinh : [];
        
        const labels = [];
        if (chartData.cungDaiVanIndex === idx) labels.push('ĐẠI VẬN 10 NĂM');
        if (chartData.cungTieuVanIndex === idx) labels.push('TIỂU VẬN NĂM NAY');
        if (chartData.luuDaiVanIndex === idx) labels.push('LƯU ĐẠI VẬN NĂM NAY');
        
        const labelStr = labels.length > 0 ? ` [${labels.join(' & ')}]` : '';
        
        return `[Cung ${c.cung} - ${c.canChi}]${labelStr}: Hành ${c.cungHanh}, Vòng Trường Sinh: ${c.trangSinh}. Chính tinh: ${chinh.join(', ') || 'Vô Chính Diệu'}. Phụ tinh: ${[...phu, ...tt].join(', ') || 'Không'}`;
      }).join('\n');

      const methodSpecificTheory = `${TU_VI_HAM_SO_THEORY}\n\n${THIEN_LUONG_THEORY}\n\nPHƯƠNG PHÁP CỤ THỂ (TỔNG HỢP):\n- Bắt buộc phải coi lá số tử vi như một hàm số đa biến phức tạp.\n- Bắt buộc đánh giá Mệnh Thân nằm trong tam giác Thái Tuế nào, vòng Tràng Sinh (nhất là chỉ số tại các cung), Âm Dương Thuận/Nghịch lý. Nhấn mạnh chữ NGỘ để tu nhân tích đức.\n- Kết hợp phân tích sự tương tác giữa các cung, các sao, Mệnh, Cục, và Âm Dương Ngũ Hành. Xem xét kỹ độ mạnh yếu (vượng suy) của các cung dựa trên hành của cung sinh/khắc với Bản Mệnh.`;

      const cauTrucInstruction = `5. CẤU TRÚC (Nếu người dùng hỏi chung hoặc yêu cầu luận giải 12 cung):
   - Đánh giá Tổng Quan: Xét Âm Dương thuận nghịch, Mệnh/Cục tương sinh tương khắc. Đánh giá Mệnh Thân nằm trong tam giác Thái Tuế, vòng Tràng Sinh. Đánh giá Tứ Hóa năm sinh.
   - Luận giải chi tiết ĐẦY ĐỦ 12 CUNG theo đúng thứ tự (BẮT BUỘC dùng markdown ### cho tên cung để nội dung nhỏ lại và in đậm, ví dụ: ### 1. CUNG MỆNH): 1. Cung Mệnh, 2. Cung Phụ Mẫu, 3. Cung Phúc Đức, 4. Cung Điền Trạch, 5. Cung Quan Lộc, 6. Cung Nô Bộc, 7. Cung Thiên Di, 8. Cung Tật Ách, 9. Cung Tài Bạch, 10. Cung Tử Tức, 11. Cung Phu Thê, 12. Cung Huynh Đệ. Rất quan trọng là phải phân tích đủ 12 cung không được bỏ sót. VỚI MỖI CUNG, bắt buộc phải nêu và đánh giá độ mạnh yếu (vượng suy) dựa trên Hành của cung so với Bản Mệnh, và ý nghĩa của sao vòng Tràng Sinh tại cung đó trước khi phân tích tinh diệu và sự tác động của Tứ Hóa.
   - Diễn biến hạn vận năm ${chartData.viewingYear} (Kết hợp Nam Phái và Bắc Phái: Đại Vận, Tiểu Vận, Lưu Đại Vận, Phi tinh Tứ Hóa Lưu Niên).
   - Lời khuyên tu nhân, tích phúc cải mệnh theo triết lý Dịch Học & nhân sinh.`;

      const systemInstruction = `Bạn là Đại sư Tử Vi Đẩu Số, am tường sâu sắc cả Tử Vi Nam Phái và Bắc Phái.

NGUỒN DỮ LIỆU & CƠ SỞ LÝ LUẬN:
- TỬ VI NAM PHÁI (Trọng Tinh Diệu, Cách Cục, Âm Dương Ngũ Hành): Sự luận giải dựa trên nền tảng của các cổ thư và danh tác kinh điển như: "Tử Vi Đẩu Số Toàn Thư" (Hi Tán tiên sinh / Trần Đoàn), "Tử Vi Đẩu Số Tân Biên" (Vân Đằng Thái Thứ Lang), "Tử Vi Nghiệm Lý" & "Tử Vi Giảng Minh" (Cụ Thiên Lương), "Tử Vi Thực Hành" (Dịch Lý Huyền Cơ), "Tử Vi Hàm Số" (Nguyễn Phát Lộc). Phân tích kỹ Miếu/Vượng/Đắc/Hãm, sự tương tác của Chính tinh, Phụ tinh và Sát tinh trong Tam phương Tứ chính.
- TỬ VI BẮC PHÁI (Trọng Tứ Hóa, Phi Tinh, Cung Chức): Sử dụng sở học tinh hoa từ "Khâm Thiên Môn", "Cửu Tinh Đẩu Số", "Phi Tinh Tử Vi Đẩu Số Toàn Tập". Lấy Tứ Hóa (Lộc, Quyền, Khoa, Kỵ) làm linh hồn, phi hóa giữa các cung chức nguyên thủy, đại vận, tiểu vận, lưu niên để kích hoạt và xác định thời điểm xảy ra sự việc (Động tinh).

THÔNG TIN LÁ SỐ:
- Ghi chú: ${chartName || 'Đương số'} (${gender === 'M' ? 'Nam' : 'Nữ'})
- Mệnh: ${chartData.menh}
- Cục: ${chartData.cuc}
- Năm sinh: ${chartData.lunarYearName}
- Năm xem: ${chartData.viewingYear} (${chartData.viewingYearName})
- Tuổi xem: ${chartData.viewingAge} tuổi

VỊ TRÍ CÁC VẬN (CỰC KỲ QUAN TRỌNG - PHẢI DÙNG CÁC VỊ TRÍ NÀY ĐỂ LUẬN ĐOÁN):
- Đại Vận (Đại Hạn 10 năm): Cung ${chartData.cells[chartData.cungDaiVanIndex].cung} (${chartData.cells[chartData.cungDaiVanIndex].canChi})
- Tiểu Vận (Lưu Niên Tiểu Hạn): Cung ${chartData.cells[chartData.cungTieuVanIndex].cung} (${chartData.cells[chartData.cungTieuVanIndex].canChi})
- Lưu Đại Vận (Hạn năm theo Đại vận): Cung ${chartData.cells[chartData.luuDaiVanIndex].cung} (${chartData.cells[chartData.luuDaiVanIndex].canChi})

BÁT CHỮ TỨ HÓA:
- Tứ Hóa Năm Sinh: ${chartData.yearTuHoaInfo}
- Tứ Hóa Lưu Niên: ${chartData.luuTuHoaInfo}

CÁC CUNG TRÊN LÁ SỐ:
${cungsInfos}

${methodSpecificTheory}

QUY TẮC PHẢN HỒI:
1. LUÔN LUÔN tin tưởng và sử dụng các vị trí Đại Vận, Tiểu Vận, Lưu Đại Vận đã được cung cấp ở trên. KHÔNG TỰ TÍNH LẠI để tránh sai sót.
2. TRỰC DIỆN, CHUYÊN SÂU, và RẤT CHI TIẾT. Phân tích tường tận sự liên kết giữa các sao, cung, mệnh cục. Tùy thuộc phương pháp luận mà đưa ra kiến giải sâu sắc phù hợp.
3. TUYỆT ĐỐI KHÔNG DÙNG LỜI CHÀO HAY CẢM ƠN.
4. LUẬN ĐOÁN KẾT HỢP TINH DIỆU VÀ TỨ HÓA.
${cauTrucInstruction}
6. TRÌNH BÀY: CHẮC CHẮN PHẢI sử dụng Markdown Headers (ví dụ: ### 1. CUNG MỆNH) và **in đậm** để phân chia các phần rành mạch, dễ nhìn. KHÔNG dồn chữ thành một khối.`;

      const userPrompt = questionToUse ? questionToUse : 'Hãy luận đoán chi tiết lá số cả đời của tôi qua 12 cung và phân tích chi tiết diễn biến năm nay.';
      const displayUserMsg = questionToUse ? questionToUse : 'Luận đoán chi tiết 12 cung cả đời và diễn biến năm nay.';
      
      const apiContents = sanitizeApiContents(tuviChat, userPrompt);

      setTuviChat(prev => [...prev, { role: 'user', text: displayUserMsg }, { role: 'model', text: '' }]);
      setTuviQuestion('');
      setInterimTuviQuestion('');

      const aiInstance = getAI();
      const stream = await aiInstance.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: apiContents,
        config: {
          systemInstruction: systemInstruction
        }
      });

      let fullResp = '';
      let lastUpdate = Date.now();
      for await (const chunk of stream) {
        fullResp += chunk.text || '';
        if (Date.now() - lastUpdate > 50) {
          setTuviChat(prev => {
            if (prev.length === 0) return prev;
            const newChat = [...prev];
            newChat[newChat.length - 1] = { ...newChat[newChat.length - 1], text: fullResp };
            return newChat;
          });
          lastUpdate = Date.now();
        }
      }
      // final update
      setTuviChat(prev => {
        if (prev.length === 0) return prev;
        const newChat = [...prev];
        newChat[newChat.length - 1] = { ...newChat[newChat.length - 1], text: fullResp };
        return newChat;
      });
    } catch (error: any) {
      console.error(error);
      const errorMsg = handleAIError(error);
      if (errorMsg.includes("API Key") || errorMsg.includes("Quota") || error?.message === 'API_KEY_MISSING') {
        if (onRequireApiKey) onRequireApiKey();
      }
        setTuviChat(prev => {
          if (prev.length === 0) return prev;
          const newChat = [...prev];
          newChat[newChat.length - 1] = { ...newChat[newChat.length - 1], text: errorMsg };
          return newChat;
        });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = () => {
    try {
      let finalY = parseInt(year, 10);
      let finalM = parseInt(month, 10);
      let finalD = parseInt(day, 10);
      const hour = parseInt(hourStr, 10);
      const vy = parseInt(viewingYear, 10);

      if (activeInput === 'lunar') {
        const ly = parseInt(lYear, 10);
        const lm = parseInt(lMonth, 10);
        const ld = parseInt(lDay, 10);
        const lunarMonth = lIsLeap ? -lm : lm;
        const lunar = Lunar.fromYmd(ly, lunarMonth, ld);
        const solar = lunar.getSolar();
        finalY = solar.getYear();
        finalM = solar.getMonth();
        finalD = solar.getDay();
      }
      
      if (!finalY || !finalM || !finalD || isNaN(finalY) || isNaN(finalM) || isNaN(finalD) || isNaN(vy)) {
        alert('Vui lòng nhập đầy đủ ngày tháng năm sinh và năm xem hợp lệ.');
        return;
      }
      
      const data = calculateTuVi(finalY, finalM, finalD, hour, gender, vy);
      // @ts-ignore
      data.solarStr = `${finalD.toString().padStart(2, '0')}/${finalM.toString().padStart(2, '0')}/${finalY}`;
      setChartData(data);
    } catch (e) {
      console.error(e);
      alert('Vui lòng nhập ngày tháng hợp lệ.');
    }
  };

  const handleSave = () => {
    if (!chartName.trim()) {
      alert('Vui lòng nhập tên/ghi chú cho lá số để lưu.');
      return;
    }
    const newChart: SavedChart = {
      id: Date.now().toString(),
      name: chartName.trim(),
      day: parseInt(day, 10),
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      hourStr,
      gender
    };
    saveCharts([...savedCharts, newChart]);
    alert('Đã lưu lá số thành công!');
    setChartName('');
  };

  const loadChart = (chart: SavedChart) => {
    if (chart.day && chart.month && chart.year) {
      setDay(String(chart.day));
      setMonth(String(chart.month));
      setYear(String(chart.year));
    }
    
    setHourStr(chart.hourStr);
    setGender(chart.gender);
    setChartName(chart.name);
    setShowSavedList(false);
    
    // Auto generate
    setTimeout(() => {
      handleGenerate();
    }, 100);
  };

  const deleteChart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa lá số này?')) {
      const newList = savedCharts.filter(c => c.id !== id);
      saveCharts(newList);
    }
  };

  const renderGrid = () => {
    if (!chartData) return null;
    const { cells, menh, cuc, lunarInfo, lunarYearName } = chartData;

    const getCell = (idx: number) => {
      const cell = cells[idx];
      return (
        <TuViCell 
          key={idx} 
          index={idx} 
          label={cell.cung} 
          isThan={cell.isThan} 
          zodiac={ZODIACS[idx]} 
          canChi={cell.canChi}
          daiHan={cell.daiHan}
          trangSinh={cell.trangSinh}
          chinhTinh={cell.chinhTinh} 
          phuTinh={cell.phuTinh} 
          tuanTriet={cell.tuanTriet} 
          options={{
             showPhuTinh,
             showThienHinh,
             showLuuTieuVan,
             showLuuNienKhac,
             showCungTieuVan,
             showLuuTuHoa,
             showLuuDaiVan,
             showCungDaiVan
          }}
          isCungDaiVan={chartData.cungDaiVanIndex === idx}
          isCungTieuVan={chartData.cungTieuVanIndex === idx}
          isLuuDaiVan={chartData.luuDaiVanIndex === idx}
        />
      );
    };

    const genderStr = gender === 'M' ? 'Nam' : 'Nữ';

    return (
      <div style={{ width: '800px', height: '1100px' }} className="bg-amber-50/50 p-2 sm:p-4 rounded-xl shadow-lg border border-amber-200/60">
        <div 
          style={{ gridTemplateRows: 'repeat(4, 25%)', minHeight: '1100px' }}
          className="grid grid-cols-4 grid-rows-4 gap-px bg-slate-400/50 border-[1.5px] border-slate-400/80 p-px rounded-sm shadow-[inset_0_0_30px_rgba(0,0,0,0.05)] w-full h-full text-clip overflow-hidden"
        >
          {getCell(5)} {getCell(6)} {getCell(7)} {getCell(8)}
          
          {getCell(4)} 
          
          <div className="col-span-2 row-span-2 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')] bg-amber-50/90 flex flex-col p-2 sm:px-8 sm:py-10 items-center justify-center sm:justify-start text-center relative border border-amber-200/50 m-[1px] overflow-hidden">
            {/* Decorative corners */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-4 h-4 sm:w-8 sm:h-8 border-t-2 border-l-2 border-amber-600/30 rounded-tl-lg"></div>
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-4 h-4 sm:w-8 sm:h-8 border-t-2 border-r-2 border-amber-600/30 rounded-tr-lg"></div>
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-4 h-4 sm:w-8 sm:h-8 border-b-2 border-l-2 border-amber-600/30 rounded-bl-lg"></div>
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-4 h-4 sm:w-8 sm:h-8 border-b-2 border-r-2 border-amber-600/30 rounded-br-lg"></div>

            <div className="w-full flex items-center justify-between border-b border-amber-600/20 pb-2 sm:pb-6 mb-2 sm:mb-8 mt-1 sm:mt-2">
               <div className="flex-1"></div>
               <div className="flex flex-col items-center mx-2 sm:mx-4">
                 <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-rose-800 tracking-widest uppercase font-serif drop-shadow-sm whitespace-nowrap">Tử Vi Đẩu Số</h1>
                 <span className="text-[7.5px] sm:text-xs md:text-sm font-bold text-amber-700 sm:tracking-[0.3em] uppercase mt-1 sm:mt-2 whitespace-nowrap">Thiên Bàn Nghiệm Lý v3.0</span>
               </div>
               <div className="flex-1"></div>
            </div>

            <div className="flex flex-col gap-y-1 sm:gap-y-3 text-[10px] sm:text-[15px] font-serif w-full px-2 sm:px-8 max-w-sm mx-auto flex-1 justify-center">
              <div className="flex items-center justify-between border-b border-dashed border-amber-600/30 pb-1 sm:pb-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] sm:text-xs">Năm Xem</span>
                <span className="font-black text-rose-700 text-[11px] sm:text-lg uppercase">{chartData.viewingYear} - <span className="text-amber-800">{chartData.viewingYearName}</span></span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-amber-600/30 pb-1 sm:pb-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] sm:text-xs">Năm Sinh / Tuổi</span>
                <span className="font-black text-amber-900 text-[11px] sm:text-sm uppercase">{lunarYearName} - <span className="text-rose-700">{chartData.viewingAge}t</span></span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-amber-600/30 pb-1 sm:pb-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] sm:text-xs">Bản Mệnh</span>
                <span className="font-black text-red-600 text-[11px] sm:text-sm uppercase truncate max-w-[120px] sm:max-w-none">{menh}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-amber-600/30 pb-1 sm:pb-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] sm:text-xs">Cục Khí</span>
                <span className="font-black text-amber-900 text-[11px] sm:text-sm uppercase truncate max-w-[120px] sm:max-w-none">{cuc}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-amber-600/30 pb-1 sm:pb-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] sm:text-xs">Âm Dương</span>
                <span className="font-black text-amber-900 text-[11px] sm:text-sm uppercase">{genderStr} Mệnh</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] sm:text-xs">Chủ Cơ</span>
                <span className="font-black text-blue-900 text-[11px] sm:text-sm uppercase">M: {chartData.chuMenh} / T: {chartData.chuThan}</span>
              </div>
            </div>
            
            <div className="hidden sm:block mt-auto mb-2 text-xs text-amber-700/60 italic font-serif">
               Biện chứng ngũ hành sinh khắc - Cổ học phương Đông
            </div>
          </div>

          {getCell(9)}
          
          {getCell(3)} 
          {getCell(10)}
          
          {getCell(2)} {getCell(1)} {getCell(0)} {getCell(11)}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center justify-start gap-4">

      <div className="w-full max-w-6xl flex flex-col gap-4 z-10 px-2 lg:px-0">
        <div className="bg-white p-3 md:p-4 rounded-xl shadow-md border border-slate-200/60 flex flex-col gap-3 transition-all">
          
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-amber-100 to-amber-50 rounded-full flex items-center justify-center shadow-inner border border-amber-200/50">
                     <Calendar className="w-4 h-4 md:w-4 md:h-4 text-amber-600 drop-shadow-sm" />
                  </div>
                  <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-widest font-serif whitespace-nowrap">Lấy Lá Số</h2>
               </div>
               
               <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                      onClick={() => setActiveInput('solar')}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all uppercase ${activeInput === 'solar' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                      DƯƠNG LỊCH
                  </button>
                  <button
                      onClick={() => setActiveInput('lunar')}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all uppercase ${activeInput === 'lunar' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                      ÂM LỊCH
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100/80 shadow-inner">
               {activeInput === 'solar' ? (
                 <>
                   <label className="flex flex-col gap-1 w-full relative col-span-1 md:col-span-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center truncate">NGÀY</span>
                      <FastInput type="number" min="1" max="31" value={day} onChange={(e: any) => setDay(e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-slate-200/80 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-mono font-bold text-slate-800 text-center text-[16px] md:text-sm shadow-sm" />
                   </label>
                   <label className="flex flex-col gap-1 w-full relative col-span-1 md:col-span-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center truncate">THÁNG</span>
                      <FastInput type="number" min="1" max="12" value={month} onChange={(e: any) => setMonth(e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-slate-200/80 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-mono font-bold text-slate-800 text-center text-[16px] md:text-sm shadow-sm" />
                   </label>
                   <label className="flex flex-col gap-1 w-full relative col-span-1 md:col-span-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center truncate">NĂM</span>
                      <FastInput type="number" min="1900" max="2100" value={year} onChange={(e: any) => setYear(e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-slate-200/80 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-mono font-bold text-slate-800 text-center text-[16px] md:text-sm shadow-sm" />
                   </label>
                   <label className="flex flex-col gap-1 w-full relative col-span-1 md:col-span-1">
                      <span className="text-[9px] font-bold text-amber-500/80 uppercase tracking-widest text-center truncate">GIỜ</span>
                      <FastInput type="number" min="0" max="23" value={hourStr} onChange={(e: any) => setHourStr(e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-amber-200 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-amber-50 text-amber-800 font-mono font-bold text-center text-[16px] md:text-sm shadow-sm" />
                   </label>
                 </>
               ) : (
                 <>
                   <label className="flex flex-col gap-1 w-full relative col-span-1 md:col-span-1">
                      <span className="text-[9px] font-bold text-slate-500/80 uppercase tracking-widest text-center truncate">NGÀY(AL)</span>
                      <FastInput type="number" min="1" max="30" value={lDay} onChange={(e: any) => setLDay(e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-slate-200/80 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white font-mono font-bold text-slate-700 text-center text-[16px] md:text-sm shadow-sm" />
                   </label>
                   <label className="flex flex-col gap-1 w-full relative col-span-1 md:col-span-1">
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="text-[9px] font-bold text-slate-500/80 uppercase tracking-widest truncate">THÁNG(AL)</span>
                        <input type="checkbox" id="leap-check" checked={lIsLeap} onChange={e => setLIsLeap(e.target.checked)} className="w-2.5 h-2.5" title="Tháng nhuận?" />
                      </div>
                      <FastInput type="number" min="1" max="12" value={lMonth} onChange={(e: any) => setLMonth(e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-slate-200/80 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white font-mono font-bold text-slate-700 text-center text-[16px] md:text-sm shadow-sm" />
                   </label>
                   <label className="flex flex-col gap-1 w-full relative col-span-1 md:col-span-1">
                      <span className="text-[9px] font-bold text-slate-500/80 uppercase tracking-widest text-center truncate">NĂM(AL)</span>
                      <FastInput type="number" min="1900" max="2100" value={lYear} onChange={(e: any) => setLYear(e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-slate-200/80 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white font-mono font-bold text-slate-700 text-center text-[16px] md:text-sm shadow-sm" />
                   </label>
                   <label className="flex flex-col gap-1 w-full relative col-span-1 md:col-span-1">
                      <span className="text-[9px] font-bold text-slate-500/80 uppercase tracking-widest text-center truncate">GIỜ</span>
                      <FastInput type="number" min="0" max="23" value={hourStr} onChange={(e: any) => setHourStr(e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-slate-200/80 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white font-mono font-bold text-slate-700 text-center text-[16px] md:text-sm shadow-sm" />
                   </label>
                 </>
               )}

               <label className="flex flex-col gap-1 w-full col-span-2 md:col-span-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">GIỚI TÍNH</span>
                  <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full px-1 py-1.5 rounded-lg border border-slate-200/80 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-bold text-slate-700 text-[16px] md:text-sm shadow-sm text-center">
                     <option value="M">Nam</option>
                     <option value="F">Nữ</option>
                  </select>
               </label>
               <label className="flex flex-col gap-1 w-full col-span-2 md:col-span-1 relative">
                  <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest text-center">NĂM XEM</span>
                  <input type="number" min="1900" max="2100" value={viewingYear} onChange={e => setViewingYear(e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-bold text-amber-700 text-center text-[16px] md:text-sm shadow-sm" />
               </label>
               <div className="col-span-4 md:col-span-2 flex flex-col justify-end mt-1 md:mt-0">
                  <input type="text" placeholder="Tên lá số / Ghi chú để lưu..." value={chartName} onChange={e => setChartName(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-medium text-slate-700 text-[16px] md:text-sm shadow-sm" />
               </div>
            </div>
             
             <div className="flex gap-2 w-full justify-between mt-0.5">
               <div className="flex gap-1.5">
                 <button 
                    onClick={() => setShowSettings(!showSettings)} 
                    title="Tuỳ chọn hiển thị"
                    className={`p-1.5 px-3 rounded-lg transition-all shadow-sm flex items-center justify-center border ${showSettings ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                   <Settings className="w-4 h-4" />
                 </button>
                 <button 
                    onClick={() => setShowSavedList(!showSavedList)}
                    className={`p-1.5 px-3 rounded-lg transition-all shadow-sm flex items-center justify-center border ${showSavedList ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                 >
                    {showSavedList ? <X className="w-4 h-4" /> : <List className="w-4 h-4" />}
                 </button>
               </div>

               <div className="flex gap-1.5 flex-1 justify-end">
                 <button onClick={handleSave} title="Lưu lá số" className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors flex items-center justify-center shadow-sm">
                   <Save className="w-4 h-4" />
                 </button>
                 <button 
                    onClick={handleGenerate}
                    className="flex-1 max-w-[160px] md:max-w-xs px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-lg shadow-md active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-2 border border-amber-600"
                 >
                    <Compass className="w-4 h-4 drop-shadow-sm" /> An Sao
                 </button>
               </div>
             </div>
          </div>

          {showSettings && (
             <div className="mt-1 pt-3 border-t border-slate-100/60 grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-4 text-[11px] md:text-xs font-semibold bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-[4px] flex items-center justify-center border transition-colors ${showThienHinh ? 'bg-amber-600 border-amber-600' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                    {showThienHinh && <span className="text-white text-[8px] md:text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="text-slate-600 whitespace-nowrap">Thiên Hình</span>
                  <input type="checkbox" className="hidden" checked={showThienHinh} onChange={e => setShowThienHinh(e.target.checked)} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-[4px] flex items-center justify-center border transition-colors ${showPhuTinh ? 'bg-amber-600 border-amber-600' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                    {showPhuTinh && <span className="text-white text-[8px] md:text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="text-slate-600 whitespace-nowrap">Các phụ tinh</span>
                  <input type="checkbox" className="hidden" checked={showPhuTinh} onChange={e => setShowPhuTinh(e.target.checked)} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-[4px] flex items-center justify-center border transition-colors ${showLuuTieuVan ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                    {showLuuTieuVan && <span className="text-white text-[8px] md:text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis inline-block w-full">Lộc/Kình/Đà tiểu vận</span>
                  <input type="checkbox" className="hidden" checked={showLuuTieuVan} onChange={e => setShowLuuTieuVan(e.target.checked)} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-[4px] flex items-center justify-center border transition-colors ${showLuuTuHoa ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                    {showLuuTuHoa && <span className="text-white text-[8px] md:text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis inline-block w-full">Lưu tứ hóa tiểu vận</span>
                  <input type="checkbox" className="hidden" checked={showLuuTuHoa} onChange={e => setShowLuuTuHoa(e.target.checked)} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-[4px] flex items-center justify-center border transition-colors ${showLuuNienKhac ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                    {showLuuNienKhac && <span className="text-white text-[8px] md:text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis inline-block w-full">Lưu niên tinh khác</span>
                  <input type="checkbox" className="hidden" checked={showLuuNienKhac} onChange={e => setShowLuuNienKhac(e.target.checked)} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-[4px] flex items-center justify-center border transition-colors ${showLuuDaiVan ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                    {showLuuDaiVan && <span className="text-white text-[8px] md:text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="text-slate-600 whitespace-nowrap">Lưu đại vận</span>
                  <input type="checkbox" className="hidden" checked={showLuuDaiVan} onChange={e => setShowLuuDaiVan(e.target.checked)} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-[4px] flex items-center justify-center border transition-colors ${showCungTieuVan ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                    {showCungTieuVan && <span className="text-white text-[8px] md:text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="text-slate-600 whitespace-nowrap">Cung tiểu vận</span>
                  <input type="checkbox" className="hidden" checked={showCungTieuVan} onChange={e => setShowCungTieuVan(e.target.checked)} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-[4px] flex items-center justify-center border transition-colors ${showCungDaiVan ? 'bg-rose-500 border-rose-500' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                    {showCungDaiVan && <span className="text-white text-[8px] md:text-[10px] font-bold">✓</span>}
                  </div>
                  <span className="text-slate-600 whitespace-nowrap">Cung đại vận</span>
                  <input type="checkbox" className="hidden" checked={showCungDaiVan} onChange={e => setShowCungDaiVan(e.target.checked)} />
                </label>
             </div>
          )}
        </div>

        {/* Quản lý hồ sơ list */}
        {showSavedList && (
           <div className="bg-white p-3 md:p-4 rounded-xl shadow-md border border-slate-200/60 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] md:text-xs font-serif pl-1 text-amber-800/80">Lá số đã lưu</h3>
              {savedCharts.length === 0 ? (
                 <p className="text-xs text-slate-400 italic pl-1">Chưa có lá số nào được lưu.</p>
              ) : (
                 <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {savedCharts.map(c => (
                       <div key={c.id} onClick={() => loadChart(c)} className="w-full flex items-center justify-between p-2 md:p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 hover:shadow-sm cursor-pointer transition-all group">
                          <div className="flex flex-col overflow-hidden pr-2 gap-0.5">
                             <span className="font-bold text-slate-700 truncate text-[11px] md:text-sm">{c.name}</span>
                             <span className="text-[9px] md:text-[11px] text-slate-400 font-medium">{c.day ? `${c.day}/${c.month}/${c.year}` : c.solarDate?.split('-').reverse().join('/')} ({c.hourStr}g, {c.gender === 'M' ? 'Nam' : 'Nữ'})</span>
                          </div>
                          <button onClick={(e) => deleteChart(c.id, e)} className="p-1.5 md:p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-100 rounded-md transition-colors" title="Xóa lá số">
                             <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        )}
      </div>

      <div 
        ref={containerRef}
        className="w-full min-w-0 transition-all duration-300 relative bg-slate-200/50 flex justify-center cursor-pointer touch-manipulation overflow-hidden border-t border-slate-300 shadow-inner rounded-xl"
        style={{ height: chartData ? Math.max(200, 1132 * scale) + 'px' : '500px' }} // Maintain wrapper height based on actual grid dimensions
        onDoubleClick={() => setIsFullscreen(true)}
      >
         {chartData ? (
           <>
             {/* The Unscaled 800px bounding box strictly constrained from the top-center */}
             <div 
               className="bg-transparent pointer-events-none origin-top absolute top-0 transition-transform duration-300"
               style={{ 
                  width: '800px',
                  height: '1100px', 
                  transform: `scale(${scale})`
               }}
             >
                {renderGrid()}
             </div>
           </>
         ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 py-32 px-4 text-center pointer-events-none">
               <Compass className="w-24 h-24 mb-6 opacity-20" />
               <p className="text-xl font-bold uppercase tracking-widest font-serif text-slate-500">Vui lòng điền thông tin</p>
               <p className="mt-2 text-sm max-w-sm text-slate-400">Tất cả dữ liệu được tính toán dựa trên thuật toán Tử Vi Đẩu Số và lịch Nông Học, kết quả có thể sai sót tùy thuộc vào giờ sinh nạp âm.</p>
            </div>
         )}
      </div>

      {/* AI Analysis Section */}
      {chartData && (
        <div className="w-full mt-10">
          <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-2xl border border-slate-100 flex flex-col relative overflow-hidden ring-1 ring-slate-50">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-50 rounded-2xl shadow-sm">
                  <BrainCircuit className="w-6 h-6 text-rose-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Luận Giải Tử Vi AI</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Advanced Zi Wei AI Engine
                  </p>
                </div>
              </div>

              {tuviChat.length === 0 && (
                <button 
                  onClick={() => analyzeTuVi()}
                  disabled={isAnalyzing}
                  className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${isAnalyzing ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-rose-600 hover:scale-[1.02] shadow-rose-200 active:scale-95'}`}
                >
                  {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  {isAnalyzing ? 'Đang Giải Mã...' : 'Khai Thị Lá Số'}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4 relative z-10">
              {/* Question Input Area */}
              <div className="flex flex-col gap-3">
                {/* AI Chat History */}
                <div className="flex-1 overflow-y-auto max-h-[600px] space-y-4 rounded-3xl bg-slate-50/50 p-3 sm:p-4 border border-slate-100 shadow-inner custom-scrollbar">
                  {tuviChat.length === 0 && !isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-30 grayscale group">
                      <MessageSquareShare className="w-14 h-14 text-slate-400 mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest max-w-[200px] leading-relaxed">
                        Chưa có dữ liệu luận giải.<br/>Hãy đặt câu hỏi để AI hỗ trợ.
                      </p>
                    </div>
                  )}

                  {tuviChat.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-full animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                      {msg.role === 'user' ? (
                        <div className="bg-slate-900 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-2xl rounded-tr-sm text-[11px] font-bold max-w-[90%] shadow-xl">
                          {msg.text}
                        </div>
                      ) : (
                        <div className="bg-white text-slate-800 px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl rounded-tl-sm border border-slate-100 w-full shadow-sm relative group markdown-content [&_p]:text-[13px] [&_p]:sm:text-[13px] [&_li]:text-[13px] [&_li]:sm:text-[13px] [&_h1]:text-[15px] [&_h2]:text-[14px] [&_h3]:text-[13px] [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:font-bold [&_strong]:text-slate-900 [&_h1]:font-black [&_h2]:font-black [&_h3]:font-black [&_h1]:text-black [&_h2]:text-black [&_h3]:text-black [&_h1]:mb-2 [&_h2]:mb-1 [&_h3]:mb-1 leading-relaxed">
                          {msg.text && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 transition-all">
                              <button
                                onClick={() => handleSpeak(msg.text, idx)}
                                className={`p-1.5 ${isReadingIndex === idx ? 'bg-rose-100 text-rose-600' : 'bg-white/80 text-slate-400 hover:text-rose-600 hover:bg-rose-50'} rounded-lg transition-all shadow-sm border border-slate-100`}
                                title={isReadingIndex === idx ? "Dừng đọc" : "Đọc nội dung"}
                              >
                                {isReadingIndex === idx ? <Square className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.text);
                                  setCopiedIndex(idx);
                                  setTimeout(() => setCopiedIndex(null), 2000);
                                }}
                                className="p-1.5 bg-white/80 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shadow-sm border border-slate-100"
                                title="Sao chép"
                              >
                                {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                          {msg.text ? <Markdown>{msg.text}</Markdown> : (
                            <div className="flex flex-row items-center h-8 gap-3 w-max">
                              <div className="flex gap-1.5 shrink-0 pl-1">
                                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce"></div>
                              </div>
                              <span className="text-xs font-black uppercase text-rose-500 tracking-wider whitespace-nowrap shrink-0 my-0 leading-none">Đang thỉnh Thiên Cơ...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                
                <div className="relative group">
                  <textarea
                    onFocus={(e) => {
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 300);
                    }}
                    disabled={isAnalyzing}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[16px] md:text-sm font-medium focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50 min-h-[80px] max-h-[160px] resize-none shadow-inner transition-all disabled:opacity-50"
                    placeholder="Đặt câu hỏi chi tiết về công danh, tài lộc, tình duyên..."
                    value={tuviQuestion + (interimTuviQuestion ? (tuviQuestion ? ' ' : '') + interimTuviQuestion : '')}
                    onChange={(e) => setTuviQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if ((tuviQuestion.trim() || interimTuviQuestion.trim()) && !isAnalyzing) {
                          analyzeTuVi(tuviQuestion + (interimTuviQuestion ? ' ' + interimTuviQuestion : ''));
                        }
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <VoiceInput 
                      onResult={(text, isFinal) => {
                        if (isFinal) {
                          setTuviQuestion(prev => (prev ? prev + ' ' + text : text));
                          setInterimTuviQuestion('');
                        } else {
                          setInterimTuviQuestion(text);
                        }
                      }}
                      className="p-3 bg-slate-100 text-slate-600 rounded-2xl shadow-sm hover:bg-slate-200"
                      iconSize={20}
                    />
                    {(tuviQuestion.trim() || interimTuviQuestion.trim()) && !isAnalyzing && (
                      <button
                        onClick={() => analyzeTuVi(tuviQuestion + (interimTuviQuestion ? ' ' + interimTuviQuestion : ''))}
                        className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg hover:bg-rose-700 transition-all active:scale-90"
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
      )}

      {/* FULLSCREEN LAYER */}
      {isFullscreen && chartData && (
         <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center touch-none overscroll-none fade-in animate-in">
            <TransformWrapper
              initialScale={Math.max(0.3, Math.min(1, window.innerWidth / 850))}
              minScale={0.2}
              maxScale={4}
              centerOnInit={true}
              doubleClick={{ disabled: true }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                 <div className="w-full h-full relative" onDoubleClick={() => setIsFullscreen(false)}>
                    <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                       <div className="w-[800px] lg:w-[1000px] p-4 cursor-grab active:cursor-grabbing">
                          {renderGrid()}
                       </div>
                    </TransformComponent>
                 </div>
              )}
            </TransformWrapper>
         </div>
      )}
    </div>
  );
};
