"use client";

import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { api } from "@/lib/api";
import { Search, CarFront, FileText, Calendar, Box, Package, Pencil, Trash2, X, PlusCircle, Save, History, ChevronRight, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const STATUS_PART_COLORS: Record<string, string> = {
    'Completed': 'bg-green-100 text-green-700',
    'On Delivery': 'bg-blue-100 text-blue-700',
    'On Order': 'bg-orange-100 text-orange-700',
};

const ALL_STATUSES = ['On Order', 'On Delivery', 'Partial', 'Completed', 'Overdue'];
const PART_STATUSES = ['On Order', 'Completed', 'On Delivery'];

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
    const [parts, setParts] = useState<any[]>(
        (order.parts || []).map((p: any) => ({
            ...p,
            eta: toDateInput(p.eta),
            ata: toDateInput(p.ata),
            etd: toDateInput(p.etd),
        }))
    );
    const [saving, setSaving] = useState(false);

    const handleFormChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });
    const handlePartChange = (index: number, e: any) => {
        const newParts = [...parts];
        newParts[index] = { ...newParts[index], [e.target.name]: e.target.value };
        setParts(newParts);

        // Auto calculate status if part status changed
        if (e.target.name === "status_part") {
            const statuses = newParts.map(p => p.status_part || "On Order");
            const allCompleted = statuses.every(s => s === "Completed");
            const anyCompleted = statuses.some(s => s === "Completed");
            const anyOnDelivery = statuses.some(s => s === "On Delivery");

            let nextStatus = form.status;
            if (allCompleted) nextStatus = "Completed";
            else if (anyCompleted) nextStatus = "Partial";
            else if (anyOnDelivery) nextStatus = "On Delivery";
            else if (statuses.every(s => s === "On Order")) nextStatus = "On Order";

            if (nextStatus !== form.status) {
                setForm(prev => ({ ...prev, status: nextStatus }));
            }
        }
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
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold">Edit Order</h2>
                        <p className="text-sm text-gray-500 mt-0.5">#{order.no_order}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSave}>
                    <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
                        <div>
                            <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-2"><span className="w-5 h-0.5 bg-brand-primary inline-block"></span>Data Kendaraan & Pelanggan</h3>
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
                                        <input name={f.name} type={f.type} value={(form as any)[f.name]} onChange={handleFormChange}
                                            className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none ${f.mono ? "font-mono uppercase" : ""}`} />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status Order</label>
                                    <select name="status" value={form.status} onChange={handleFormChange}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none">
                                        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2"><span className="w-5 h-0.5 bg-brand-primary inline-block"></span>Detail Parts ({parts.length})</h3>
                                <button type="button" onClick={addPart} className="flex items-center gap-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                                    <PlusCircle className="w-3.5 h-3.5" /> Tambah Part
                                </button>
                            </div>
                            <div className="space-y-3">
                                {parts.map((p, i) => (
                                    <div key={i} className="bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-200 dark:border-gray-800 p-3 relative group">
                                        <div className="absolute -left-2 -top-2 bg-brand-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow">{i + 1}</div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                                            {[
                                                { label: "No Part", name: "no_part", type: "text", mono: true },
                                                { label: "Nama Part", name: "nama_part", type: "text" },
                                                { label: "No Polisi", name: "no_polisi", type: "text", mono: true },
                                                { label: "Pelanggan", name: "nama_pelanggan", type: "text" },
                                                { label: "Qty", name: "qty", type: "number" },
                                                { label: "Suplai", name: "suplai", type: "number" },
                                                { label: "ETA", name: "eta", type: "date" },
                                                { label: "ATA", name: "ata", type: "date" },
                                            ].map(f => (
                                                <div key={f.name}>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-0.5">{f.label}</label>
                                                    <input name={f.name} type={f.type} value={p[f.name] ?? ""} onChange={e => handlePartChange(i, e)}
                                                        className={`w-full px-2 py-1.5 text-xs bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-brand-primary outline-none ${f.mono ? "font-mono" : ""}`} />
                                                </div>
                                            ))}
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Status Part</label>
                                                <select name="status_part" value={p.status_part || "On Order"} onChange={e => handlePartChange(i, e)}
                                                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-brand-primary outline-none">
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
                    <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">Batal</button>
                        <button type="submit" disabled={saving} className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
                            {saving ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <Save className="w-4 h-4" />}
                            {saving ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                </form>
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
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"><Trash2 className="w-6 h-6 text-red-600" /></div>
                    <div>
                        <h2 className="text-lg font-bold">Hapus Order?</h2>
                        <p className="text-sm text-gray-500">Tindakan ini tidak bisa dibatalkan</p>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-[#111] rounded-xl p-4 mb-5 border border-gray-200 dark:border-gray-800">
                    <p className="text-sm font-mono font-bold text-brand-primary">{order.no_order}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{order.nama_pelanggan}</p>
                    <p className="text-xs text-gray-400 mt-1">Semua data part terkait juga akan dihapus.</p>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">Batal</button>
                    <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
                        {deleting ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <Trash2 className="w-4 h-4" />}
                        {deleting ? "Menghapus..." : "Ya, Hapus"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===================== MAIN PAGE =====================
export default function CariData() {
    const [searchQuery, setSearchQuery] = useState("");
    const [orderList, setOrderList] = useState<any[]>([]); // To hold multiple matched orders
    const [orderData, setOrderData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeNoPolisi, setActiveNoPolisi] = useState<string | null>(null);
    const [editTarget, setEditTarget] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const userDataStr = Cookies.get("user");
    const userRole = userDataStr ? JSON.parse(userDataStr).role : "";


    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setOrderData(null);
        setOrderList([]);
        setActiveNoPolisi(null);

        try {
            const res = await api.fetch(`/orders?search=${searchQuery}&limit=20`);
            if (res.data.length === 0) {
                toast.info("Data order tidak ditemukan (No Order/Polisi/Rangka)");
                return;
            }
            setOrderList(res.data);
        } catch (error) {
            toast.error("Gagal mencari data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectOrder = async (orderId: number, polisiContext?: string) => {
        setIsLoading(true);
        setActiveNoPolisi(polisiContext || null);
        try {
            const detailRes = await api.fetch(`/orders/${orderId}`);
            setOrderData(detailRes);
        } catch (error) {
            toast.error("Gagal memuat detail pesanan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaved = async () => {
        // Re-fetch the updated data
        if (orderData) {
            try {
                const updated = await api.fetch(`/orders/${orderData.id}`);
                setOrderData(updated);
            } catch { }
        }
    };

    const handleDeleted = () => {
        setOrderData(null);
        setSearchQuery("");
    };

    return (
        <MainLayout>
            {editTarget && <EditOrderModal order={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />}
            {deleteTarget && <DeleteConfirmModal order={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />}

            <div className="mb-8">
                <h1 className="sparelux-text text-3xl font-bold mb-2 text-center leading-tight">SEARCH SPARELUX WIRA TOYOTA</h1>
                <p className="text-gray-500 text-center text-sm max-w-xl mx-auto">
                    Masukkan Nomor Order, Nomor Polisi, atau Nomor Rangka untuk melihat detail part dan estimasi kedatangan.
                </p>
            </div>

            <div className="max-w-3xl mx-auto mb-10">
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ketik No Order / No Polisi / No Rangka..."
                        className="w-full text-lg pl-14 pr-32 py-4 rounded-full border-2 border-gray-200 dark:border-gray-800 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 bg-white dark:bg-[#111] shadow-soft focus:outline-none transition-all"
                    />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-primary hover:bg-brand-primary text-white px-6 py-2.5 rounded-full font-bold transition-colors disabled:opacity-50"
                    >
                        {isLoading ? "Searching..." : "Cari"}
                    </button>
                </form>
            </div>

            {/* Jika ada data pesanan (History Pelanggan), tapi belum ada yg di-klik */}
            {orderList.length > 0 && !orderData && (
                <div className="max-w-5xl mx-auto space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <div className="flex items-center gap-3 bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl mb-6">
                        <div className="bg-brand-primary p-2 rounded-xl"><History className="w-5 h-5 text-white" /></div>
                        <div>
                            <h2 className="font-bold text-gray-800 dark:text-gray-200">History Pesanan Ditemukan!</h2>
                            <p className="text-sm text-gray-500">Kami menemukan {orderList.length} pesanan yang relevan. Silakan pilih pesanan (No Order) di bawah ini untuk melihat rincian parts-nya.</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-soft">
                        {orderList.map((order: any, idx: number) => (
                            <div
                                key={order.id}
                                onClick={() => handleSelectOrder(order.id, order.no_polisi)}
                                className={`group cursor-pointer p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${idx !== orderList.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-base font-bold text-gray-900 dark:text-white group-hover:text-brand-primary transition-colors">{order.no_order}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${order.status === 'Completed' || order.status === 'Received' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><CarFront className="w-3 h-3" /> {order.nama_pelanggan}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className="font-mono">{order.no_polisi}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Umur</p>
                                        <p className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md leading-none">{order.umur_order} Hari</p>
                                    </div>
                                    <div className="text-right hidden md:block border-l border-gray-100 dark:border-gray-800 pl-6">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Tanggal Order</p>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{formatDate(order.tgl_order)}</p>
                                    </div>
                                    <div className="text-right border-l border-gray-100 dark:border-gray-800 pl-6">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Part</p>
                                        <p className="text-xs font-bold text-brand-primary">{order.total_part} Items</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {orderData && (
                <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">

                    {/* Kembali Button if coming from history list */}
                    {orderList.length > 0 && (
                        <button
                            onClick={() => setOrderData(null)}
                            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-primary transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar History Pencarian
                        </button>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary text-white shadow-soft relative overflow-hidden transition-all hover:shadow-lg">
                            {/* Glass overlay effect */}
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4 text-white/80">
                                    <CarFront className="w-6 h-6" />
                                    <h3 className="font-bold tracking-wide uppercase">Informasi Kendaraan</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-white/60">Nama Pelanggan / No Order</p>
                                        <p className="font-bold text-xl">{orderData.nama_pelanggan} <span className="text-white/40 block text-sm">{orderData.no_order}</span></p>
                                    </div>
                                    <div className="flex justify-between border-t border-white/20 pt-4">
                                        <div>
                                            <p className="text-sm text-white/60">Model</p>
                                            <p className="font-semibold">{orderData.model}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-white/60">No Polisi</p>
                                            <p className="font-mono bg-white/20 px-2 py-1 rounded">{orderData.no_polisi}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-white/60">No Rangka</p>
                                        <p className="font-mono text-sm">{orderData.no_rangka}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card p-6 flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-4 text-gray-500">
                                <FileText className="w-6 h-6" />
                                <h3 className="font-bold text-brand-secondary dark:text-white uppercase">Status Keseluruhan</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 text-sm font-medium flex items-center gap-2"><Box className="w-4 h-4" /> Status</span>
                                    <span className="font-bold text-brand-primary text-lg">{orderData.status}</span>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Tanggal Order</span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(orderData.tgl_order)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 text-sm font-medium flex items-center gap-2"><Package className="w-4 h-4" /> Umur Order</span>
                                    <span className="font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded drop-shadow-sm">{orderData.umur_order} Hari</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {['Admin', 'Partsman'].includes(userRole) && (
                                <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                                    <button
                                        onClick={() => setEditTarget(orderData)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" /> Edit Order
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(orderData)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" /> Hapus Order
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-bold flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Box className="w-5 h-5 text-brand-primary" /> Detail Parts ({orderData.parts.filter((p: any) => !activeNoPolisi || p.no_polisi === activeNoPolisi).length})
                            </div>
                            {activeNoPolisi && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-lg">Filter: {activeNoPolisi}</span>
                                    <button 
                                        onClick={() => setActiveNoPolisi(null)}
                                        className="text-[10px] text-gray-400 hover:text-red-500 underline transition-colors"
                                    >
                                        Lihat Semua
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-[#111] text-gray-500 border-b border-gray-200 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4">No Part</th>
                                        <th className="px-6 py-4">Nama Part</th>
                                        <th className="px-6 py-4 text-center">Qty / Suplai</th>
                                        <th className="px-6 py-4 text-center">Sisa</th>
                                        <th className="px-6 py-4">ETA (Estimasi)</th>
                                        <th className="px-6 py-4">ATA (Aktual)</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderData.parts
                                        .filter((p: any) => !activeNoPolisi || p.no_polisi === activeNoPolisi)
                                        .map((p: any) => (
                                        <tr key={p.id} className="border-b last:border-0 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#111] transition-colors">
                                            <td className="px-6 py-4 font-mono font-medium">{p.no_part}</td>
                                            <td className="px-6 py-4 max-w-xs truncate">{p.nama_part}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold">{p.qty}</span> <span className="text-gray-400">/</span> <span className="text-green-600 font-bold">{p.suplai}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-red-500 font-bold">{p.sisa}</td>
                                            <td className="px-6 py-4 font-medium">{formatDate(p.eta)}</td>
                                            <td className="px-6 py-4 text-green-600 font-medium">{formatDate(p.ata)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${STATUS_PART_COLORS[p.status_part as keyof typeof STATUS_PART_COLORS] || 'bg-gray-100 text-gray-600'}`}>
                                                    {p.status_part}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}
        </MainLayout>
    );
}
