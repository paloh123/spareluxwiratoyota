"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { api } from "@/lib/api";
import { Search, MapPin, Truck, Pencil, X, Save } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

// ===================== UPDATE PART MODAL =====================
function UpdatePartModal({ part, onClose, onSaved }: { part: any; onClose: () => void; onSaved: () => void }) {
    const [formData, setFormData] = useState({
        status_part: part.status_part || "On Order",
        eta: part.eta ? new Date(part.eta).toISOString().split("T")[0] : "",
        ata: part.ata ? new Date(part.ata).toISOString().split("T")[0] : "",
        suplai: part.suplai || 0
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.fetch(`/parts/${part.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    ...formData,
                    suplai: Number(formData.suplai)
                })
            });
            toast.success("Status part diperbarui");
            onSaved();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold">Update Status Part</h2>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{part.no_part} - {part.no_order}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="bg-gray-50 dark:bg-[#111] p-3 rounded-xl border border-gray-100 dark:border-gray-800 mb-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Part Name</p>
                        <p className="text-sm font-semibold">{part.nama_part}</p>
                        <div className="flex gap-4 mt-2">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Qty Order</p>
                                <p className="text-sm font-bold">{part.qty} PCS</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Sisa</p>
                                <p className="text-sm font-bold text-red-500">{part.sisa} PCS</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">ETA (Estimasi)</label>
                            <input
                                type="date" value={formData.eta} onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">ATA (Aktual)</label>
                            <input
                                type="date" value={formData.ata} onChange={(e) => setFormData({ ...formData, ata: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Total Suplai (Keseluruhan)</label>
                        <div className="relative">
                            <input
                                type="number" min="0" max={part.qty} required
                                value={formData.suplai} onChange={(e) => setFormData({ ...formData, suplai: Number(e.target.value) })}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm pr-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">PCS</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">* Masukkan jumlah TOTAL yang sudah diterima.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Status Part</label>
                        <select
                            value={formData.status_part} onChange={(e) => setFormData({ ...formData, status_part: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                        >
                            <option value="On Order">On Order</option>
                            <option value="Partial">Partial</option>
                            <option value="Received">Received</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium">Batal</button>
                        <button
                            type="submit" disabled={saving}
                            className="flex-1 bg-brand-primary hover:bg-brand-primary text-white py-2 rounded-lg font-bold text-sm shadow transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                            Update Status
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function MIP() {
    const [parts, setParts] = useState([]);
    const [filteredParts, setFilteredParts] = useState([]);
    const [filterStatus, setFilterStatus] = useState("All");
    const [isLoading, setIsLoading] = useState(true);
    const [updateTarget, setUpdateTarget] = useState<any>(null);

    const [userRole, setUserRole] = useState("");

    useEffect(() => {
        const user = JSON.parse(Cookies.get("user") || "{}");
        setUserRole(user.role || "");
    }, []);

    const fetchMIP = async () => {
        try {
            const res = await api.fetch('/parts/mip');
            setParts(res);
            setFilteredParts(res);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMIP();
    }, []);

    useEffect(() => {
        let result = parts;
        if (filterStatus !== "All") {
            result = parts.filter((p: any) => p.status_part === filterStatus);
        }
        setFilteredParts(result);
    }, [filterStatus, parts]);

    const getRowStyle = (etaDateString: string, status_part: string) => {
        if (status_part === 'Received') return 'opacity-60 bg-gray-50 dark:bg-[#111]/30';

        const eta = new Date(etaDateString).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);

        if (eta < today) return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-500';
        if (eta === today) return 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-500';

        return 'border-l-4 border-l-transparent';
    };

    return (
        <MainLayout>
            {updateTarget && <UpdatePartModal part={updateTarget} onClose={() => setUpdateTarget(null)} onSaved={fetchMIP} />}

            <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold mb-1">MIP (Monitoring Incoming Part)</h1>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                        <Truck className="w-4 h-4 text-brand-primary" /> Live Parts Tracking — SPARELUX WIRA TOYOTA
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex gap-4 text-sm text-gray-600 dark:text-gray-400 mr-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)] rounded-full animate-pulse" />
                            ETA &lt; Hari ini
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)] rounded-full animate-pulse" />
                            ETA Hari ini
                        </div>
                    </div>

                    <div className="relative">
                        <label className="text-xs font-bold text-gray-500 absolute -top-5 left-1">Filter Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#111] focus:ring-2 focus:ring-brand-primary outline-none shadow-sm"
                        >
                            <option value="All">Semua ETA</option>
                            <option value="On Order">On Order</option>
                            <option value="Partial">Partial</option>
                            <option value="Received">Received</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading tracking data...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-[#111] text-gray-500 border-b border-gray-200 dark:border-gray-800 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">No Order</th>
                                    <th className="px-6 py-4">Pelanggan</th>
                                    <th className="px-6 py-4">Part Info</th>
                                    <th className="px-6 py-4 text-center">Qty / Sisa</th>
                                    <th className="px-6 py-4">ETA</th>
                                    <th className="px-6 py-4">Lead Time</th>
                                    <th className="px-6 py-4">Status</th>
                                    {(userRole === 'Admin' || userRole === 'Partsman') && <th className="px-6 py-4 text-center">Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParts.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-500">Tidak ada pengiriman dalam perjalanan.</td>
                                    </tr>
                                ) : (
                                    filteredParts.map((p: any) => (
                                        <tr key={p.id} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#111]/50 transition-colors ${getRowStyle(p.eta, p.status_part)}`}>
                                            <td className="px-6 py-4 font-bold text-brand-primary">{p.no_order}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 dark:text-gray-100">{p.nama_pelanggan}</div>
                                                <div className="font-mono text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 inline-block px-1 rounded">{p.no_polisi}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs text-gray-500 mb-0.5">{p.no_part}</div>
                                                <div className="font-medium max-w-[200px] truncate" title={p.nama_part}>{p.nama_part}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center flex-col items-center">
                                                    <span className="font-bold">{p.qty} PCS</span>
                                                    <span className="text-xs text-red-500 font-bold">{p.sisa} Pending</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{formatDate(p.eta)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${p.lead_time < 0 ? 'bg-red-100 text-red-600' : p.lead_time === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {p.lead_time < 0 ? `+${Math.abs(p.lead_time)} Hari` : `${p.lead_time} Hari`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold border ${p.status_part === 'Received' ? 'border-green-500 text-green-500' : 'border-orange-500 text-orange-500'}`}>
                                                    {p.status_part}
                                                </span>
                                            </td>
                                            {(userRole === 'Admin' || userRole === 'Partsman') && (
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => setUpdateTarget(p)}
                                                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors border border-blue-100"
                                                        title="Update Status"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
