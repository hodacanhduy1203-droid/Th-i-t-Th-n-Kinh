import React, { useState, useRef, useEffect } from "react";
import { Lock, Unlock } from "lucide-react";

const MOUNTAINS_24 = [
  { name: "Tý", num: 7, tri: "010", color: "red" },
  { name: "Quý", num: 9, tri: "010", color: "black" },
  { name: "Sửu", num: 4, tri: "011", color: "black" },
  { name: "Cấn", num: 6, tri: "100", color: "black" },
  { name: "Dần", num: 2, tri: "101", color: "red" },
  { name: "Giáp", num: 9, tri: "111", color: "red" },
  { name: "Mão", num: 1, tri: "001", color: "black" },
  { name: "Ất", num: 7, tri: "000", color: "black" },
  { name: "Thìn", num: 2, tri: "010", color: "red" },
  { name: "Tốn", num: 8, tri: "110", color: "red" },
  { name: "Tỵ", num: 4, tri: "011", color: "black" },
  { name: "Bính", num: 6, tri: "100", color: "red" },
  { name: "Ngọ", num: 3, tri: "101", color: "red" },
  { name: "Đinh", num: 1, tri: "011", color: "red" },
  { name: "Mùi", num: 6, tri: "001", color: "black" },
  { name: "Khôn", num: 4, tri: "000", color: "black" },
  { name: "Thân", num: 8, tri: "010", color: "black" },
  { name: "Canh", num: 1, tri: "001", color: "red" },
  { name: "Dậu", num: 9, tri: "011", color: "black" },
  { name: "Tân", num: 3, tri: "110", color: "black" },
  { name: "Tuất", num: 8, tri: "101", color: "red" },
  { name: "Càn", num: 2, tri: "111", color: "red" },
  { name: "Hợi", num: 4, tri: "001", color: "black" },
  { name: "Nhâm", num: 3, tri: "101", color: "red" },
];

const DIRECTIONS = [
  { name: "Khảm", symbol: "☵" },
  { name: "Cấn", symbol: "☶" },
  { name: "Chấn", symbol: "☳" },
  { name: "Tốn", symbol: "☴" },
  { name: "Ly", symbol: "☲" },
  { name: "Khôn", symbol: "☷" },
  { name: "Đoài", symbol: "☱" },
  { name: "Càn", symbol: "☰" }
];

const NUMBER_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const TRIGRAM_BITS: Record<string, number> = {
  "1": 0b010, // Khảm
  "2": 0b000, // Khôn
  "3": 0b001, // Chấn
  "4": 0b110, // Tốn
  "6": 0b111, // Càn
  "7": 0b011, // Đoài
  "8": 0b100, // Cấn
  "9": 0b101, // Ly
};

const resolveTrigramValue = (
  val: string,
  r?: number,
  c?: number,
  sideIdx?: number,
  extraData?: string[][][],
) => {
  if (
    val === "5" &&
    r !== undefined &&
    c !== undefined
  ) {
    // Actually we need gridNumberLeftData for center num check. But this is global, so we pass it or ignore.
    return val;
  }
  return val;
};

const getTrigramDisplay = (
  val: string,
  r?: number,
  c?: number,
  sideIdx?: number,
  extraData?: string[][][]
) => {
  const resolvedVal = resolveTrigramValue(val, r, c, sideIdx, extraData);
  const mapping: Record<string, string> = {
    "1": "☵",
    "2": "☷",
    "3": "☳",
    "4": "☴",
    "5": "",
    "6": "☰",
    "7": "☱",
    "8": "☶",
    "9": "☲",
  };
  return resolvedVal ? mapping[resolvedVal] || resolvedVal : "";
};

const getRootPalaceTrigram = (uVal: string, lVal: string) => {
  if (!uVal || !lVal || uVal === "5" || lVal === "5") return "";
  const U = TRIGRAM_BITS[uVal];
  const L = TRIGRAM_BITS[lVal];
  if (U === undefined || L === undefined) return "";
  const diff = U ^ L;
  let rootBits;
  switch (diff) {
    case 0:
    case 1:
    case 3:
    case 7:
      rootBits = U;
      break;
    case 6:
      rootBits = U ^ 1; // 1 is 0b001
      break;
    case 4:
      rootBits = U ^ 3; // 3 is 0b011
      break;
    case 5:
      rootBits = U ^ 2; // 2 is 0b010
      break;
    case 2:
      rootBits = L;
      break;
    default:
      return "";
  }
  for (const [key, val] of Object.entries(TRIGRAM_BITS)) {
    if (val === rootBits) return key;
  }
  return "";
};

