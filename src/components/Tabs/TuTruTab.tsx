import React, { useState } from "react";
import { 
  Zap, Globe, Target, Trash2, ArrowRight, RefreshCw, Bot, Menu
} from "lucide-react";
import Markdown from "react-markdown";

interface TuTruTabProps {
  gender: "male" | "female";
  setGender: (val: "male" | "female") => void;
  maleDate: any;
  femaleDate: any;
  handleBirthInputChange: (e: React.ChangeEvent<HTMLInputElement>, g: "male" | "female") => void;
  isCalculatingTuTru: boolean;
  calculateTuTru: (g: "male" | "female") => void;
  tuTruResult: any;
  selectedTenYear: number;
  setSelectedTenYear: (val: number) => void;
  selectedYearYear: number;
  setSelectedYearYear: (val: number) => void;
  tuTruAnalysis: string;
  isAnalyzingTuTru: boolean;
  tuTruQuestion: string;
  setTuTruQuestion: (val: string) => void;
  analyzeTuTru: (res: any, question: string) => void;
  renderColoredCanChi: (text: string) => React.ReactNode;
  getNguHanhColor: (text: string) => string;
  t: (key: string) => string;
}

const TuTruTab: React.FC<TuTruTabProps> = ({
  gender,
  setGender,
  maleDate,
  femaleDate,
  handleBirthInputChange,
  isCalculatingTuTru,
  calculateTuTru,
  tuTruResult,
  selectedTenYear,
  setSelectedTenYear,
  selectedYearYear,
  setSelectedYearYear,
  tuTruAnalysis,
  isAnalyzingTuTru,
  tuTruQuestion,
  setTuTruQuestion,
  analyzeTuTru,
  renderColoredCanChi,
  getNguHanhColor,
  t,
}) => {
  const date = gender === "male" ? maleDate : femaleDate;

  return (
    <React.Fragment>
      <div className="w-full lg:w-[320px] shrink-0 space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
          <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">Lập Lá Số Bát Tự</h3>
            </div>

            <div className="space-y-4">
              <div className="flex bg-slate-200/50 p-1 rounded-xl">
                <button
                  onClick={() => setGender("male")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${gender === "male" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Nam Mệnh
                </button>
                <button
                  onClick={() => setGender("female")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${gender === "female" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Nữ Mệnh
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ngày Tháng Năm Dương Lịch</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Ngày"
                      value={date.day}
                      onChange={(e) => handleBirthInputChange(e, gender)}
                      name="day"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                    />
                    <input
                      type="number"
                      placeholder="Tháng"
                      value={date.month}
                      onChange={(e) => handleBirthInputChange(e, gender)}
                      name="month"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                    />
                    <input
                      type="number"
                      placeholder="Năm"
                      value={date.year}
                      onChange={(e) => handleBirthInputChange(e, gender)}
                      name="year"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Giờ & Phút</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Giờ"
                      value={date.hour}
                      onChange={(e) => handleBirthInputChange(e, gender)}
                      name="hour"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                    />
                    <input
                      type="number"
                      placeholder="Phút"
                      value={date.minute}
                      onChange={(e) => handleBirthInputChange(e, gender)}
                      name="minute"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => calculateTuTru(gender)}
                disabled={isCalculatingTuTru}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isCalculatingTuTru ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4 fill-current" /> Lập Lá Số</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        {tuTruResult ? (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm">
              <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
                {tuTruResult.pillars.map((p: any, i: number) => (
                  <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-colors">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {i === 0 ? "Năm" : i === 1 ? "Tháng" : i === 2 ? "Ngày" : "Giờ"}
                    </span>
                    <div className="text-lg sm:text-xl font-bold mb-1">{renderColoredCanChi(p.can)}</div>
                    <div className="text-lg sm:text-xl font-bold">{renderColoredCanChi(p.chi)}</div>
                  </div>
                ))}
              </div>
              
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-widest">Đại Sư Luận Giải</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <input
                      type="text"
                      onFocus={(e) => {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: "smooth", block: "end" });
                        }, 300);
                      }}
                      placeholder="Hỏi về vận thế, công danh, tình duyên..."
                      value={tuTruQuestion}
                      onChange={(e) => setTuTruQuestion(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-800 border-none rounded-xl text-[16px] md:text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      onClick={() => analyzeTuTru(tuTruResult, tuTruQuestion)}
                      disabled={isAnalyzingTuTru}
                      className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                    >
                      {isAnalyzingTuTru ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Hỏi AI"}
                    </button>
                  </div>
                  
                  {tuTruAnalysis && (
                    <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 min-h-[100px]">
                      <div className="prose prose-invert prose-sm max-w-none markdown-body">
                        <Markdown>{tuTruAnalysis}</Markdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-300">
               <Globe className="w-8 h-8" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-800">Chưa có lá số</h3>
               <p className="text-sm text-slate-400">Nhập thông tin bên trà trái để lập lá số Bát Tự</p>
             </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default TuTruTab;
