import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "../services/firebaseService";
import { X, Plus, Trash2, CheckCircle2, XCircle, Users, Key, Calendar } from "lucide-react";

interface AccessCode {
  id: string;
  code: string;
  active: boolean;
  owner?: string;
  uses: number;
  max_uses?: number;
  lastUsed?: any;
}

export default function AdminModal({ onClose }: { onClose: () => void }) {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "access_codes"), orderBy("code"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as AccessCode));
      setCodes(data);
    } catch (error) {
      console.error("Error fetching codes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleAddCode = async () => {
    if (!newCode) return;
    try {
      await setDoc(doc(db, "access_codes", newCode), {
        code: newCode,
        active: true,
        owner: newOwner || "Anonymous",
        uses: 0,
        createdAt: serverTimestamp()
      });
      setNewCode("");
      setNewOwner("");
      fetchCodes();
    } catch (error) {
      console.error("Error adding code:", error);
      alert("Lỗi khi thêm mã. Kiểm tra lại quyền Firestore.");
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, "access_codes", id), { active: !current });
      fetchCodes();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mã này?")) return;
    try {
      await deleteDoc(doc(db, "access_codes", id));
      fetchCodes();
    } catch (error) {
      console.error("Error deleting code:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-[#fcf8f1] rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] border border-amber-100">
        <div className="p-6 bg-gradient-to-r from-amber-900 to-slate-900 text-white flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest font-serif">Quản Lý Mã Truy Cập</h3>
              <p className="text-[10px] text-amber-200/60 uppercase font-bold">Dành cho Quản trị viên</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 bg-white border-b border-amber-50 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mã mới</label>
              <input
                type="text"
                placeholder="Ví dụ: AI-VIP-2024"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 outline-none transition-all font-mono text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Người sở hữu</label>
              <input
                type="text"
                placeholder="Tên hoặc Email..."
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 outline-none transition-all text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddCode}
                disabled={!newCode}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 text-white font-black rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> THÊM MÃ
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-amber-800 font-bold text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {codes.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
                  <Key className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">Chưa có mã nào được tạo.</p>
                </div>
              ) : (
                codes.map(code => (
                  <div key={code.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${code.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-800 tracking-wider uppercase">{code.code}</span>
                          {code.active ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-full uppercase">Đang chạy</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-500 text-[8px] font-black rounded-full uppercase">Đã khóa</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-[10px] text-slate-400 font-bold">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {code.owner}</span>
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {code.uses} lượt dùng</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => toggleStatus(code.id, code.active)}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors ${code.active ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      >
                        {code.active ? 'KHÓA MÃ' : 'MỞ MÃ'}
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="p-2 bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
