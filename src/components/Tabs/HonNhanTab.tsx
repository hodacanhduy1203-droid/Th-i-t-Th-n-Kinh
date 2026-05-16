import React from "react";
import { 
  Heart, Bot, RefreshCw, Menu
} from "lucide-react";
import Markdown from "react-markdown";

interface HonNhanTabProps {
  maleDate: any;
  femaleDate: any;
  handleMaleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFemaleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maleLunarInfo: any;
  femaleLunarInfo: any;
  getCompatibilityScore: (...args: any[]) => any;
  marriageQuestion: string;
  setMarriageQuestion: (val: string) => void;
  isAnalyzingMarriage: boolean;
  marriageAiAnalysis: string;
  analyzeMarriage: (...args: any[]) => void;
  MarriageDateTable: any;
  t: (key: string) => string;
}

const HonNhanTab: React.FC<HonNhanTabProps> = ({
  maleDate,
  femaleDate,
  handleMaleInputChange,
  handleFemaleInputChange,
  maleLunarInfo,
  femaleLunarInfo,
  getCompatibilityScore,
  marriageQuestion,
  setMarriageQuestion,
  isAnalyzingMarriage,
  marriageAiAnalysis,
  analyzeMarriage,
  MarriageDateTable,
  t,
}) => {
  const comp = getCompatibilityScore(
    maleLunarInfo,
    femaleLunarInfo,
    maleDate,
    femaleDate
  );

  return (
    <React.Fragment>
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        <MarriageDateTable
          title="Nam"
          date={maleDate}
          lunarInfo={maleLunarInfo}
          onChange={handleMaleInputChange}
        />
        <MarriageDateTable
          title="Nữ"
          date={femaleDate}
          lunarInfo={femaleLunarInfo}
          onChange={handleFemaleInputChange}
        />
      </div>

      {comp && (
        <div className="w-full space-y-4">
          <div className="bg-[#F2F2EB] border border-slate-200/60 rounded-3xl p-6 shadow-sm overflow-hidden relative group transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200/50">
                  <Heart size={32} fill="currentColor" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-serif font-black text-slate-800 uppercase tracking-tight leading-none mb-2">
                    Kết Quả Hòa Hợp
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-8 bg-amber-500 rounded-full"></div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                      Compatibility Result
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
                <div className="flex gap-8">
                  <div className="flex flex-col items-center group/item text-center">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Nam tốt</span>
                    <span className="text-3xl font-black text-blue-600 tracking-tighter tabular-nums">{comp.maleGoodPercent}%</span>
                  </div>
                  <div className="flex flex-col items-center group/item text-center">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Nữ tốt</span>
                    <span className="text-3xl font-black text-pink-600 tracking-tighter tabular-nums">{comp.femaleGoodPercent}%</span>
                  </div>
                </div>

                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-800 tracking-tighter">{comp.totalScore}%</span>
                    <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">Hòa Hợp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full bg-[#1e293b] rounded-3xl p-6 shadow-xl overflow-hidden relative">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                  <Bot size={24} />
                </div>
                <h3 className="font-bold text-white uppercase tracking-widest text-sm">Đại Sư Luận Giải Hôn Nhân</h3>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-2 w-full sticky bottom-0 z-50 bg-white/10 backdrop-blur-md p-2 rounded-xl">
                <input
                  type="text"
                  onFocus={(e) => {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: "smooth", block: "end" });
                    }, 300);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-800 border-none rounded-xl text-[16px] md:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Hãy hỏi về sự tương hợp, con cái, tài lộc..."
                  style={{ scrollMarginBottom: '100px' }}
                  value={marriageQuestion}
                  onChange={(e) => setMarriageQuestion(e.target.value)}
                />
                <button
                  onClick={() => analyzeMarriage(comp, marriageQuestion)}
                  disabled={isAnalyzingMarriage}
                  className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isAnalyzingMarriage ? <RefreshCw className="animate-spin w-4 h-4" /> : "Hỏi AI"}
                </button>
              </div>

              {marriageAiAnalysis && (
                <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 min-h-[150px]">
                  <div className="prose prose-invert prose-sm max-w-none markdown-body">
                    <Markdown>{marriageAiAnalysis}</Markdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default HonNhanTab;