const getBatSanTrigram = (uVal: string, lVal: string) => {
  if (!uVal || !lVal || uVal === "5" || lVal === "5") return "";
  const U = TRIGRAM_BITS[uVal];
  const L = TRIGRAM_BITS[lVal];
  if (U === undefined || L === undefined) return "";
  const diff = U ^ L;
  const XOR_TO_BAT_SAN: Record<number, string> = {
    0: "1",
    7: "9",
    2: "7",
    4: "6",
    3: "4",
    5: "3",
    6: "2",
    1: "8",
  };
  return XOR_TO_BAT_SAN[diff] || "";
};

const CustomNumberSelect = ({
  value,
  onChange,
  className,
  displayValue,
  textColorClass,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  displayValue?: string;
  textColorClass?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center shrink-0 ${isOpen ? "z-[1000]" : "z-10"}`}
      ref={containerRef}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-full cursor-pointer flex items-center justify-center select-none hover:bg-slate-50 transition-colors ${className || "text-lg md:text-3xl font-black"} ${textColorClass || "text-slate-600"}`}
      >
        {displayValue ?? (value || "\u00A0")}
      </div>

      {isOpen && (
        <div
          className={`absolute ${containerRef.current && containerRef.current.getBoundingClientRect().top > window.innerHeight / 2 ? "bottom-[100%]" : "top-[100%]"} ${containerRef.current && containerRef.current.getBoundingClientRect().left > window.innerWidth / 2 ? "right-0" : "left-0"} bg-white border border-slate-200 rounded-lg shadow-2xl flex flex-col items-center py-1 w-24 md:w-36 z-[9999] overflow-hidden`}
        >
          <div
            className="w-full text-center hover:bg-slate-50 cursor-pointer py-1 border-b border-slate-50 transition-colors"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            <span className="text-[0.6rem] md:text-lg text-rose-500 font-bold uppercase">
              X
            </span>
          </div>
          <div className="grid grid-cols-2 w-full">
            {NUMBER_OPTIONS.map((opt, i) => (
              <div
                key={i}
                className="cursor-pointer hover:bg-blue-50 active:bg-blue-100 w-full text-center py-2 md:py-4 flex items-center justify-center border-[0.5px] border-slate-50 transition-colors text-lg md:text-3xl font-black text-slate-700"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function Compass24() {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startAngle, setStartAngle] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  const [showRightTrigrams, setShowRightTrigrams] = useState(false);
  const [gridExtraData, setGridExtraData] = useState<string[][][]>(
    Array(3).fill(null).map(() => Array(3).fill(null).map(() => Array(4).fill("")))
  );
  const [gridNumberLeftData, setGridNumberLeftData] = useState<string[][]>(
    Array(3).fill(null).map(() => Array(3).fill(""))
  );
  
  const compassRef = useRef<HTMLDivElement>(null);

  const getCurrentMountain = () => {
    const degree = Math.round((-rotation % 360 + 360) % 360);
    const index = Math.floor(((degree + 7.5) % 360) / 15);
    return MOUNTAINS_24[index]?.name || "";
  };

  const calculateDegree = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!compassRef.current) return 0;
    const rect = compassRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return angle;
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLocked) return;
    setIsDragging(true);
    const angle = calculateDegree(e);
    setStartAngle(angle - rotation);
  };

  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const angle = calculateDegree(e);
    setRotation(angle - startAngle);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    } else {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, startAngle]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] select-none touch-none">
        {/* Fixed outer compass parts or background can go here */}
        
        {/* Rotatable Compass */}
        <div 
          ref={compassRef}
          className="absolute inset-0 rounded-full border-2 border-amber-800 shadow-2xl bg-[#FFFDF5] cursor-grab active:cursor-grabbing"
          style={{ transform: `rotate(${rotation}deg)`, transition: isDragging ? 'none' : 'transform 0.3s ease-out' }}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
        >
          {/* 360 Degree Scale */}
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="-200 -200 400 400">
            {Array.from({ length: 360 }).map((_, i) => {
              const isBig = i % 10 === 0;
              const isMed = i % 5 === 0;
              const tickLength = isBig ? 12 : isMed ? 7 : 4;
              return (
                <g key={i} transform={`rotate(${i})`}>
                  <line 
                    x1="0" y1="-198" 
                    x2="0" y2={-198 + tickLength} 
                    stroke="#92400e" 
                    strokeWidth={isBig ? 1.5 : 0.75} 
                    opacity={isBig ? 1 : 0.5} 
                  />
                  {isBig && (
                    <text 
                      x="0" y="-174" 
                      textAnchor="middle" 
                      fontSize="11" 
                      fill="#92400e" 
                      fontWeight="bold"
                    >
                      {i}°
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Inner circles */}
          <div className="absolute top-[8%] bottom-[8%] left-[8%] right-[8%] rounded-full border border-amber-300"></div>
          <div className="absolute top-[23%] bottom-[23%] left-[23%] right-[23%] rounded-full border-2 border-amber-700 bg-amber-50/70"></div>
          <div className="absolute top-[35%] bottom-[35%] left-[35%] right-[35%] rounded-full border border-amber-400 bg-white shadow-inner"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-800 shadow-md"></div>

          {/* 24 Mountains */}
          {MOUNTAINS_24.map((mountain, i) => {
            const angle = (i * 360) / 24;
            const textColor = mountain.color === 'red' ? 'text-red-600' : 'text-slate-800';
            const borderColor = mountain.color === 'red' ? 'border-red-600' : 'border-slate-800';
            const bgColor = mountain.color === 'red' ? 'bg-red-600' : 'bg-slate-800';
            
            return (
              <div
                key={mountain.name}
                className="absolute left-1/2 top-[8%] w-0 h-[42%] origin-bottom"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                {/* Separator lines for 24 mountains */}
                <div className="absolute left-0 top-0 w-[1px] h-full origin-bottom" style={{ transform: `rotate(7.5deg)` }}>
                  <div className="w-full h-[35.7%] bg-amber-400/60"></div>
                </div>
                
                <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center justify-start pt-[5%] h-full w-[24px]">
                  <div className={`text-[12px] sm:text-[14px] font-black tracking-tighter ${textColor} mb-0.5`}>
                    {mountain.name}
                  </div>
                  
                  {/* Trigram drawing */}
                  <div className="flex flex-col gap-[3px] sm:gap-[4px] mb-[1px] opacity-90 py-1">
                    {mountain.tri.split('').map((line, lineIdx) => (
                      <div key={lineIdx} className="flex gap-[2px] w-[14px] sm:w-[18px]">
                        {line === '1' ? (
                          <div className={`h-[3px] sm:h-[4px] w-full ${bgColor}`}></div>
                        ) : (
                          <>
                            <div className={`h-[3px] sm:h-[4px] w-[45%] ${bgColor}`}></div>
                            <div className={`h-[3px] sm:h-[4px] w-[45%] ${bgColor} ml-auto`}></div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 8 Directions */}
          {DIRECTIONS.map((dir, i) => {
            const angle = (i * 360) / 8;
            return (
              <div
                key={dir.name}
                className="absolute left-1/2 top-[23%] w-0 h-[27%] origin-bottom text-amber-900"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div className="absolute left-1/2 -translate-x-1/2 top-[12%] flex flex-col items-center">
                  <span className="text-[32px] sm:text-[40px] leading-none font-black opacity-100">{dir.symbol}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pointer (fixed) */}
        <div className="absolute left-1/2 -top-4 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[16px] border-t-red-600 z-10 pointer-events-none drop-shadow-md"></div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        {/* Nút nhập độ số */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-200 rounded-lg shadow-sm">
          <span className="text-sm font-bold text-amber-800">Độ số:</span>
          <input 
            type="number"
            min="0"
            max="360"
            value={Math.round((-rotation % 360 + 360) % 360)}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              setRotation(-val);
            }}
            className="w-16 text-center outline-none bg-transparent font-bold text-slate-700"
            disabled={isLocked}
          />
        </div>
        
        {/* Hiện ra sơn */}
        <div className="px-4 py-2 bg-amber-100 border border-amber-300 rounded-lg shadow-sm text-sm font-bold text-amber-900 min-w-[100px] text-center">
          Sơn: {getCurrentMountain()}
        </div>

        {/* Khôi phục */}
        <button 
          onClick={() => setRotation(0)}
          disabled={isLocked}
          className="px-4 py-2 bg-amber-800 rounded-lg shadow-sm text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Khôi phục
        </button>

        {/* Khóa/Mở khóa */}
        <button 
          onClick={() => setIsLocked(!isLocked)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm text-sm font-bold transition-colors ${
            isLocked 
              ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" 
              : "bg-white border-amber-200 text-amber-800 hover:bg-amber-50"
          }`}
        >
          {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          {isLocked ? "Đã khóa" : "Mở khóa"}
        </button>
      </div>
      <div className="mt-2 text-xs text-slate-500 font-medium">Góc hiện tại: {(-rotation % 360 + 360) % 360 | 0}° (Vuốt hoặc kéo để xoay)</div>
      
      {/* 9-Palace Grid */}
      <div className="mt-12 w-full max-w-full sm:max-w-[80%] md:max-w-[60%] lg:max-w-[50%] shrink-0 mb-8 flex flex-col items-center">
        <div className="flex justify-end items-center w-full px-2 mb-2">
          <button
            onClick={() => setShowRightTrigrams(!showRightTrigrams)}
            className="text-xs px-3 py-1.5 md:px-4 md:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-bold transition-all active:scale-95 active:translate-y-px shadow-sm"
          >
            {showRightTrigrams
              ? "Hiển thị số (cột 4 ô)"
              : "Hiển thị quẻ (cột 4 ô)"}
          </button>
        </div>
        <div className="grid grid-cols-3 aspect-[100/130] w-full border-2 border-slate-400 rounded-xl md:rounded-3xl shadow-sm bg-white">
          {[0, 1, 2].map((rowIndex) => (
            <React.Fragment key={rowIndex}>
              {[0, 1, 2].map((colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`border-slate-400 flex items-center justify-center relative
                    ${rowIndex !== 2 ? "border-b-2" : ""} 
                    ${colIndex !== 2 ? "border-r-2" : ""}`}
                >
                  {/* Left Number Selection Cell (1-9) */}
                  <div className="w-[28%] h-full flex flex-col justify-center border-r border-slate-200">
                    <div className="h-full w-full">
                      <CustomNumberSelect
                        value={gridNumberLeftData[rowIndex][colIndex]}
                        onChange={(v) => {
                          const newData = [
                            ...gridNumberLeftData.map((row) => [...row]),
                          ];
                          newData[rowIndex][colIndex] = v;

                          if (
                            rowIndex === 1 &&
                            colIndex === 1 &&
                            (!v || v === "")
                          ) {
                            setGridNumberLeftData(
                              Array(3).fill(null).map(() => Array(3).fill("")),
                            );
                            return;
                          }

                          let filledCellsCount = 0;
                          for (let r = 0; r < 3; r++) {
                            for (let c = 0; c < 3; c++) {
                              if (newData[r][c] && newData[r][c] !== "")
                                filledCellsCount++;
                            }
                          }

                          if (filledCellsCount === 3) {
                            const rotatePath = (p: number[][]) =>
                              p.map(([r, c]) => [c, 2 - r]);
                            let f: number[][] = [
                              [1, 1], [2, 2], [1, 2], [2, 0], [0, 1], [2, 1], [0, 2], [1, 0], [0, 0],
                            ];
                            let b: number[][] = [
                              [1, 1], [2, 2], [2, 1], [0, 2], [1, 0], [1, 2], [2, 0], [0, 1], [0, 0],
                            ];
                            const paths: number[][][] = [];
                            for (let i = 0; i < 4; i++) {
                              paths.push(f);
                              f = rotatePath(f);
                            }
                            for (let i = 0; i < 4; i++) {
                              paths.push(b);
                              b = rotatePath(b);
                            }
                            for (const path of paths) {
                              const [r0, c0] = path[0];
                              const [r1, c1] = path[1];
                              const [r2, c2] = path[2];
                              if (
                                newData[r0][c0] &&
                                newData[r1][c1] &&
                                newData[r2][c2]
                              ) {
                                const v0 = parseInt(newData[r0][c0], 10);
                                const v1 = parseInt(newData[r1][c1], 10);
                                const v2 = parseInt(newData[r2][c2], 10);
                                if (!isNaN(v0) && !isNaN(v1) && !isNaN(v2)) {
                                  const diff1 = (v1 - v0 + 9) % 9;
                                  const diff2 = (v2 - v1 + 9) % 9;
                                  if (
                                    diff1 === diff2 &&
                                    (diff1 === 1 || diff1 === 8)
                                  ) {
                                    const step = diff1 === 1 ? 1 : -1;
                                    let currentVal = v0;
                                    for (let i = 0; i < path.length; i++) {
                                      const [r, c] = path[i];
                                      newData[r][c] = currentVal.toString();
                                      currentVal += step;
                                      if (currentVal > 9) currentVal = 1;
                                      if (currentVal < 1) currentVal = 9;
                                    }
                                    break;
                                  }
                                }
                              }
                            }
                          }

                          setGridNumberLeftData(newData);
                        }}
                        className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Main large input area */}
                  <div className="w-[42%] h-full flex flex-col border-r border-slate-200">
                    {[0, 1, 2, 3].map((midIdx) => {
                      let calculatedValue = "";
                      if (midIdx === 0) {
                        calculatedValue = getRootPalaceTrigram(
                          resolveTrigramValue(
                            gridExtraData[rowIndex][colIndex][0],
                            rowIndex, colIndex, 0, gridExtraData
                          ),
                          resolveTrigramValue(
                            gridExtraData[rowIndex][colIndex][1],
                            rowIndex, colIndex, 1, gridExtraData
                          ),
                        );
                      } else if (midIdx === 1) {
                        calculatedValue = getBatSanTrigram(
                          resolveTrigramValue(
                            gridExtraData[rowIndex][colIndex][0],
                            rowIndex, colIndex, 0, gridExtraData
                          ),
                          resolveTrigramValue(
                            gridExtraData[rowIndex][colIndex][1],
                            rowIndex, colIndex, 1, gridExtraData
                          ),
                        );
                      } else if (midIdx === 2) {
                        calculatedValue = getRootPalaceTrigram(
                          resolveTrigramValue(
                            gridExtraData[rowIndex][colIndex][2],
                            rowIndex, colIndex, 2, gridExtraData
                          ),
                          resolveTrigramValue(
                            gridExtraData[rowIndex][colIndex][3],
                            rowIndex, colIndex, 3, gridExtraData
                          ),
                        );
                      } else if (midIdx === 3) {
                        calculatedValue = getBatSanTrigram(
                          resolveTrigramValue(
                            gridExtraData[rowIndex][colIndex][2],
                            rowIndex, colIndex, 2, gridExtraData
                          ),
                          resolveTrigramValue(
                            gridExtraData[rowIndex][colIndex][3],
                            rowIndex, colIndex, 3, gridExtraData
                          ),
                        );
                      }
                      const displayString = getTrigramDisplay(calculatedValue);

                      return (
                        <div
                          key={midIdx}
                          className={`h-1/4 w-full relative flex items-center justify-center bg-slate-50 ${midIdx !== 3 ? "border-b border-slate-200" : ""}`}
                        >
                          <span
                            className={`text-slate-800 ${displayString && calculatedValue !== "5" ? "text-2xl md:text-[2rem] lg:text-[2.5rem] font-bold leading-none" : "text-lg md:text-2xl lg:text-3xl font-black"} transition-colors`}
                          >
                            {displayString}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Column of 4 small cells on the right */}
                  <div className="w-[30%] h-full flex flex-col">
                    {[0, 1, 2, 3].map((sideIdx) => (
                      <div
                        key={sideIdx}
                        className={`w-full h-1/4 ${sideIdx !== 3 ? "border-b border-slate-300" : ""}`}
                      >
                        <CustomNumberSelect
                          value={gridExtraData[rowIndex][colIndex][sideIdx]}
                          displayValue={
                            showRightTrigrams
                              ? getTrigramDisplay(
                                  gridExtraData[rowIndex][colIndex][sideIdx],
                                  rowIndex, colIndex, sideIdx, gridExtraData
                                )
                              : gridExtraData[rowIndex][colIndex][sideIdx] === "5"
                                ? resolveTrigramValue(
                                    gridExtraData[rowIndex][colIndex][sideIdx],
                                    rowIndex, colIndex, sideIdx, gridExtraData
                                  )
                                : undefined
                          }
                          className={`w-full h-full ${showRightTrigrams && gridExtraData[rowIndex][colIndex][sideIdx] !== "" && gridExtraData[rowIndex][colIndex][sideIdx] !== "5" ? "text-2xl md:text-[2.2rem] lg:text-[2.5rem] font-bold leading-none" : "text-lg md:text-2xl lg:text-3xl font-black"}`}
                          textColorClass={
                            !showRightTrigrams &&
                            gridExtraData[rowIndex][colIndex][sideIdx] === "5" &&
                            resolveTrigramValue(
                              gridExtraData[rowIndex][colIndex][sideIdx],
                              rowIndex, colIndex, sideIdx, gridExtraData
                            ) !== "5"
                              ? "text-red-500"
                              : "text-slate-800"
                          }
                          onChange={(v) => {
                            const newData = [
                              ...gridExtraData.map((r) => r.map((c) => [...c])),
                            ];
                            newData[rowIndex][colIndex][sideIdx] = v;

                            if (
                              rowIndex === 1 &&
                              colIndex === 1 &&
                              (!v || v === "")
                            ) {
                              for (let r = 0; r < 3; r++) {
                                for (let c = 0; c < 3; c++) {
                                  newData[r][c][sideIdx] = "";
                                }
                              }
                              setGridExtraData(newData);
                              return;
                            }

                            let filledCellsCount = 0;
                            for (let r = 0; r < 3; r++) {
                              for (let c = 0; c < 3; c++) {
                                if (
                                  newData[r][c][sideIdx] &&
                                  newData[r][c][sideIdx] !== ""
                                )
                                  filledCellsCount++;
                              }
                            }

                            if (filledCellsCount === 3) {
                              const rotatePath = (p: number[][]) =>
                                p.map(([r, c]) => [c, 2 - r]);
                              let f: number[][] = [
                                [1, 1], [2, 2], [1, 2], [2, 0], [0, 1], [2, 1], [0, 2], [1, 0], [0, 0],
                              ];
                              let b: number[][] = [
                                [1, 1], [2, 2], [2, 1], [0, 2], [1, 0], [1, 2], [2, 0], [0, 1], [0, 0],
                              ];
                              const paths: number[][][] = [];
                              for (let i = 0; i < 4; i++) {
                                paths.push(f);
                                f = rotatePath(f);
                              }
                              for (let i = 0; i < 4; i++) {
                                paths.push(b);
                                b = rotatePath(b);
                              }
                              for (const path of paths) {
                                const [r0, c0] = path[0];
                                const [r1, c1] = path[1];
                                const [r2, c2] = path[2];
                                if (
                                  newData[r0][c0][sideIdx] &&
                                  newData[r1][c1][sideIdx] &&
                                  newData[r2][c2][sideIdx]
                                ) {
                                  const v0 = parseInt(
                                    newData[r0][c0][sideIdx],
                                    10,
                                  );
                                  const v1 = parseInt(
                                    newData[r1][c1][sideIdx],
                                    10,
                                  );
                                  const v2 = parseInt(
                                    newData[r2][c2][sideIdx],
                                    10,
                                  );
                                  if (!isNaN(v0) && !isNaN(v1) && !isNaN(v2)) {
                                    const diff1 = (v1 - v0 + 9) % 9;
                                    const diff2 = (v2 - v1 + 9) % 9;
                                    if (
                                      diff1 === diff2 &&
                                      (diff1 === 1 || diff1 === 8)
                                    ) {
                                      const step = diff1 === 1 ? 1 : -1;
                                      let currentVal = v0;
                                      for (let i = 0; i < path.length; i++) {
                                        const [r, c] = path[i];
                                        newData[r][c][sideIdx] =
                                          currentVal.toString();
                                        currentVal += step;
                                        if (currentVal > 9) currentVal = 1;
                                        if (currentVal < 1) currentVal = 9;
                                      }
                                      break;
                                    }
                                  }
                                }
                              }
                            }
                            setGridExtraData(newData);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
