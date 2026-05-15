import React, { useState } from 'react';
import { BookReader } from './BookReader';
import { ThaiAtTab } from '../ThaiAtTab';
import { BookOpen, Compass, Search, Settings } from 'lucide-react';

export const ThaiAtApp: React.FC<any> = (props) => {
  const [activeTab, setActiveTab] = useState<'calc' | 'book' | 'examples'>('calc');

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top App Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-full mx-auto px-1 sm:px-2 lg:px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20 text-white">
                <Compass className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h1 className="font-black text-xl text-slate-800 font-serif leading-none tracking-tight">Thái Ất Thần Kinh</h1>
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest leading-none block mt-1">Toàn Tập 16 Cung</span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-4">
              <NavButton 
                active={activeTab === 'calc'} 
                onClick={() => setActiveTab('calc')}
                icon={<Compass className="w-4 h-4" />}
                label="Lập Bảng Thái Ất"
              />
              {/* <NavButton 
                active={activeTab === 'book'} 
                onClick={() => setActiveTab('book')}
                icon={<BookOpen className="w-4 h-4" />}
                label="Thư Viện Sách Toàn Tập"
              /> */}
              <NavButton 
                active={activeTab === 'examples'} 
                onClick={() => setActiveTab('examples')}
                icon={<Search className="w-4 h-4" />}
                label="Tra Cứu & Ví Dụ"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Render */}
      <main className="max-w-full mx-auto px-1 sm:px-2 lg:px-4 py-4 sm:py-8">
        {activeTab === 'calc' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Pass down props to the old ThaiAtTab for now. 
                 We will refactor ThaiAtTab to use the new Engine later. */}
             <ThaiAtTab {...props} />
          </div>
        )}
        
        {activeTab === 'book' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BookReader />
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <h3 className="text-2xl font-black text-slate-800 mb-6 font-serif flex items-center gap-2">
              <Search className="w-6 h-6 text-amber-600" />
              Ví Dụ Lập Quẻ Thực Tế (Sách Thái Ất Thần Kinh)
            </h3>
            
            <div className="space-y-6">
              {/* Example 1 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black">1</div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">Năm DL 196, Bính Tý (Hán Hiến Đế nguyên niên)</h4>
                    <span className="text-sm text-slate-500">Trích trang 207 - Tuế Kế 72 cục</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tuế Tích</span>
                    <span className="font-mono font-bold text-slate-700">10,154,113</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Thái Ất Cục / Nguyên</span>
                    <span className="font-bold text-slate-700">Cục 25 / Nguyên V</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Vị trí Thái Ất</span>
                    <span className="font-bold text-slate-700">Cung Kiền (Càn - 1)</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Văn Xương / Chủ Toán</span>
                    <span className="font-bold text-slate-700">Tý / 39 (Âm Giác)</span>
                  </div>
                </div>
                
                <div className="bg-red-50 text-red-900 p-4 rounded-xl text-sm border border-red-100">
                  <strong className="block mb-1">Kết quả luận giải:</strong>
                  Vua tôi bệnh, dân có dịch, thiên hạ đại dịch tễ, chết vô kể.
                </div>
              </div>

              {/* Example 2 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black">2</div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">Năm DL 916, Bính Tý (Lương Mạt Đế)</h4>
                    <span className="text-sm text-slate-500">Trích trang 208 - Tuế Kế</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tuế Tích</span>
                    <span className="font-mono font-bold text-slate-700">10,154,833</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Thái Ất Cục / Nguyên</span>
                    <span className="font-bold text-slate-700">Cục 25 / Nguyên V</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Chủ Toán</span>
                    <span className="font-bold text-slate-700">39</span>
                  </div>
                </div>
                
                <div className="bg-red-50 text-red-900 p-4 rounded-xl text-sm border border-red-100">
                  <strong className="block mb-1">Kết quả luận giải rẽ hai hướng:</strong>
                  <ul className="list-disc ml-4 space-y-1 mt-2">
                    <li><strong>Trung Nguyên:</strong> Vua bệnh, dân chết vô số. Đại chiến tại Nguyên Thành.</li>
                    <li><strong>Nước Việt Nam:</strong> Khúc Thừa Hạo làm tiết độ sứ (ứng điềm tự chủ).</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all
      ${active ? 'bg-amber-100 text-amber-900 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
    `}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);
