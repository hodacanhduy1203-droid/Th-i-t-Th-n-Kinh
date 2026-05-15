import React, { useState } from 'react';
import { THAI_AT_BOOK_TOC, TableOfContentItem, findContentById } from '../../services/thaiAt/bookData';
import { BookOpen, Search, ChevronRight, ChevronDown } from 'lucide-react';

export const BookReader: React.FC = () => {
  const [activeItemId, setActiveItemId] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState('');

  const activeContent = findContentById(THAI_AT_BOOK_TOC, activeItemId);

  const renderTocItem = (item: TableOfContentItem) => {
    const isExpanded = true; // Auto expand for now
    const isActive = activeItemId === item.id;

    return (
      <div key={item.id} className="mb-1">
        <button
          onClick={() => setActiveItemId(item.id)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors
            ${isActive ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-slate-100 text-slate-700'}
            ${item.level === 1 ? 'font-semibold mt-2' : 'ml-4'}
          `}
        >
          {item.children && (
            isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          {!item.children && <BookOpen className="w-3 h-3 text-amber-600/50" />}
          {item.title}
        </button>
        
        {item.children && isExpanded && (
          <div className="flex flex-col border-l-2 border-slate-100 ml-4 mt-1">
            {item.children.map(renderTocItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 h-[800px]">
      {/* Sidebar TOC */}
      <div className="w-80 border-r border-slate-200 bg-slate-50/50 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            Thư Viện Sách Toàn Tập
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tra cứu nội dung, chương..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
            />
          </div>
        </div>
        
        <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
          {THAI_AT_BOOK_TOC.map(renderTocItem)}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#fefaf6] flex flex-col">
        <div className="p-8 h-full overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {activeContent ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 flex items-center gap-3 text-amber-600/60 font-mono text-xs uppercase tracking-widest">
                  <BookOpen className="w-4 h-4" /> THÁI ẤT THẦN KINH - NGUYỄN HỒNG QUANG
                </div>
                <h1 className="text-3xl font-black text-amber-950 font-serif mb-8 leading-tight">
                  {activeContent.title}
                </h1>
                
                <div className="prose prose-amber max-w-none prose-p:leading-relaxed prose-p:text-slate-700">
                  {activeContent.content ? (
                     <div dangerouslySetInnerHTML={{ __html: activeContent.content.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <div className="p-8 bg-amber-50 border border-amber-100 rounded-2xl text-center text-amber-800">
                      <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Nội dung phần này chưa được cập nhật.</p>
                      <p className="text-sm opacity-80 mt-1">Vui lòng cung cấp trích đoạn từ sách để hệ thống cập nhật chính xác.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Chọn một mục bên trái để đọc sách
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
