import { handleAIError } from '../utils/aiErrorHandler';
import { sanitizeApiContents } from '../utils/aiHelpers';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CalendarDays, ChevronLeft, ChevronRight, Info, Clock, MapPin, 
  RefreshCw, Zap, Home, CheckCircle2, UserX, Activity, Heart, 
  Droplet, AlertTriangle, AlertCircle, Share2, Bookmark, ShieldAlert,
  ChevronDown, BrainCircuit, Sparkles, Send, Copy, Check, MessageSquareShare,
  Volume2, Square
} from 'lucide-react';
import { Solar, Lunar } from 'lunar-javascript';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceInput } from './VoiceInput';
import { getAI } from '../services/aiService';
import { GEMINI_MODEL } from '../constants/ai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { setupSpeechSynthesis, cancelSpeech, speakText as speakTextHelper } from '../lib/speech';

// --- Types ---
type Quality = 'Good' | 'Bad' | 'Neutral';
interface MappingItem { name: string; desc: string; }

interface XemNgayTabProps {
  onSwitchToKyMon: () => void;
  onRequireApiKey?: () => void;
}

// --- Constants & Mappings ---
const NINE_STAR_INFO: Record<string, {name: string, color: string, element: string, quality: string}> = {
  '1': { name: 'Nhất Bạch Thủy', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', element: 'Thủy', quality: 'Cát' },
  '2': { name: 'Nhị Hắc Thổ', color: 'bg-stone-500/15 text-stone-400 border-stone-500/30', element: 'Thổ', quality: 'Hung' },
  '3': { name: 'Tam Bích Mộc', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', element: 'Mộc', quality: 'Hung' },
  '4': { name: 'Tứ Lục Mộc', color: 'bg-green-500/15 text-green-400 border-green-500/30', element: 'Mộc', quality: 'Cát' },
  '5': { name: 'Ngũ Hoàng Thổ', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', element: 'Thổ', quality: 'Đại Hung' },
  '6': { name: 'Lục Bạch Kim', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', element: 'Kim', quality: 'Cát' },
  '7': { name: 'Thất Xích Kim', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', element: 'Kim', quality: 'Hung' },
  '8': { name: 'Bát Bạch Thổ', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', element: 'Thổ', quality: 'Đại Cát' },
  '9': { name: 'Cửu Tử Hỏa', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', element: 'Hỏa', quality: 'Cát' },
};

const STAR_TRANSLATE: Record<string, {name: string, desc: string}> = {
  // Cát Tinh
  '天德': { name: 'Thiên Đức', desc: 'Tốt mọi việc' },
  '月德': { name: 'Nguyệt Đức', desc: 'Tốt mọi việc, giải hạn' },
  '天恩': { name: 'Thiên Ân', desc: 'Ơn trời báp xuống, tốt cúng bái' },
  '月恩': { name: 'Nguyệt Ân', desc: 'Tốt cho mọi việc' },
  '三合': { name: 'Tam Hợp', desc: 'Tốt cho cưới hỏi, giao dịch' },
  '天喜': { name: 'Thiên Hỷ', desc: 'Tốt cho vui vẻ, cưới hỏi' },
  '六合': { name: 'Lục Hợp', desc: 'Mọi việc hanh thông' },
  '解神': { name: 'Giải Thần', desc: 'Giải hóa tai ương, kiện tụng' },
  '司命': { name: 'Tư Mệnh', desc: 'Hoàng đạo, đại cát' },
  '凤辇': { name: 'Phượng Liễn', desc: 'Hoàng đạo, tốt xuất hành' },
  '宝光': { name: 'Bảo Quang', desc: 'Hoàng đạo, tốt công danh' },
  '玉堂': { name: 'Ngọc Đường', desc: 'Hoàng đạo, tốt học hành' },
  '金匮': { name: 'Kim Quỹ', desc: 'Hoàng đạo, tốt tài lộc' },
  '天府': { name: 'Thiên Phủ', desc: 'Tốt cho kho vựa, xây dựng' },
  '圣心': { name: 'Thánh Tâm', desc: 'Tốt cho cầu phúc, nhậm chức' },
  // Hung Tinh
  '月破': { name: 'Nguyệt Phá', desc: 'Xấu mọi việc, kỵ xây dựng' },
  '岁破': { name: 'Tuế Phá', desc: 'Rất xấu cho việc lớn' },
  '大耗': { name: 'Đại Hao', desc: 'Tốn kém tài lộc' },
  '劫煞': { name: 'Kiếp Sát', desc: 'Xấu cho xuất hành, giá thú' },
  '灾煞': { name: 'Tai Sát', desc: 'Kỵ mọi việc' },
  '月煞': { name: 'Nguyệt Sát', desc: 'Xấu khởi công' },
  '朱雀': { name: 'Chu Tước', desc: 'Hắc đạo, kỵ tranh chấp' },
  '白虎': { name: 'Bạch Hổ', desc: 'Hắc đạo, kỵ tang sự' },
  '玄武': { name: 'Huyền Vũ', desc: 'Hắc đạo, kỵ đi xa' },
  '天刑': { name: 'Thiên Hình', desc: 'Hắc đạo, kỵ kiện tụng' },
  'Câu Trần': { name: 'Câu Trần', desc: 'Hắc đạo, kỵ dời chỗ' }
};

const TERMS_EXPLAIN: Record<string, string> = {
  'Trực': 'Thập Nhị Trực là 12 trạng thái của vũ trụ, giúp xác định tính chất cát hung của ngày.',
  'Nhị Bát Tú': '28 chòm sao trên bầu trời, phản ánh sự vận hành của tinh tú lên vận mệnh con người.',
  'Lục Nhâm': 'Hệ thống bói toán dựa trên 6 trạng thái luân chuyển của thời gian.',
  'Hoàng Đạo': 'Ngày có các sao tốt cai quản, thuận lợi cho mọi việc đại sự.',
  'Hắc Đạo': 'Ngày có các sao xấu cai quản, cần cẩn trọng trong mọi việc.',
  'Tam Nguyên Cửu Vận': 'Hệ thống tính toán vận khí của đất trời qua các chu kỳ 20 năm.',
  'Hạc Thần': 'Vị thần cai quản phương vị, giúp tránh xui xẻo khi xuất hành.'
};

const TRUC_MAP: Record<string, MappingItem> = {
  '建': { name: 'Kiến', desc: 'Tốt cho xuất hành, nhậm chức. Tránh động thổ.' },
  '除': { name: 'Trừ', desc: 'Tốt cho cúng bái, chữa bệnh. Tránh khai trương.' },
  '满': { name: 'Mãn', desc: 'Tốt cho xây dựng, sửa chữa. Tránh kiện tụng.' },
  '平': { name: 'Bình', desc: 'Tốt cho mọi việc bình thường. Tránh tranh chấp.' },
  '定': { name: 'Định', desc: 'Tốt cho cưới hỏi, ký kết. Tránh kiện tụng.' },
  '执': { name: 'Chấp', desc: 'Tốt cho xây dựng. Tránh dời nhà.' },
  '破': { name: 'Phá', desc: 'Tốt cho phá dỡ, chữa bệnh. Tránh cưới hỏi.' },
  '危': { name: 'Nguy', desc: 'Tốt cho vạn sự (với tâm thế cẩn trọng). Tránh đi xa.' },
  '成': { name: 'Thành', desc: 'Đại cát, tốt cho mọi việc khởi đầu.' },
  '收': { name: 'Thu', desc: 'Tốt cho nhập kho, cầu tài. Tránh cưới hỏi.' },
  '开': { name: 'Khai', desc: 'Tốt cho khai trương, động thổ. Tránh an táng.' },
  '闭': { name: 'Bế', desc: 'Tốt cho đắp đập, lấp hang. Tránh mọi sự.' },
};

const XIU_MAP: Record<string, {name: string, msg: string}> = {
  '角': { name: 'Giác', msg: 'Tốt cho cưới hỏi, thi cử. Tránh an táng.' },
  '亢': { name: 'Cang', msg: 'Tốt cho khai trương. Tránh kiện tụng.' },
  '氐': { name: 'Đê', msg: 'Tốt cho xây dựng. Tránh cưới hỏi.' },
  '房': { name: 'Phòng', msg: 'Đại cát, vạn sự hanh thông.' },
  '心': { name: 'Tâm', msg: 'Xấu cho vạn sự, kỵ khởi công.' },
  '尾': { name: 'Vĩ', msg: 'Tốt cho xây dựng, an táng.' },
  '箕': { name: 'Cơ', msg: 'Tốt cho cầu tài, nhậm chức.' },
  '斗': { name: 'Đẩu', msg: 'Đại cát, tốt cho cưới hỏi, thi cử.' },
  '牛': { name: 'Ngưu', msg: 'Xấu cho cưới hỏi, xây dựng.' },
  '女': { name: 'Nữ', msg: 'Kỵ mọi việc, nhất là cưới hỏi.' },
  '虚': { name: 'Hư', msg: 'Xấu cho xây dựng, khởi công.' },
  '危': { name: 'Nguy', msg: 'Tốt cho thi cử, nhậm chức.' },
  '室': { name: 'Thất', msg: 'Đại cát, vạn sự hanh thông.' },
  '壁': { name: 'Bích', msg: 'Tốt cho xây dựng, dời chỗ.' },
  '奎': { name: 'Khuê', msg: 'Tốt cho văn chương, thi cử.' },
  '娄': { name: 'Lâu', msg: 'Tốt cho thi cử, nhận tước.' },
  '胃': { name: 'Vị', msg: 'Cát, tốt cho vạn sự.' },
  '昴': { name: 'Mão', msg: 'Xấu, kỵ dời nhà, đi xa.' },
  '毕': { name: 'Tất', msg: 'Cát, tốt cho cưới hỏi, giao dịch.' },
  '觜': { name: 'Chủy', msg: 'Xấu cho xây đắp, dời chỗ.' },
  '参': { name: 'Sâm', msg: 'Tốt cho kiện tụng, nhậm chức.' },
  '井': { name: 'Tỉnh', msg: 'Xấu cho an táng, cưới hỏi.' },
  '鬼': { name: 'Quỷ', msg: 'Xấu mọi việc, kỵ khởi nghiệp.' },
  '柳': { name: 'Liễu', msg: 'Xấu cho cưới hỏi, tang lễ.' },
  '星': { name: 'Tinh', msg: 'Tốt cho xây dựng. Tránh cưới hỏi.' },
  '张': { name: 'Trương', msg: 'Cát, tốt cho cầu tài, thi chức.' },
  '翼': { name: 'Dực', msg: 'Cát, tốt cho cưới hỏi, thi cử.' },
  '轸': { name: 'Chẩn', msg: 'Đại cát, vạn sự như ý.' },
};

const translateGanZhi = (text: string) => {
  const map: Record<string, string> = {
    '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu', '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý',
    '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tỵ', '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi'
  };
  return text.split('').map(char => map[char] || char).join('');
};

const CHINESE_TRANSLATION: Record<string, string> = {
  // Directions
  '正南': 'Chính Nam', '正北': 'Chính Bắc', '正东': 'Chính Đông', '正西': 'Chính Tây',
  '东南': 'Đông Nam', '东北': 'Đông Bắc', '西南': 'Tây Nam', '西北': 'Tây Bắc',
  '东': 'Đông', '西': 'Tây', '南': 'Nam', '北': 'Bắc',
  // Branches
  '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tỵ', '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi',
  // Liu Yao (Six Oracles)
  '大安': 'Đại An', '留连': 'Lưu Niên', '速喜': 'Tốc Hỷ', '赤口': 'Xích Khẩu', '小吉': 'Tiểu Cát', '空亡': 'Không Vong',
  '先胜': 'Tốc Hỷ', '先负': 'Tiểu Cát', '友引': 'Lưu Niên', '佛灭': 'Không Vong',
  '先勝': 'Tốc Hỷ', '先負': 'Tiểu Cát', '仏滅': 'Không Vong',
  // Duties (Truc)
  '建': 'Kiến', '除': 'Trừ', '满': 'Mãn', '平': 'Bình', '定': 'Định', '执': 'Chấp', '破': 'Phá', '危': 'Nguy', '成': 'Thành', '收': 'Thu', '开': 'Khai', '闭': 'Bế',
  // Activities (Yi/Ji)
  '祭祀': 'Cúng bái', '祈福': 'Cầu phúc', '求嗣': 'Cầu tự', '开光': 'Khai quang', '塑绘': 'Tô vẽ', '齐醮': 'Làm lễ',
  '出火': 'Dời linh vị', '入宅': 'Vào nhà mới', '移徙': 'Dời chỗ', '安床': 'Kê giường', '修造': 'Xây sửa', '动土': 'Động thổ',
  '上梁': 'Gác đòn dông', '竖柱': 'Dựng cột', '开市': 'Khai trương', '立券': 'Ký kết', '交易': 'Giao dịch', '纳财': 'Cầu tài',
  '开仓': 'Mở kho', '出货财': 'Xuất hàng', '纳畜': 'Thu nhận vật nuôi', '安 Ngọ': 'An táng', '破土': 'Phá dỡ', '启钻': 'Cải táng',
  '除服': 'Xả tang', '成服': 'Mặc tang', '谢土': 'Tạ đất', '安葬': 'An táng', '修坟': 'Sửa mộ', '行丧': 'Lễ tang',
  '伐木': 'Đốn cây', '开柱眼': 'Mở cột', '架马': 'Dựng giá', '装修': 'Trang trí', '盖屋': 'Xây nhà', '开厕': 'Sửa hố xí',
  '治病': 'Chữa bệnh', '求医': 'Khám bệnh', '解除': 'Giải trừ', '合寿木': 'Đóng quan tài', '整手足甲': 'Cắt móng', '理发': 'Cắt tóc',
  '栽种': 'Trồng trọt', '牧养': 'Chăn nuôi', '纳采': 'Dạm hỏi', '订盟': 'Đính hôn', '嫁娶': 'Cưới hỏi', '进人口': 'Thêm người',
  '会亲友': 'Gặp bạn bè', '出行': 'Xuất hành', '赴任': 'Nhận chức', '入学': 'Đi học', '上官': 'Nhận chức', '署事': 'Nhận việc',
  '诸事不宜': 'Kỵ mọi việc', '无': 'Không có', '日值岁破': 'Ngày Tuế Phá', '日值月破': 'Ngày Nguyệt Phá',
  '黄道': 'Hoàng Đạo', '黑道': 'Hắc Đạo', '吉': 'Cát', '凶': 'Hung',
  '平治道涂': 'Làm đường', '馀事勿取': 'Việc khác chớ làm', '修饰垣墙': 'Xây tường', '破屋': 'Phá nhà', '坏垣': 'Dỡ tường',
  '余事勿取': 'Việc khác chớ làm', '打官司': 'Kiện tụng', '补垣': 'Vá tường', '塞穴': 'Lấp hố', '筑堤': 'Đắp đê', '作灶': 'Làm bếp',
  '入殓': 'Khâm liệm', '移柩': 'Di quan', '成除': 'Phát tang', '余事勿取 ': 'Việc khác chớ làm',
  '煞': 'Sát', '煞南': 'Sát Nam', '煞北': 'Sát Bắc', '煞东': 'Sát Đông', '煞西': 'Sát Tây',
  // Stars (JiShen/XiongSha)
  '青龙': 'Thanh Long', '白虎': 'Bạch Hổ', '朱雀': 'Chu Tước', '玄武': 'Huyền Vũ', '明堂': 'Minh Đường', '天刑': 'Thiên Hình', 
  '天德': 'Thiên Đức', '金匮': 'Kim Quỹ', '玉堂': 'Ngọc Đường', '司命': 'Tư Mệnh', '天牢': 'Thiên Lao', '勾陈': 'Câu Trần',
  '天恩': 'Thiên Ân', '母仓': 'Mẫu Thương', '时阳': 'Thời Dương', '生气': 'Sinh Khí', '益后': 'Ích Hậu', '灾煞': 'Tai Sát',
  '天火': 'Thiên Hỏa', '四忌': 'Tứ Kỵ', '八龙': 'Bát Long', '复日': 'Phục Nhật', '续世': 'Tục Thế', '月煞': 'Nguyệt Sát',
  '月虚': 'Nguyệt Hư', '血支': 'Huyết Chi', '天贼': 'Thiên Tặc', '五虚': 'Ngũ Hư', '土符': 'Thổ Phù', '归忌': 'Quy Kỵ',
  '血忌': 'Huyết Kỵ', '月德': 'Nguyệt Đức', '月恩': 'Nguyệt Ân', '四相': 'Tứ Tướng', '王日': 'Vương Nhật', '天仓': 'Thiên Thương',
  '不将': 'Bất Tương', '五合': 'Ngũ Hợp', '鸣吠对': 'Minh Phệ Đối', '月建': 'Nguyệt Kiến', '小时': 'Tiểu Thời', '土府': 'Thổ Phủ',
  '往亡': 'Vãng Vong', '要安': 'Yếu An', '死神': 'Tử Thần', '天马': 'Thiên Mã', '九虎': 'Cửu Hổ', '七鸟': 'Thất Điểu',
  '六蛇': 'Lục Xà', '官日': 'Quan Nhật', '吉期': 'Cát Kỳ', '玉宇': 'Ngọc Vũ', '大时': 'Đại Thời', '大败': 'Đại Bại',
  '咸池': 'Hàm Trì', '守日': 'Thủ Nhật', '天巫': 'Thiên Vu', '福德': 'Phúc Đức', '六仪': 'Lục Nghi', '金堂': 'Kim Đường',
  '厌对': 'Yếm Đối', '招摇': 'Chiêu Diêu', '九空': 'Cửu Không', '九坎': 'Cửu Khảm', '九焦': 'Cửu Tiêu', '相日': 'Tướng Nhật',
  '宝光': 'Bảo Quang', '天罡': 'Thiên Cương', '月刑': 'Nguyệt Hình', '月害': 'Nguyệt Hại', '游祸': 'Du Họa', '重日': 'Trùng Nhật',
  '时德': 'Thời Đức', '民日': 'Dân Nhật', '三合': 'Tam Hợp', '临日': 'Lâm Nhật', '时阴': 'Thời Âm', '鸣吠': 'Minh Phệ',
  '死气': 'Tử Khí', '地囊': 'Địa Nang', '月德合': 'Nguyệt Đức Hợp', '敬安': 'Kính An', '普护': 'Phổ Hộ', '解神': 'Giải Thần',
  '小耗': 'Tiểu Hao', '天德合': 'Thiên Đức Hợp', '月空': 'Nguyệt Không', '驿马': 'Dịch Mã', '天后': 'Thiên Hậu', '除神': 'Trừ Thần',
  '月破': 'Nguyệt Phá', '大耗': 'Đại Hao', '五离': 'Ngũ Ly', '阴德': 'Âm Đức', '福生': 'Phúc Sinh', '天吏': 'Thiên Lại',
  '致死': 'Trí Tử', '元武': 'Nguyên Vũ', '阳德': 'Dương Đức', '天喜': 'Thiên Hỷ', '天医': 'Thiên Y', '月厌': 'Nguyệt Yếm',
  '地火': 'Địa Hỏa', '四击': 'Tứ Kích', '大煞': 'Đại Sát', '大会': 'Đại Hội', '天愿': 'Thiên Nguyện', '六合': 'Lục Hợp',
  '五富': 'Ngũ Phú', '圣心': 'Thánh Tâm', '河魁': 'Hà Khôi', '劫煞': 'Kiếp Sát', '四穷': 'Tứ Cùng', '触水龙': 'Xúc Thủy Long',
  '八风': 'Bát Phong', '天赦': 'Thiên Xá', '五墓': 'Ngũ Mộ', '八专': 'Bát Chuyên', '阴错': 'Âm Thác', '四耗': 'Tứ Hao',
  '阳错': 'Dương Thác', '四废': 'Tứ Phế', '三阴': 'Tam Âm', '小会': 'Tiểu Hội', '阴道冲阳': 'Âm Đạo Xung Dương', '单阴': 'Đan Âm',
  '孤辰': 'Cô Thần', '阴位': 'Âm Vị', '行狠': 'Hành Ngoan', '了戾': 'Liễu Lệ', '绝阴': 'Tuyệt Âm', '纯阳': 'Thuần Dương',
  '岁薄': 'Tuế Bạc', '阴阳交破': 'Âm Dương Giao Phá', '阴阳俱错': 'Âm Dương Câu Thác', '阴阳击冲': 'Âm Dương Kích Xung', '逐阵': 'Trục Trận',
  '阳错阴冲': 'Dương Thác Âm Xung', '七符': 'Thất Phù', '天狗': 'Thiên Cẩu', '成日': 'Thành Nhật', '天符': 'Thiên Phù',
  '孤阳': 'Cô Dương', '绝阳': 'Tuyệt Dương', '纯阴': 'Thuần Âm', '阴神': 'Âm Thần', '阳破阴冲': 'Dương Phá Âm Xung',
  '三丧': 'Tam Tang', '鬼哭': 'Quỷ Khốc', '大退': 'Đại Thoái', '四离': 'Tứ Ly'
};

const translateText = (text: string) => {
  if (!text) return text;
  if (CHINESE_TRANSLATION[text]) return CHINESE_TRANSLATION[text];
  // Complex or split strings
  return text.split(/[ ,，]+/).map(part => CHINESE_TRANSLATION[part] || part).join(', ');
};

const translateLiuYao = (text: string) => {
  return CHINESE_TRANSLATION[text] || text;
};

const translateDirection = (dir: string) => {
  return CHINESE_TRANSLATION[dir] || dir;
};

const getPhuongViCatThan = (canNgayCN: string) => {
  const can = translateGanZhi(canNgayCN);
  let xi = '', cai = '', he = '';
  
  if (can === 'Giáp' || can === 'Kỷ') {
    xi = 'Đông Bắc (Cấn)';
    cai = 'Đông Nam (Tốn)';
    he = 'Tây Nam (Khôn)';
  } else if (can === 'Ất' || can === 'Canh') {
    xi = 'Tây Bắc (Càn)';
    cai = 'Tây Nam (Khôn)';
    he = 'Chính Bắc (Khảm)';
  } else if (can === 'Bính' || can === 'Tân') {
    xi = 'Tây Nam (Khôn)';
    cai = 'Tây Nam (Khôn)';
    he = 'Tây Nam (Khôn)';
  } else if (can === 'Đinh' || can === 'Nhâm') {
    xi = 'Chính Nam (Ly)';
    cai = 'Chính Bắc (Khảm)';
    he = 'Đông Nam (Tốn)';
  } else if (can === 'Mậu' || can === 'Quý') {
    xi = 'Đông Nam (Tốn)';
    cai = 'Chính Đông (Chấn)';
    he = 'Tây Bắc (Càn)';
  }
  
  return { xi, cai, he };
};

// --- Components ---

const Explainer: React.FC<{ title: string, content: string }> = ({ title, content }) => {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <Info 
        size={11} 
        className="text-slate-500 cursor-help hover:text-amber-600 transition-colors" 
        onClick={() => setShow(!show)}
      />
      <AnimatePresence>
        {show && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 w-56 bg-slate-900 ring-1 ring-white/10 text-white rounded-xl shadow-2xl text-xs font-medium leading-relaxed"
          >
            <p className="font-black text-amber-400 mb-1 border-b border-white/5 pb-1 uppercase tracking-widest">{title}</p>
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

const SectionHeader: React.FC<{ icon: any, title: string, isOpen?: boolean, onToggle?: () => void }> = ({ icon: Icon, title, isOpen, onToggle }) => (
  <button 
    onClick={onToggle}
    className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors"
  >
    <div className="flex items-center gap-2.5">
       <div className="p-1.5 bg-amber-100/50 text-amber-600 rounded-lg">
          <Icon size={14} />
       </div>
       <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">{title}</h2>
    </div>
    {onToggle && (
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
         <ChevronDown size={16} className="text-slate-500" />
      </motion.div>
    )}
  </button>
);

export const XemNgayTab: React.FC<XemNgayTabProps> = ({ onSwitchToKyMon, onRequireApiKey }) => {
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [birthYear, setBirthYear] = useState('');
  const [isTimesOpen, setIsTimesOpen] = useState(true);
  const [isFengShuiOpen, setIsFengShuiOpen] = useState(false);

  // AI States
  const [xemNgayChat, setXemNgayChat] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [xemNgayQuestion, setXemNgayQuestion] = useState('');
  const [interimXemNgayQuestion, setInterimXemNgayQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setupSpeechSynthesis();
    return () => cancelSpeech();
  }, []);

  const speakText = (text: string, index: number) => {
    if (speakingIndex === index) {
      cancelSpeech();
      setSpeakingIndex(null);
      return;
    }

    speakTextHelper(
      text,
      () => setSpeakingIndex(index),
      () => setSpeakingIndex(null),
      () => setSpeakingIndex(null)
    );
  };

  useEffect(() => {
    if (chatEndRef.current && xemNgayChat.length > 0) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [xemNgayChat]);

  const analyzeDay = async (customQuestion?: string) => {
    if (isAnalyzing) return;
    const questionToUse = customQuestion || xemNgayQuestion;
    setIsAnalyzing(true);
    try {
      const solarDateParts = dateStr.split('-');
      const solarDateFormatted = `Ngày ${solarDateParts[2]} tháng ${solarDateParts[1]} năm ${solarDateParts[0]}`;
      const lunarDate = `${data.lunar.getDay()}/${data.lunar.getMonth()}/${data.lunar.getYear()}`;
      const info = `
THÔNG TIN LỊCH TRÍCH XUẤT (GROUND TRUTH - PHẢI SỬ DỤNG CHÍNH XÁC CAO NHẤT):
- Ngày Dương lịch: ${solarDateFormatted}
- Ngày Âm lịch: ${lunarDate}
- CAN CHI CHUẨN: Ngày ${data.canChiDay}, Tháng ${data.canChiMonth}, Năm ${data.canChiYear}
- Trực: ${data.truc.name} (${data.truc.desc})
- Sao (Nhị bát tú): ${data.xiu.name} (${data.xiu.msg})
- Tiết khí: ${data.tietKhi}
- Hệ thống sao (Cửu tinh): Năm ${data.yStar.name}, Tháng ${data.mStar.name}, Ngày ${data.dStar.name}
- Thần sát: ${data.tianShen} (${data.tianShenType})
- Cát thần: ${data.js.map(translateText).join(', ')}
- Hung thần: ${data.xs.map(translateText).join(', ')}
- Việc nên làm (Nghi): ${data.yiAdvice}
- Việc kỵ (Kỵ): ${data.jiAdvice}
- Phương vị: Hỷ Thần (${data.directions.xi}), Tài Thần (${data.directions.cai}), Hạc Thần (${data.directions.he}), Phúc Thần (${data.directions.fu})
      `;

      const systemInstruction = `Bạn là Chuyên gia Phong thủy và Trạch nhật (chọn ngày tốt) uyên bác, am hiểu sâu sắc về Lịch Vạn Niên, Thập Nhị Kiến Trừ, Nhị Thập Bát Tú và Cửu Tinh.

NGUYÊN TẮC QUAN TRỌNG:
- PHẢI SỬ DỤNG CHÍNH XÁC CAN CHI VÀ THÔNG TIN NGÀY ĐƯỢC CUNG CẤP TRONG PHẦN "THÔNG TIN LỊCH TRÍCH XUẤT". 
- TUYỆT ĐỐI KHÔNG TỰ MÌNH TÍNH TOÁN LẠI CAN CHI HAY CÁC THÔNG SỐ KHÁC. DỮ LIỆU ĐÃ CUNG CẤP LÀ KẾT QUẢ TỪ LỊCH VẠN NIÊN CHUẨN XÁC NHẤT.
- Nếu người dùng hỏi về ngày, hãy khẳng định Can Chi của ngày đó ĐÚNG theo dữ liệu được cung cấp (ví dụ: "Sử dụng dữ liệu lịch trích xuất, đây là ngày ${data.canChiDay}...").

NHIỆM VỤ:
1. Phân tích tính chất cát hung của ngày dựa trên dữ liệu TRỰC TIẾP được cung cấp.
2. Đưa ra lời khuyên cụ thể cho các đầu việc: Cưới hỏi, Khai trương, Động thổ, Xuất hành, Tế tự...
3. Tư vấn giờ tốt (Hoàng đạo) và hướng tốt (Hỷ thần, Tài thần) dựa trên Can Chi và dữ liệu ngày đó.
4. Trình bày Markdown chuyên nghiệp. Không chào hỏi.
5. Luôn nhắc nhở "Đức năng thắng số".

THÔNG TIN NGÀY XEM:
${info}`;

      const userPrompt = questionToUse ? questionToUse : 'Hãy luận giải tổng quan về ngày này và cho biết nên làm việc gì tốt nhất.';
      const displayUserMsg = questionToUse ? questionToUse : 'Luận giải tổng quan ngày này.';
      
      const apiContents = sanitizeApiContents(xemNgayChat, userPrompt);

      setXemNgayChat(prev => [...prev, { role: 'user', text: displayUserMsg }, { role: 'model', text: '' }]);
      setXemNgayQuestion('');
      setInterimXemNgayQuestion('');

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
          setXemNgayChat(prev => {
            if (prev.length === 0) return prev;
            const newChat = [...prev];
            newChat[newChat.length - 1] = { ...newChat[newChat.length - 1], text: fullResp };
            return newChat;
          });
          lastUpdate = Date.now();
        }
      }
      // final update
      setXemNgayChat(prev => {
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
        setXemNgayChat(prev => {
          if (prev.length === 0) return prev;
          const newChat = [...prev];
          newChat[newChat.length - 1] = { ...newChat[newChat.length - 1], text: errorMsg };
          return newChat;
        });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const data = useMemo(() => {
    const solar = Solar.fromYmd(...(dateStr.split('-').map(Number) as [number, number, number]));
    const lunar = solar.getLunar();

    const solarStrRaw = `${solar.getDay()}/${solar.getMonth()}/${solar.getYear()}`;
    const weekDay = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][solar.getWeek()];
    
    const canChiDay = translateGanZhi(lunar.getDayInGanZhi());
    const canChiMonth = translateGanZhi(lunar.getMonthInGanZhi());
    const canChiYear = translateGanZhi(lunar.getYearInGanZhi());

    const tietKhi = translateText(lunar.getJieQi());
    const tianShen = translateText(lunar.getDayTianShen());
    const tianShenType = translateText(lunar.getDayTianShenType());
    
    // Improved Nine Star logic (Cửu Tinh)
    const getYStar = () => {
       const s = lunar.getYearNineStar();
       // In newer versions getNumber() might return Chinese or digit string
       const num = s.toString().charAt(0); // Often "一", "二" etc or "1", "2"
       // Use a simple map for Chinese digits if needed
       const cnMap: Record<string, string> = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9' };
       const finalNum = cnMap[num] || num;
       return NINE_STAR_INFO[finalNum] || { name: s.getName(), color: 'bg-slate-50 text-slate-500 border-slate-200', element: s.getElement(), quality: '?' };
    };
    const getMStar = () => {
       const s = lunar.getMonthNineStar();
       const num = s.toString().charAt(0);
       const cnMap: Record<string, string> = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9' };
       const finalNum = cnMap[num] || num;
       return NINE_STAR_INFO[finalNum] || { name: s.getName(), color: 'bg-slate-50 text-slate-500 border-slate-200', element: s.getElement(), quality: '?' };
    };
    const getDStar = () => {
       const s = lunar.getDayNineStar();
       const num = s.toString().charAt(0);
       const cnMap: Record<string, string> = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9' };
       const finalNum = cnMap[num] || num;
       return NINE_STAR_INFO[finalNum] || { name: s.getName(), color: 'bg-slate-50 text-slate-500 border-slate-200', element: s.getElement(), quality: '?' };
    };

    const yStar = getYStar();
    const mStar = getMStar();
    const dStar = getDStar();

    const dayLiuYao = lunar.getLiuYao();
    const liuYaoSequence = ['大安', '留连', '速喜', '赤口', '小吉', '空亡'];
    const dayIndex = liuYaoSequence.indexOf(dayLiuYao);

    const hours = lunar.getTimes().map((t: any, idx: number) => {
      const luckyGod = translateText(t.getTianShen());
      const servesAsGood = t.getTianShenType() === '黄道';
      const lucNhamNode = dayIndex !== -1 ? translateLiuYao(liuYaoSequence[(dayIndex + idx) % 6]) : '';
      
      return {
        name: translateGanZhi(t.getGanZhi()),
        time: t.getMinHm() + ' - ' + t.getMaxHm(),
        isGood: servesAsGood,
        tianShen: luckyGod,
        lucNham: lucNhamNode
      };
    });

    const catThan = getPhuongViCatThan(lunar.getDayGan());
    const directions = {
      xi: catThan.xi,
      cai: catThan.cai,
      he: catThan.he,
      fu: translateDirection(lunar.getPositionFuDesc()),
    };

    const luckyStarsList = lunar.getDayJiShen().map((s: any) => {
       const trans = translateText(s);
       return { name: trans, desc: STAR_TRANSLATE[s]?.desc || 'Cát tinh phù hộ' };
    });
    
    const badStarsList = lunar.getDayXiongSha().map((s: any) => {
       const trans = translateText(s);
       return { name: trans, desc: STAR_TRANSLATE[s]?.desc || 'Hung tinh cần kỵ' };
    });

    const yiAdvice = lunar.getDayYi().map(translateText).join(', ');
    const jiAdvice = lunar.getDayJi().map(translateText).join(', ');

    const conflictAges = `Tuổi ${translateGanZhi(lunar.getDayChongGan())}${translateGanZhi(lunar.getDayChong())} - Sát ${translateText(lunar.getDaySha())}`;
    
    // 12 Directives
    const rawDuty = typeof lunar.getZhiXing === 'function' ? lunar.getZhiXing() : '';
    const trucName = TRUC_MAP[rawDuty]?.name || (rawDuty ? translateText(rawDuty) : (TRUC_MAP[lunar.getDayZhi()]?.name || 'N/A'));

    const getHourRangeMap = (zhi: string) => {
      const map: Record<string, string> = {
        'Tý': '23h-1h', 'Sửu': '1h-3h', 'Dần': '3h-5h', 'Mão': '5h-7h',
        'Thìn': '7h-9h', 'Tỵ': '9h-11h', 'Ngọ': '11h-13h', 'Mùi': '13h-15h',
        'Thân': '15h-17h', 'Dậu': '17h-19h', 'Tuất': '19h-21h', 'Hợi': '21h-23h'
      };
      return map[zhi];
    };

    const ltpStates = ['Đại An', 'Lưu Niên', 'Tốc Hỷ', 'Xích Khẩu', 'Tiểu Cát', 'Không Vong'];
    const ltpMonth = lunar.getMonth() < 0 ? -lunar.getMonth() : lunar.getMonth();
    const ltpDayIdx = (ltpMonth - 1 + lunar.getDay() - 1) % 6;
    const ZHIS = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    
    const lyThuanPhong = ltpStates.map((s, idx) => {
       const matchedZhis = ZHIS.filter((zhi, zIdx) => (ltpDayIdx + zIdx) % 6 === idx);
       const timesDesc = matchedZhis.map(z => `${z}: ${getHourRangeMap(z)}`).join('; ');
       return { name: s, timesDesc };
    });

    const xiuName = lunar.getXiu();
    const xiuDetails = XIU_MAP[xiuName] || { name: translateText(xiuName), msg: '' };

    return {
      solarStrRaw, weekDay, canChiDay, canChiMonth, canChiYear,
      tietKhi, tianShen, tianShenType, yStar, mStar, dStar,
      hours, directions, luckyStarsList, badStarsList, yiAdvice, jiAdvice,
      conflictAges, trucName,
      lyThuanPhong, xiuDetails,
      lunarObj: lunar, solarObj: solar,
      // For AI Analysis
      lunar: lunar,
      truc: { name: trucName, desc: TRUC_MAP[rawDuty]?.desc || 'N/A' },
      xiu: { name: xiuDetails.name, msg: xiuDetails.msg },
      js: lunar.getDayJiShen(),
      xs: lunar.getDayXiongSha()
    };
  }, [dateStr]);

  const houseAnalysis = useMemo(() => {
    const year = parseInt(birthYear);
    if (isNaN(year) || year < 1920 || year > 2026) return null;
    const age = 2026 - year + 1;

    const birthLunar = Lunar.fromYmd(year, 1, 1);
    const bZhi = translateGanZhi(birthLunar.getYearZhi());
    const cZhi = translateGanZhi(data.lunarObj.getYearZhi());

    let isTamTai = false;
    if (['Thân', 'Tý', 'Thìn'].includes(bZhi)) isTamTai = ['Dần', 'Mão', 'Thìn'].includes(cZhi);
    if (['Dần', 'Ngọ', 'Tuất'].includes(bZhi)) isTamTai = ['Thân', 'Dậu', 'Tuất'].includes(cZhi);
    if (['Tỵ', 'Dậu', 'Sửu'].includes(bZhi)) isTamTai = ['Hợi', 'Tý', 'Sửu'].includes(cZhi);
    if (['Hợi', 'Mão', 'Mùi'].includes(bZhi)) isTamTai = ['Tỵ', 'Ngọ', 'Mùi'].includes(cZhi);

    const isKimLau = [1, 3, 6, 8].includes(age % 9);
    const hoIndex = ((Math.floor(age / 10) - 1 + (age % 10)) % 6 + 6) % 6;
    const hoMsg = ['Nhất Cát', 'Nhì Nghi', 'Tam Địa Sát', 'Tứ Tấn Tài', 'Ngũ Thọ Tử', 'Lục Hoang Ốc'][hoIndex];
    const isGoodHo = [0, 1, 3].includes(hoIndex);

    return { age, bZhi, isTamTai, isKimLau, hoMsg, canBuild: !isTamTai && !isKimLau && isGoodHo };
  }, [birthYear, data.lunarObj]);

  const handleDayNav = (offset: number) => {
    const current = new Date(dateStr);
    current.setDate(current.getDate() + offset);
    setDateStr(current.toISOString().split('T')[0]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 overflow-y-auto custom-scrollbar pb-32 font-sans">
      {/* Header Sticky */}
      <section className="px-4 pt-4 pb-4 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50 sticky top-0 z-40 backdrop-blur-xl border-b border-slate-200">
        <div className="flex items-center justify-between mb-3 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-[0_4px_25px_rgba(245,158,11,0.25)]">
                <CalendarDays className="w-5 h-5 text-white" />
             </div>
             <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Lịch Vạn Niên</h1>
                <p className="text-sm font-black text-amber-600 uppercase tracking-[0.2em] flex items-center">
                   PHONG THỦY & TIÊN TRÍ
                </p>
             </div>
          </div>
          <button 
            onClick={() => setDateStr(new Date().toISOString().split('T')[0])}
            className="p-2 bg-slate-100 hover:bg-amber-100 border border-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4 text-amber-600" />
          </button>
        </div>

        <div className="flex items-center justify-between p-1 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto backdrop-blur-sm">
          <button onClick={() => handleDayNav(-1)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all active:scale-90"><ChevronLeft className="w-5 h-5" /></button>
          <div className="flex flex-col items-center flex-1 px-3 cursor-pointer">
             <input 
              type="date" 
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="bg-transparent text-slate-800 font-black text-2xl outline-none text-center tracking-tighter w-full"
            />
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              <span className="text-sm font-black text-slate-500 uppercase tracking-widest">{data.weekDay}</span>
            </div>
          </div>
          <button onClick={() => handleDayNav(1)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all active:scale-90"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </section>

      <div className="px-3 mt-4 space-y-3.5 max-w-5xl mx-auto w-full">
        {/* Main Info Card */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] border border-slate-200 p-5 relative overflow-hidden shadow-sm"
        >
          <div className="absolute top-0 right-0 p-3">
             <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-widest ${data.tianShenType === 'Hoàng Đạo' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {data.tianShen} {data.tianShenType}
             </span>
          </div>

          <div className="flex items-start gap-5 mb-5 mt-2">
             <div className="text-center">
                <div className="text-[80px] font-black text-slate-800 leading-none tracking-tighter">{data.lunarObj.getDay()}</div>
                <div className="text-sm font-black text-amber-600 uppercase tracking-widest mt-2">Tháng {data.lunarObj.getMonth()}</div>
             </div>
             <div className="h-20 w-px bg-slate-200 self-center" />
             <div className="flex-1 pt-2">
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                   DL: {data.solarStrRaw}
                </div>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-2 mb-3">
                   <div className="flex flex-col">
                       <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold tracking-widest uppercase mb-0.5">Ngày</span>
                       <span className="text-[13px] sm:text-[15px] font-black text-slate-800 tracking-tight uppercase leading-none">{data.canChiDay}</span>
                   </div>
                   <div className="w-px h-5 sm:h-6 bg-slate-200"></div>
                   <div className="flex flex-col">
                       <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold tracking-widest uppercase mb-0.5">Tháng</span>
                       <span className="text-[13px] sm:text-[15px] font-black text-slate-800 tracking-tight uppercase leading-none">{data.canChiMonth}</span>
                   </div>
                   <div className="w-px h-5 sm:h-6 bg-slate-200"></div>
                   <div className="flex flex-col">
                       <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold tracking-widest uppercase mb-0.5">Năm</span>
                       <span className="text-[13px] sm:text-[15px] font-black text-slate-800 tracking-tight uppercase leading-none">{data.canChiYear}</span>
                   </div>
                </div>
                <div className="flex flex-wrap gap-2">
                   <span className="text-xs font-bold text-amber-700 bg-amber-100 border-amber-200 px-2 py-1 rounded-lg border uppercase tracking-widest">{data.tietKhi}</span>
                   <span className="text-xs font-bold text-emerald-700 bg-emerald-100 rounded-lg px-2 py-1 border border-emerald-200 uppercase tracking-widest">Tiến Thần</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200/60">
             {[
               { label: 'Trực', val: data.trucName, color: 'text-blue-600', tooltip: TERMS_EXPLAIN['Trực'] },
               { label: 'Nhị Bát Tú', val: XIU_MAP[data.lunarObj.getXiu()]?.name || 'N/A', color: 'text-emerald-600', tooltip: TERMS_EXPLAIN['Nhị Bát Tú'] },
               { label: 'Lục Nhâm', val: translateLiuYao(data.lunarObj.getLiuYao()), color: 'text-rose-600', tooltip: TERMS_EXPLAIN['Lục Nhâm'] }
             ].map((item, i) => (
                <div key={i} className="text-center">
                   <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center">
                     {item.label} <Explainer title={item.label} content={item.tooltip || ''} />
                   </div>
                   <p className={`text-xs font-black ${item.color}`}>{item.val}</p>
                </div>
             ))}
          </div>

          {/* Tam Nguyên Cửu Vận */}
          <div className="flex gap-2.5 pt-4 border-t border-slate-200/60 mt-4">
             {[
               { t: 'Năm', s: data.yStar }, { t: 'Tháng', s: data.mStar }, { t: 'Ngày', s: data.dStar }
             ].map((item, i) => (
                <div key={i} className={`flex-1 p-2.5 rounded-[1.25rem] border ${item.s.color} text-center flex flex-col justify-center`}>
                   <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-0.5">{item.t}</p>
                   <div className="text-xs font-black truncate">{item.s.name}</div>
                   <div className="text-xs font-bold uppercase mt-0.5 opacity-50">{item.s.quality}</div>
                </div>
             ))}
          </div>
        </motion.section>

        {/* Directions & Warnings */}
        <section className="grid grid-cols-2 gap-3.5">
           <div className="bg-white p-3.5 rounded-[1.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 text-center justify-center">
                 PHƯƠNG VỊ CÁT THẦN <Explainer title="Phương Vị" content="Hỷ Thần là hướng may mắn, Tài Thần là hướng cầu tài lộc, Hạc Thần là hướng an lành, hộ mệnh." />
              </h3>
              <div className="space-y-2">
                 {[
                   { l: 'Hỷ Thần', v: data.directions.xi, c: 'text-pink-500', i: Heart },
                   { l: 'Tài Thần', v: data.directions.cai, c: 'text-amber-600', i: Activity },
                   { l: 'Hạc Thần', v: data.directions.he, c: 'text-slate-500', i: ShieldAlert }
                 ].map((d, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                         <d.i size={10} className={d.c} />
                         <span className="text-xs font-black text-slate-500 uppercase">{d.l}</span>
                      </div>
                      <span className={`text-xs font-black ${d.c}`}>{d.v}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-white p-3.5 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                 <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-center">
                    TUỔI XUNG KHẮC
                 </h3>
                 <div className="text-center py-1">
                    <p className="text-xs font-black text-rose-500 tracking-tighter">{data.conflictAges}</p>
                    <p className="text-xs font-black text-slate-500 uppercase mt-0.5">Xung trong ngày</p>
                 </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                 <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">NÊN LÀM</p>
                 <p className="text-xs font-medium text-slate-500 leading-tight line-clamp-2 italic">{data.yiAdvice || 'N/A'}</p>
              </div>
           </div>
        </section>

        {/* Stars Detail */}
        <section className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm">
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> SAO TỐT
                 </h3>
                 <div className="space-y-2">
                    {data.luckyStarsList.slice(0, 3).map((s: any, i: number) => (
                       <div key={i}>
                          <div className="text-xs font-black text-emerald-600">{s.name}</div>
                          <div className="text-xs text-slate-500 italic leading-tight">{s.desc}</div>
                       </div>
                    ))}
                 </div>
              </div>
              <div>
                 <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <UserX size={12} /> SAO XẤU
                 </h3>
                 <div className="space-y-2">
                    {data.badStarsList.slice(0, 3).map((s: any, i: number) => (
                       <div key={i}>
                          <div className="text-xs font-black text-rose-600">{s.name}</div>
                          <div className="text-xs text-slate-500 italic leading-tight">{s.desc}</div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* Reading List: Luận Giải Chi Tiết */}
        <section className="bg-amber-50/50 p-4 rounded-[1.5rem] border border-amber-200 shadow-sm mt-4 text-slate-800">
           <h2 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-4 flex items-center justify-center border-b border-amber-200/50 pb-3"> LUẬN GIẢI CHI TIẾT </h2>
           
           <div className="space-y-4">
              {/* Sao tốt xấu */}
              <div>
                 <h3 className="text-xs font-black text-amber-900 mb-1">Sao tốt:</h3>
                 <p className="text-xs font-medium text-slate-700 leading-relaxed pl-2 border-l-2 border-emerald-400">
                   {data.luckyStarsList.length > 0 ? (
                     data.luckyStarsList.map((s: any) => <span key={s.name}><strong className="text-emerald-700">{s.name}:</strong> {s.desc}. </span>)
                   ) : 'Không có sao tốt.'}
                 </p>
                 
                 <h3 className="text-xs font-black text-amber-900 mb-1 mt-3">Sao xấu:</h3>
                 <p className="text-xs font-medium text-slate-700 leading-relaxed pl-2 border-l-2 border-rose-400">
                   {data.badStarsList.length > 0 ? (
                     data.badStarsList.map((s: any) => <span key={s.name}><strong className="text-rose-700">{s.name}:</strong> {s.desc}. </span>)
                   ) : 'Không có sao xấu.'}
                 </p>
              </div>

              {/* Giờ xuất hành (LT P) */}
              <div>
                 <h3 className="text-xs font-black text-amber-900 mb-1 mt-3">Giờ xuất hành:</h3>
                 <div className="text-xs font-medium text-slate-700 leading-relaxed pl-2 space-y-0.5">
                   {data.lyThuanPhong.map(l => (
                     <p key={l.name}><strong className="text-amber-700">- Giờ {l.name}:</strong> {l.timesDesc}</p>
                   ))}
                 </div>
              </div>

              <div className="border-t border-amber-200/60 pt-3">
                 <h3 className="text-xs font-black text-amber-900 mb-1">Ngày đại kỵ:</h3>
                 <p className="text-xs font-medium text-slate-700 leading-relaxed pl-2">
                   {data.conflictAges ? `Ngày này cần tránh tuổi: ${data.conflictAges}` : 'Ngày không phạm đại kỵ tuổi.'}
                 </p>
              </div>

              <div className="border-t border-amber-200/60 pt-3">
                 <h3 className="text-xs font-black text-amber-900 mb-1">Thập Nhị Bát Tú - Sao {data.xiuDetails.name}:</h3>
                 <p className="text-xs font-medium text-slate-700 leading-relaxed pl-2">
                   <strong>Luận giải:</strong> {data.xiuDetails.msg}
                 </p>
              </div>

              <div className="border-t border-amber-200/60 pt-3">
                 <h3 className="text-xs font-black text-amber-900 mb-1">Thập Nhị Kiến Trừ - Trực {data.trucName}:</h3>
                 <p className="text-xs font-medium text-slate-700 leading-relaxed pl-2">
                   <strong>Luận giải:</strong> {TRUC_MAP[data.lunarObj.getDayZhi()]?.desc || TRUC_MAP[typeof data.lunarObj.getZhiXing === 'function' ? data.lunarObj.getZhiXing() : '']?.desc || `Nên chú ý các việc liên quan đến trực ${data.trucName}.`}
                 </p>
              </div>

              <div className="border-t border-amber-200/60 pt-3">
                 <h3 className="text-xs font-black text-amber-900 mb-1">Giờ xuất hành (Lý Thuần Phong):</h3>
                 <div className="text-[11px] font-medium text-slate-700 leading-relaxed pl-2 space-y-1">
                   <p><strong>Giờ Đại An ({data.lyThuanPhong.find(l => l.name==='Đại An')?.timesDesc.replace(/;/g, ',')}):</strong> Mọi việc đa phần tốt lành. Người cầu tài đi hướng Tây Nam, xuất hành bình yên, gia đạo yên bình.</p>
                   <p><strong>Giờ Lưu Niên ({data.lyThuanPhong.find(l => l.name==='Lưu Niên')?.timesDesc.replace(/;/g, ',')}):</strong> Sự nghiệp khó thành, mọi việc trắc trở mờ mịt. Kiện cáo nên hoãn. Đi hướng Nam tìm kẻ mất cắp.</p>
                   <p><strong>Giờ Tốc Hỷ ({data.lyThuanPhong.find(l => l.name==='Tốc Hỷ')?.timesDesc.replace(/;/g, ',')}):</strong> Tin vui sắp tới. Sắp có tài lộc lợi ích, chăn nuôi gặp thuận lợi, đi xa gặp gỡ quan lộ may mắn.</p>
                   <p><strong>Giờ Xích Khẩu ({data.lyThuanPhong.find(l => l.name==='Xích Khẩu')?.timesDesc.replace(/;/g, ',')}):</strong> Dễ cáu gắt khẩu chiến, hay cãi cọ, dễ dính thị phi. Tốt nhất giữ mồm miệng, không nên làm việc lớn.</p>
                   <p><strong>Giờ Tiểu Cát ({data.lyThuanPhong.find(l => l.name==='Tiểu Cát')?.timesDesc.replace(/;/g, ',')}):</strong> Rất tốt lành. Có tiểu lợi, mọi việc thuận lợi. Có tin mừng, bệnh tật tiêu tan, gặp nhiều may mắn.</p>
                   <p><strong>Giờ Không Vong ({data.lyThuanPhong.find(l => l.name==='Không Vong')?.timesDesc.replace(/;/g, ',')}):</strong> Khó nên việc lớn, hao tài, tiến thoái lưỡng nan. Bệnh tật, mất cắp dễ xảy ra.</p>
                 </div>
              </div>

           </div>
        </section>

        {/* Detailed Times Accordion */}
        <section className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <SectionHeader 
             icon={Clock} 
             title="Giờ Hoàng Đạo & Hắc Đạo" 
             isOpen={isTimesOpen} 
             onToggle={() => setIsTimesOpen(!isTimesOpen)} 
           />
           <AnimatePresence>
             {isTimesOpen && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
               >
                  <div className="p-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 focus-mode-compact-grid">
                     {data.hours.map((h: any, i: number) => (
                        <div key={i} className={`p-1.5 rounded-lg border flex flex-col justify-center transition-all ${h.isGood ? 'bg-amber-100/50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                           <div className="flex justify-between items-center mb-0.5">
                              <span className={`text-[9px] font-black uppercase tracking-tight ${h.isGood ? 'text-amber-600' : 'text-slate-500'}`}>{h.name}</span>
                              <span className="text-[10px] font-black text-slate-800 tracking-tighter">{h.time}</span>
                           </div>
                           <div className="flex items-center justify-between gap-1 mt-0.5">
                              <span className={`text-[8px] font-bold uppercase ${h.isGood ? 'text-emerald-600' : 'text-rose-500'}`}>{h.lucNham}</span>
                              <span className="text-[8px] text-slate-500 italic opacity-80 truncate">{h.tianShen}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </section>

        {/* Feng Shui Accordion */}
        <section className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <SectionHeader 
             icon={Home} 
             title="Phong Thủy Xây Dựng 2026" 
             isOpen={isFengShuiOpen} 
             onToggle={() => setIsFengShuiOpen(!isFengShuiOpen)} 
           />
           <AnimatePresence>
             {isFengShuiOpen && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
               >
                  <div className="p-4 space-y-4">
                     <div className="flex items-center gap-2">
                        <input 
                           type="number" 
                           placeholder="Nhập năm sinh (VD: 1985)"
                           value={birthYear}
                           onChange={(e) => setBirthYear(e.target.value)}
                           className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-black outline-none focus:border-amber-500 text-xs shadow-inner placeholder-slate-400"
                        />
                     </div>
                     {houseAnalysis ? (
                        <div className="space-y-3">
                           <div className="grid grid-cols-4 gap-2">
                              {[
                                { l: 'Tuổi', v: houseAnalysis.age, sub: houseAnalysis.bZhi },
                                { l: 'Tam Tai', v: houseAnalysis.isTamTai ? 'PHẠM' : 'TỐT', c: houseAnalysis.isTamTai ? 'text-rose-600' : 'text-emerald-600' },
                                { l: 'Kim Lâu', v: houseAnalysis.isKimLau ? 'PHẠM' : 'TỐT', c: houseAnalysis.isKimLau ? 'text-rose-600' : 'text-emerald-600' },
                                { l: 'Hoang Ốc', v: houseAnalysis.hoMsg.split(' ')[0], c: houseAnalysis.canBuild ? 'text-emerald-600' : 'text-rose-600' }
                              ].map((x, i) => (
                                 <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                    <p className="text-xs font-black text-slate-500 uppercase mb-0.5 tracking-tighter">{x.l}</p>
                                    <p className={`text-xs font-black ${x.c || 'text-slate-800'}`}>{x.v}</p>
                                    {x.sub && <p className="text-xs font-bold text-amber-600 uppercase italic leading-none">{x.sub}</p>}
                                 </div>
                              ))}
                           </div>
                           <div className={`p-4 rounded-xl border shadow-sm ${houseAnalysis.canBuild ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30' : 'bg-gradient-to-r from-rose-500/10 to-red-500/10 border-rose-500/30'}`}>
                              <p className={`text-xs font-black text-center uppercase tracking-[0.1em] ${houseAnalysis.canBuild ? 'text-emerald-700' : 'text-rose-700'}`}>
                                 {houseAnalysis.canBuild ? 'TUỔI TỐT - NÊN ĐỘNG THỔ' : 'KHÔNG NÊN ĐỘNG THỔ NĂM NAY'}
                              </p>
                              <p className={`text-xs font-medium text-center mt-1 ${houseAnalysis.canBuild ? 'text-emerald-700/80' : 'text-rose-700/80'}`}>Gia chủ {houseAnalysis.age} tuổi gặp {houseAnalysis.hoMsg}. {houseAnalysis.canBuild ? 'Vạn sự cát tường.' : 'Nên cân nhắc mượn tuổi.'}</p>
                           </div>
                        </div>
                     ) : (
                        <div className="p-10 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-black uppercase tracking-[0.3em] opacity-80">
                           NHẬP NĂM SINH ĐỂ XEM
                        </div>
                     )}
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </section>

        {/* AI Analysis Section */}
        <section className="bg-[#f2e6d0] rounded-3xl border border-amber-300 shadow-xl overflow-hidden flex flex-col w-full mt-4">
          <div className="bg-[#e6d5ba] px-4 py-4 border-b border-amber-300/40 flex justify-between items-center text-left">
            <div className="flex items-center gap-2">
              <div className="bg-amber-100 p-1.5 rounded-xl shadow-md border border-white/50">
                <BrainCircuit className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h3 className="font-black text-[13px] sm:text-sm text-amber-950 uppercase tracking-widest leading-none">
                  Chuyên Gia Xem Ngày AI
                </h3>
                <p className="text-[10px] text-amber-900/60 uppercase font-black tracking-widest mt-0.5">
                  Dynamic Electional Coach
                </p>
              </div>
            </div>
            
            <button
              onClick={() => analyzeDay()}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-800 text-white rounded-xl text-[11px] font-black uppercase hover:bg-amber-950 disabled:opacity-50 transition-all shadow-lg active:scale-95 border border-white/20"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {xemNgayChat.length > 0 ? "Cập Nhật" : "Phân Tích"}
            </button>
          </div>

          <div className="p-2 sm:p-2 min-h-[100px] relative text-left">
            {xemNgayChat.length > 0 || isAnalyzing ? (
              <div className="overflow-y-auto max-h-[600px] space-y-4 rounded-xl p-1 custom-scrollbar select-text">
                {xemNgayChat.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} w-full animate-in fade-in duration-200`}
                  >
                    {msg.role === "user" ? (
                      <div className="relative group max-w-[92%] mb-1 select-text">
                        <div className="bg-[#4a1d12] text-white border border-orange-900/10 px-4 py-2.5 rounded-3xl rounded-tr-none text-[13px] font-medium shadow-md leading-relaxed">
                          {msg.text}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text);
                            setCopiedIndex(idx);
                            setTimeout(() => setCopiedIndex(null), 2000);
                          }}
                          className="absolute -top-2 -left-2 p-1 text-orange-200 hover:text-white bg-orange-900 rounded-lg border border-orange-100 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"
                          title="Sao chép câu hỏi"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="w-full shadow-sm relative group select-text">
                        <button
                          onClick={() => speakText(msg.text, idx)}
                          className={`absolute top-2 right-10 p-1.5 ${speakingIndex === idx ? "text-rose-500 bg-rose-50 border-rose-200" : "text-orange-400 hover:text-orange-700 bg-orange-50 border-orange-100"} rounded-lg border opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm`}
                          title={
                            speakingIndex === idx
                              ? "Dừng đọc"
                              : "Đọc văn bản"
                          }
                        >
                          {speakingIndex === idx ? (
                            <Square
                              className="w-3.5 h-3.5"
                              fill="currentColor"
                            />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text);
                            setCopiedIndex(idx);
                            setTimeout(() => setCopiedIndex(null), 2000);
                          }}
                          className="absolute top-2 right-2 p-1.5 text-orange-400 hover:text-orange-700 bg-orange-50 rounded-lg border border-orange-100 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"
                          title="Sao chép câu trả lời"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <div className="prose prose-slate max-w-none text-[13px] leading-[1.6] markdown-body p-1 sm:p-2">
                          {msg.text ? (
                            <Markdown remarkPlugins={[remarkGfm]}>
                              {msg.text}
                            </Markdown>
                          ) : (
                            <div className="flex flex-row items-center h-8 gap-3 w-max">
                              <div className="flex gap-1.5 shrink-0 pl-1">
                                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce"></div>
                              </div>
                              <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider whitespace-nowrap shrink-0 my-0 leading-none">
                                Sóng thiên cơ đang truyền tải...
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 opacity-40">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 ring-2 ring-orange-100">
                  <MessageSquareShare className="w-8 h-8 text-orange-200" />
                </div>
                <h4 className="text-sm font-black text-orange-950 mb-1 uppercase tracking-widest">
                  Sẵn sàng luận giải
                </h4>
                <p className="text-orange-900 text-[11px] max-w-[240px] font-bold">
                  Đặt câu hỏi hoặc nhấn nút Phân Tích để bắt đầu.
                </p>
              </div>
            )}
          </div>
          <div className="p-3 bg-[#fffbf0]/40 border-t border-amber-200/40 space-y-3">
            <div className="relative group">
              <textarea
                disabled={isAnalyzing}
                value={
                  xemNgayQuestion +
                  (interimXemNgayQuestion
                    ? (xemNgayQuestion ? " " : "") + interimXemNgayQuestion
                    : "")
                }
                onChange={(e) => setXemNgayQuestion(e.target.value)}
                placeholder="Hỏi AI về việc cần làm, giờ tốt cụ thể hoặc tuổi xung khắc..."
                className="w-full px-4 py-3 bg-white border border-orange-100 rounded-2xl text-[13px] font-medium outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/5 min-h-[50px] max-h-[120px] resize-none transition-all disabled:opacity-50 shadow-sm placeholder:text-orange-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (
                      (xemNgayQuestion.trim() || interimXemNgayQuestion.trim()) &&
                      !isAnalyzing
                    ) {
                      analyzeDay(
                        xemNgayQuestion +
                          (interimXemNgayQuestion
                            ? " " + interimXemNgayQuestion
                            : ""),
                      );
                    }
                  }
                }}
              />

              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-2">
                  <VoiceInput
                    onResult={(text, isFinal) => {
                      if (isFinal) {
                        setXemNgayQuestion((prev) =>
                          prev ? prev + " " + text : text,
                        );
                        setInterimXemNgayQuestion("");
                      } else {
                        setInterimXemNgayQuestion(text);
                      }
                    }}
                    className="p-2.5 bg-orange-50 text-orange-700 rounded-xl shadow-sm hover:bg-orange-100 border border-orange-100 transition-all active:scale-90"
                    iconSize={18}
                  />
                  <button
                    onClick={() => {
                      const lastMsgIdx = xemNgayChat
                        .map((m: any) => m.role)
                        .lastIndexOf("model");
                      if (lastMsgIdx !== -1) {
                        speakText(
                          xemNgayChat[lastMsgIdx].text,
                          lastMsgIdx,
                        );
                      } else {
                        alert("Chưa có câu trả lời nào từ AI để đọc.");
                      }
                    }}
                    className={`p-2.5 rounded-xl shadow-sm border transition-all active:scale-90 ${speakingIndex !== null ? "bg-rose-50 text-rose-500 hover:bg-rose-100 border-rose-100" : "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100"}`}
                    title={
                      speakingIndex !== null
                        ? "Dừng đọc"
                        : "Đọc câu trả lời gần nhất"
                    }
                  >
                    {speakingIndex !== null ? (
                      <Square
                        className="w-[18px] h-[18px]"
                        fill="currentColor"
                      />
                    ) : (
                      <Volume2 className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() =>
                    analyzeDay(
                      xemNgayQuestion +
                        (interimXemNgayQuestion ? " " + interimXemNgayQuestion : ""),
                    )
                  }
                  disabled={
                    isAnalyzing ||
                    (!xemNgayQuestion.trim() && !interimXemNgayQuestion.trim())
                  }
                  className="flex items-center gap-2 px-6 py-2.5 bg-orange-800 text-white rounded-xl shadow-lg shadow-orange-100 hover:bg-orange-950 transition-all active:scale-90 disabled:opacity-30 text-xs font-black uppercase tracking-wider"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi câu hỏi
                </button>
              </div>
            </div>
          </div>
        </section>



      </div>
    </div>
  );
};
