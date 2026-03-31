"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight, FileSpreadsheet, FileDown, Pencil, Trash2, X, PlusCircle, Save, Upload } from "lucide-react";
import * as xlsx from "xlsx";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const STATUS_COLORS: Record<string, string> = {
    'Completed': 'bg-green-100 text-green-700',
    'On Delivery': 'bg-blue-100 text-blue-700',
    'On Order': 'bg-orange-100 text-orange-700',
    'Partial': 'bg-purple-100 text-purple-700',
    'Overdue': 'bg-red-100 text-red-700',
};

const ALL_STATUSES = ['On Order', 'On Delivery', 'Partial', 'Completed', 'Overdue'];
const PART_STATUSES = ['On Order', 'Partial', 'Received'];

function toDateInput(val: any) {
    if (!val) return "";
    return new Date(val).toISOString().split("T")[0];
}

// ===================== EDIT MODAL =====================
function EditOrderModal({ order, onClose, onSaved }: { order: any; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState({
        no_order: order.no_order || "",
        tgl_order: toDateInput(order.tgl_order),
        no_rangka: order.no_rangka || "",
        model: order.model || "",
        no_polisi: order.no_polisi || "",
        nama_pelanggan: order.nama_pelanggan || "",
        status: order.status || "On Order",
    });
    const [parts, setParts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Fetch full order details (including parts)
        api.fetch(`/orders/${order.id}`)
            .then((data: any) => {
                setParts((data.parts || []).map((p: any) => ({
                    ...p,
                    eta: toDateInput(p.eta),
                    ata: toDateInput(p.ata),
                    etd: toDateInput(p.etd),
                })));
            })
            .catch(() => toast.error("Gagal memuat detail order"))
            .finally(() => setLoading(false));
    }, [order.id]);

    const handleFormChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

    const handlePartChange = (index: number, e: any) => {
        const newParts = [...parts];
        newParts[index] = { ...newParts[index], [e.target.name]: e.target.value };
        setParts(newParts);
    };

    const addPart = () => setParts([...parts, { no_part: "", nama_part: "", qty: 1, etd: "", eta: "", ata: "", status_part: "On Order", sisa: 1, suplai: 0 }]);

    const removePart = (index: number) => {
        if (parts.length > 1) {
            setParts(parts.filter((_, i) => i !== index));
        } else {
            toast.warning("Minimal 1 part harus ada");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.no_order || !form.nama_pelanggan) return toast.error("No Order dan Nama Pelanggan wajib diisi");

        setSaving(true);
        try {
            await api.fetch(`/orders/${order.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    ...form,
                    parts: parts.map(p => ({
                        ...p,
                        qty: Number(p.qty),
                        suplai: Number(p.suplai) || 0,
                        sisa: Number(p.sisa) !== undefined ? Number(p.sisa) : Number(p.qty),
                    }))
                })
            });
            toast.success("Order berhasil diupdate");
            onSaved();
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Gagal mengupdate order");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4">
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-brand-secondary dark:text-white">Edit Order</h2>
                        <p className="text-sm text-gray-500 mt-0.5">#{order.no_order}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-16 text-gray-400">
                        <svg className="animate-spin h-8 w-8 mr-3 text-brand-primary" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Memuat data...
                    </div>
                ) : (
                    <form onSubmit={handleSave}>
                        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
                            {/* Data Kendaraan */}
                            <div>
                                <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2">
                                    <span className="w-5 h-0.5 bg-brand-primary inline-block"></span>Data Kendaraan & Pelanggan
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { label: "No. Order", name: "no_order", type: "text", mono: true },
                                        { label: "Tanggal Order", name: "tgl_order", type: "date" },
                                        { label: "Nama Pelanggan", name: "nama_pelanggan", type: "text" },
                                        { label: "No. Polisi", name: "no_polisi", type: "text", mono: true },
                                        { label: "No. Rangka", name: "no_rangka", type: "text", mono: true },
                                        { label: "Model", name: "model", type: "text" },
                                    ].map(f => (
                                        <div key={f.name}>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                                            <input
                                                name={f.name}
                                                type={f.type}
                                                value={(form as any)[f.name]}
                                                onChange={handleFormChange}
                                                className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none ${f.mono ? "font-mono uppercase" : ""}`}
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Status Order</label>
                                        <select
                                            name="status"
                                            value={form.status}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                        >
                                            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Parts */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                                        <span className="w-5 h-0.5 bg-brand-primary inline-block"></span>Detail Parts ({parts.length})
                                    </h3>
                                    <button type="button" onClick={addPart} className="flex items-center gap-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                                        <PlusCircle className="w-3.5 h-3.5" /> Tambah Part
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {parts.map((p, i) => (
                                        <div key={i} className="bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-200 dark:border-gray-800 p-3 relative group">
                                            <div className="absolute -left-2 -top-2 bg-brand-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow">{i + 1}</div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                                {[
                                                    { label: "No Part", name: "no_part", type: "text", mono: true },
                                                    { label: "Nama Part", name: "nama_part", type: "text" },
                                                    { label: "Qty", name: "qty", type: "number" },
                                                    { label: "Suplai", name: "suplai", type: "number" },
                                                    { label: "ETA", name: "eta", type: "date" },
                                                    { label: "ATA", name: "ata", type: "date" },
                                                ].map(f => (
                                                    <div key={f.name}>
                                                        <label className="block text-[10px] font-bold text-gray-400 mb-0.5">{f.label}</label>
                                                        <input
                                                            name={f.name}
                                                            type={f.type}
                                                            value={p[f.name] ?? ""}
                                                            onChange={e => handlePartChange(i, e)}
                                                            className={`w-full px-2 py-1.5 text-xs bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-brand-primary outline-none ${f.mono ? "font-mono" : ""}`}
                                                        />
                                                    </div>
                                                ))}
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Status Part</label>
                                                    <select
                                                        name="status_part"
                                                        value={p.status_part || "On Order"}
                                                        onChange={e => handlePartChange(i, e)}
                                                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-brand-primary outline-none"
                                                    >
                                                        {PART_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex items-end">
                                                    <button type="button" onClick={() => removePart(i)} className="w-full p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors text-xs font-bold flex items-center justify-center gap-1">
                                                        <Trash2 className="w-3 h-3" /> Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">
                                Batal
                            </button>
                            <button type="submit" disabled={saving} className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
                                {saving ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <Save className="w-4 h-4" />}
                                {saving ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

// ===================== DELETE CONFIRM MODAL =====================
function DeleteConfirmModal({ order, onClose, onDeleted }: { order: any; onClose: () => void; onDeleted: () => void }) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.fetch(`/orders/${order.id}`, { method: "DELETE" });
            toast.success("Order berhasil dihapus");
            onDeleted();
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Gagal menghapus order");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Hapus Order?</h2>
                        <p className="text-sm text-gray-500">Tindakan ini tidak bisa dibatalkan</p>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-[#111] rounded-xl p-4 mb-5 border border-gray-200 dark:border-gray-800">
                    <p className="text-sm font-mono font-bold text-brand-primary">{order.no_order}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{order.nama_pelanggan}</p>
                    <p className="text-xs text-gray-400 mt-1">Semua data part terkait juga akan dihapus.</p>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">
                        Batal
                    </button>
                    <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
                        {deleting ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <Trash2 className="w-4 h-4" />}
                        {deleting ? "Menghapus..." : "Ya, Hapus"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===================== IMPORT EXCEL MODAL =====================
function ImportExcelModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validasi ekstensi
        const allowedExtensions = ['xlsx', 'xls', 'csv'];
        const extension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
        
        if (!allowedExtensions.includes(extension)) {
            toast.error("Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv");
            return;
        }

        // Validasi size max 20MB
        if (selectedFile.size > 20 * 1024 * 1024) {
            toast.error("Ukuran file maksimal 20MB");
            return;
        }

        setFile(selectedFile);
        parseFile(selectedFile);
    };

    const parseFile = (file: File) => {
        setLoading(true);
        setErrorMsg("");
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = xlsx.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON with column letter keys (A, B, C...) to avoid index shifting when A/B are empty
                const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: "A", raw: true, defval: "" }) as any[];
                
                if (jsonData.length === 0) {
                    setErrorMsg("File kosong atau format tidak sesuai");
                    setLoading(false);
                    return;
                }

                // Map data based on expected columns symbols (C, D, E... AF)
                const mappedData = jsonData.map((row, idx) => {
                    // Skip the very first row if it looks exactly like headers (this happens sometimes)
                    if (row.C && String(row.C).toLowerCase().trim() === "no order") return null;
                    if (!row.C || String(row.C).trim() === "") return null; // Minimal C (no_order) harus ada

                    // Safe string parsing
                    const safeStr = (val: any) => val ? String(val).trim() : "";
                    const safeNum = (val: any) => {
                        if (!val) return 0;
                        const num = Number(val);
                        return isNaN(num) ? 0 : num;
                    };

                    return {
                        no_order: safeStr(row.C),            
                        tgl_order: safeStr(row.D),           
                        jenis_order: safeStr(row.E),         
                        no_part: safeStr(row.F),             
                        nama_part: safeStr(row.G),           
                        qty: safeNum(row.H),                 
                        tipe: safeStr(row.I),                
                        keterangan: safeStr(row.J),          
                        no_rangka: safeStr(row.K),          
                        model: safeStr(row.L),              
                        tipe_mobil: safeStr(row.M),         
                        hp_contact: safeStr(row.N),         
                        contact: safeStr(row.O),            // Customer Name
                        etd: safeStr(row.R),                
                        eta: safeStr(row.S),                
                        status_order: safeStr(row.T) || 'On Order', 
                        sisa: safeNum(row.U),               
                        delivery: safeStr(row.V),           
                        suplai: safeNum(row.W),             
                        kedatangan_1: safeStr(row.X),       
                        kedatangan_2: safeStr(row.Y),       
                        kedatangan_3: safeStr(row.Z),       
                        kedatangan_4: safeStr(row.AA),       
                        kedatangan_5: safeStr(row.AB),       
                        last_ata: safeStr(row.AC),           
                        lead_time_order: safeNum(row.AD),    
                        lead_time_delivery: safeNum(row.AE), 
                        umur_order: safeNum(row.AF),         
                        // Mappings for UI:
                        nama_pelanggan: safeStr(row.O) || safeStr(row.N) || "-", 
                        no_polisi: safeStr(row.J) || "-", // Diambil dari Kolom J (keterangan)
                        status: safeStr(row.T) || 'On Order',
                        tanggal: safeStr(row.D)
                    };
                }).filter(r => r !== null);

                console.log("Mapped Data:", mappedData);

                if (mappedData.length === 0) {
                    setErrorMsg("Tidak ada data valid yang ditemukan. Pastikan format kolom sesuai: No Order, Tanggal, Nama Pelanggan, No Polisi, Status.");
                    console.log("Raw JSON:", jsonData.slice(0, 3));
                    setLoading(false);
                    return;
                }

                setPreviewData(mappedData);
            } catch (err: any) {
                console.error("Error parsing file:", err);
                setErrorMsg("Gagal membaca file Excel. Pastikan format file benar.");
            } finally {
                setLoading(false);
            }
        };
        reader.onerror = () => {
            setErrorMsg("Gagal membaca file");
            setLoading(false);
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        if (previewData.length === 0) return;
        setImporting(true);
        try {
            const res = await api.fetch('/orders/import', {
                method: 'POST',
                body: JSON.stringify(previewData)
            });
            toast.success(res.message || "Import berhasil");
            onImported();
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Gagal melakukan import data");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-brand-secondary dark:text-white flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-600" /> Import Excel
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">Upload file laporan (.xlsx, .xls, .csv)</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-5 overflow-y-auto flex-1">
                    {!file && (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-[#111] transition-colors cursor-pointer relative">
                            <input 
                                type="file" 
                                accept=".xlsx, .xls, .csv" 
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex justify-center mb-3">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Klik atau drag file ke sini</h3>
                            <p className="text-xs text-gray-500">Maksimal ukuran file 20MB</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center p-8 text-gray-400">
                            <svg className="animate-spin h-8 w-8 mr-3 text-brand-primary" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Membaca file...
                        </div>
                    )}

                    {errorMsg && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl text-sm border border-red-200 dark:border-red-800 mb-4">
                            {errorMsg}
                            <button onClick={() => { setFile(null); setErrorMsg(""); }} className="ml-2 underline font-bold">Coba lagi</button>
                        </div>
                    )}

                    {previewData.length > 0 && !loading && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">File: {file?.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{previewData.length} baris data ditemukan</span>
                                    <button onClick={() => { setFile(null); setPreviewData([]); }} className="text-xs text-red-600 hover:text-red-700 font-bold">Ganti File</button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">Preview 5 baris pertama:</p>
                            
                            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50 dark:bg-[#111] text-gray-600 dark:text-gray-400 font-medium">
                                        <tr>
                                            <th className="px-4 py-2">No Order</th>
                                            <th className="px-4 py-2">Tanggal</th>
                                            <th className="px-4 py-2">Nama Pelanggan</th>
                                            <th className="px-4 py-2">No Polisi</th>
                                            <th className="px-4 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {previewData.slice(0, 5).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-[#111]/50">
                                                <td className="px-4 py-2 font-medium">{row.no_order}</td>
                                                <td className="px-4 py-2 text-gray-500">{row.tanggal}</td>
                                                <td className="px-4 py-2">{row.nama_pelanggan}</td>
                                                <td className="px-4 py-2">{row.no_polisi}</td>
                                                <td className="px-4 py-2">{row.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111]/50">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleImport}
                        disabled={importing || previewData.length === 0} 
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {importing ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <Upload className="w-4 h-4" />}
                        {importing ? "Mengimport..." : "Import Data"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===================== MAIN PAGE =====================
interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function RekapOrder() {
    const [orders, setOrders] = useState([]);
    const [userRole, setUserRole] = useState<string>("");

    const [pagination, setPagination] = useState<PaginationData>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    });

    // Filters
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("All");
    const [sort, setSort] = useState("tgl_order");
    const [order, setOrder] = useState("DESC");

    // Modal state
    const [editTarget, setEditTarget] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [showImportModal, setShowImportModal] = useState(false);

    const fetchOrders = async () => {
        try {
            const res = await api.fetch(
                `/orders?page=${pagination.page}&limit=${pagination.limit}&search=${search}&status=${status}&sort=${sort}&order=${order}`
            );
            setOrders(res.data);
            setPagination(res.pagination);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const userDataStr = Cookies.get("user");
        if (userDataStr) {
            try { setUserRole(JSON.parse(userDataStr).role); }
            catch (e) { }
        }
        const delayDebounceFn = setTimeout(() => {
            fetchOrders();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search, status, sort, order, pagination.page]);

    const handleSort = (column: string) => {
        if (sort === column) {
            setOrder(order === "ASC" ? "DESC" : "ASC");
        } else {
            setSort(column);
            setOrder("ASC");
        }
    };

    const exportExcel = () => {
        const worksheet = xlsx.utils.json_to_sheet(orders.map((o: any) => ({
            'No Order': o.no_order,
            'Tanggal': formatDate(o.tgl_order),
            'Nama Pelanggan': o.nama_pelanggan,
            'No Polisi': o.no_polisi,
            'Status': o.status,
            'Total Part': o.total_part,
            'Umur Order (Hari)': o.umur_order
        })));
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Rekap Order");
        xlsx.writeFile(workbook, "Rekap_Order.xlsx");
    };

    return (
        <MainLayout>
            {/* Modals */}
            {editTarget && <EditOrderModal order={editTarget} onClose={() => setEditTarget(null)} onSaved={fetchOrders} />}
            {deleteTarget && <DeleteConfirmModal order={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={fetchOrders} />}
            {showImportModal && <ImportExcelModal onClose={() => setShowImportModal(false)} onImported={fetchOrders} />}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Order Summary</h1>
                    <p className="text-gray-500 text-sm">Monitor history and status of all orders in SPARELUX WIRA TOYOTA.</p>
                </div>

                <div className="flex gap-2">
                    {['Admin', 'Partsman'].includes(userRole) && (
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-600/20 mr-2"
                        >
                            <Upload className="w-4 h-4" /> Import Excel
                        </button>
                    )}
                    <button
                        onClick={exportExcel}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Export Excel
                    </button>
                </div>
            </div>

            <div className="card">
                {/* Filters Top Bar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 min-w-[300px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari No Order, Polisi, Pelanggan..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-brand-primary outline-none bg-gray-50 dark:bg-[#111]"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</label>
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                            className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                            <option value="All">All Status</option>
                            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-[#111] text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:text-brand-primary" onClick={() => handleSort('no_order')}>
                                    No Order {sort === 'no_order' && (order === 'ASC' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-brand-primary" onClick={() => handleSort('tgl_order')}>
                                    Tanggal {sort === 'tgl_order' && (order === 'ASC' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-brand-primary" onClick={() => handleSort('nama_pelanggan')}>
                                    Nama Pelanggan {sort === 'nama_pelanggan' && (order === 'ASC' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-brand-primary" onClick={() => handleSort('no_polisi')}>
                                    No Polisi {sort === 'no_polisi' && (order === 'ASC' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-brand-primary" onClick={() => handleSort('status')}>
                                    Status {sort === 'status' && (order === 'ASC' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-4 text-center cursor-pointer hover:text-brand-primary" onClick={() => handleSort('total_part')}>
                                    Total Part {sort === 'total_part' && (order === 'ASC' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-4 text-center cursor-pointer hover:text-brand-primary" onClick={() => handleSort('umur_order')}>
                                    Umur Order {sort === 'umur_order' && (order === 'ASC' ? '↑' : '↓')}
                                </th>
                                {['Admin', 'Partsman'].includes(userRole) && (
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-gray-500">Data tidak ditemukan.</td>
                                </tr>
                            ) : (
                                orders.map((o: any) => (
                                    <tr key={o.id} className="border-b last:border-0 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#111]/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-brand-primary">{o.no_order}</td>
                                        <td className="px-6 py-4">{formatDate(o.tgl_order)}</td>
                                        <td className="px-6 py-4">{o.nama_pelanggan}</td>
                                        <td className="px-6 py-4 font-mono">{o.no_polisi}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">{o.total_part}</td>
                                        <td className="px-6 py-4 text-center">{o.umur_order} Hari</td>
                                        {['Admin', 'Partsman'].includes(userRole) && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setEditTarget(o)}
                                                        title="Edit Order"
                                                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(o)}
                                                        title="Hapus Order"
                                                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination bar */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-[#111] disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium px-4">
                            Page {pagination.page} of {pagination.totalPages || 1}
                        </span>
                        <button
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-[#111] disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
