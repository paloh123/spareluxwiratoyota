"use client";

import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { api } from "@/lib/api";
import { PlusCircle, Trash2, Save } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useEffect } from "react";

export default function InputOrder() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const userDataStr = Cookies.get("user");
        if (userDataStr) {
            try {
                const user = JSON.parse(userDataStr);
                if (user.role === "SA") {
                    toast.error("Akses Ditolak: SA hanya memiliki akses Lihat Data.");
                    router.push("/");
                }
            } catch (e) { }
        }
    }, [router]);


    // Header state
    const [orderData, setOrderData] = useState({
        no_order: "",
        tgl_order: new Date().toISOString().split("T")[0],
        no_rangka: "",
        model: "",
        no_polisi: "",
        nama_pelanggan: ""
    });

    // Dynamic parts state
    const [parts, setParts] = useState([
        { no_part: "", nama_part: "", qty: 1, etd: "", eta: "", status_part: "On Order" }
    ]);

    const handleOrderChange = (e: any) => {
        setOrderData({ ...orderData, [e.target.name]: e.target.value });
    };

    const handlePartChange = (index: number, e: any) => {
        const newParts = [...parts];
        (newParts[index] as any)[e.target.name] = e.target.value;
        setParts(newParts);
    };

    const addPart = () => {
        setParts([...parts, { no_part: "", nama_part: "", qty: 1, etd: "", eta: "", status_part: "On Order" }]);
    };

    const removePart = (index: number) => {
        if (parts.length > 1) {
            const newParts = parts.filter((_, i) => i !== index);
            setParts(newParts);
        } else {
            toast.warning("Minimal harus ada 1 part");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!orderData.no_order || !orderData.nama_pelanggan) {
            return toast.error("Semua field order wajib diisi");
        }

        for (const p of parts) {
            if (!p.no_part || !p.nama_part || !p.qty || !p.etd || !p.eta) {
                return toast.error("Pastikan semua detail part lengkap (No Part, Nama, Qty, ETD, ETA)");
            }
            if (typeof p.qty !== 'number' && isNaN(Number(p.qty))) {
                return toast.error("Qty harus berupa angka");
            }
        }

        setIsSubmitting(true);
        try {
            await api.fetch("/orders", {
                method: "POST",
                body: JSON.stringify({
                    ...orderData,
                    parts: parts.map(p => ({ ...p, qty: Number(p.qty) }))
                })
            });

            toast.success("Order Part berhasil disimpan");
            router.push("/rekap-order");
        } catch (error: any) {
            toast.error(error.message || "Gagal menyimpan order");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Input Spareparts Order</h1>
                <p className="text-gray-500 text-sm border-b border-gray-200 dark:border-gray-800 pb-4">Create new order records in SPARELUX WIRA TOYOTA.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Data Kendaraan */}
                <div className="card p-6 border-t-4 border-t-brand-primary">
                    <h2 className="text-lg font-bold mb-4 uppercase text-brand-secondary dark:text-gray-200 tracking-wide flex justify-between items-center">
                        <span>1. Data Kendaraan & Pelanggan</span>
                        <span className="text-xs font-normal bg-brand-primary/10 text-brand-primary px-2 py-1 rounded">All Fields Required</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Order</label>
                            <input
                                name="no_order" required value={orderData.no_order} onChange={handleOrderChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none uppercase font-mono"
                                placeholder="ORD-XXX"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Order</label>
                            <input
                                type="date" name="tgl_order" required value={orderData.tgl_order} onChange={handleOrderChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Pelanggan / Asuransi</label>
                            <input
                                name="nama_pelanggan" required value={orderData.nama_pelanggan} onChange={handleOrderChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                placeholder="Budi / Asuransi Auto"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Polisi</label>
                            <input
                                name="no_polisi" required value={orderData.no_polisi} onChange={handleOrderChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none uppercase font-mono"
                                placeholder="B 1234 XYZ"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Rangka</label>
                            <input
                                name="no_rangka" required value={orderData.no_rangka} onChange={handleOrderChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none uppercase font-mono"
                                placeholder="MHF..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model Kendaraan</label>
                            <input
                                name="model" required value={orderData.model} onChange={handleOrderChange}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                placeholder="Avanza G 2022"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Order Parts */}
                <div className="card p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                        <h2 className="text-lg font-bold uppercase tracking-wide">2. Detail Part ({parts.length})</h2>
                        <button
                            type="button"
                            onClick={addPart}
                            className="flex items-center gap-2 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                            <PlusCircle className="w-4 h-4" /> Tambah Part
                        </button>
                    </div>

                    <div className="space-y-4">
                        {parts.map((p, index) => (
                            <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 bg-gray-50 dark:bg-[#111] p-4 rounded-xl border border-gray-200 dark:border-gray-800 relative group animate-in slide-in-from-top-2">
                                <div className="absolute -left-2 -top-2 bg-brand-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10">
                                    {index + 1}
                                </div>

                                <div className="w-full md:w-1/4">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">No Part</label>
                                    <input
                                        name="no_part" required value={p.no_part} onChange={(e) => handlePartChange(index, e)}
                                        className="w-full px-3 py-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none font-mono text-sm"
                                    />
                                </div>
                                <div className="w-full md:w-1/4">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Part</label>
                                    <input
                                        name="nama_part" required value={p.nama_part} onChange={(e) => handlePartChange(index, e)}
                                        className="w-full px-3 py-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                                    />
                                </div>
                                <div className="w-full md:w-1/12">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Qty</label>
                                    <input
                                        type="number" min="1" name="qty" required value={p.qty} onChange={(e) => handlePartChange(index, e)}
                                        className="w-full px-3 py-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm text-center"
                                    />
                                </div>
                                <div className="w-full md:w-1/6">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 text-center">ETD <span className="text-[10px] font-normal">(Depo)</span></label>
                                    <input
                                        type="date" name="etd" required value={p.etd} onChange={(e) => handlePartChange(index, e)}
                                        className="w-full px-3 py-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                                    />
                                </div>
                                <div className="w-full md:w-1/6">
                                    <label className="block text-xs font-semibold  text-gray-500 mb-1 text-center">ETA <span className="text-[10px] font-normal">(Dealer)</span></label>
                                    <input
                                        type="date" name="eta" required value={p.eta} onChange={(e) => handlePartChange(index, e)}
                                        className="w-full px-3 py-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm font-bold text-brand-primary"
                                    />
                                </div>

                                <div className="w-full md:w-auto flex items-end justify-end ml-auto">
                                    <button
                                        type="button"
                                        onClick={() => removePart(index)}
                                        className="p-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Remove Part"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Bottom */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary text-white px-8 py-3 rounded-xl font-bold text-lg shadow-soft hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <svg className="animate-spin h-5 w-5 mr-1" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : <Save className="w-5 h-5" />}
                        {isSubmitting ? "Menyimpan..." : "Simpan Order Part"}
                    </button>
                </div>
            </form>
        </MainLayout>
    );
}
