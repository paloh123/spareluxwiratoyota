"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { api } from "@/lib/api";
import { ShieldAlert, Trash2, KeyRound, Pencil, X, Save } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

// ===================== EDIT USER MODAL =====================
function EditUserModal({ user, onClose, onSaved }: { user: any; onClose: () => void; onSaved: () => void }) {
    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email || "",
        password: "", // Optional password change
        role: user.role || "SA"
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.fetch(`/users/${user.id}`, {
                method: "PUT",
                body: JSON.stringify(formData)
            });
            toast.success("User successfully updated");
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
                    <h2 className="text-xl font-bold">Edit User</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                        <input
                            required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
                        <input
                            type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">New Password (Leave blank to keep current)</label>
                        <input
                            type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Role Permission</label>
                        <select
                            value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                        >
                            <option value="SA">Service Advisor (SA)</option>
                            <option value="Partsman">Partsman</option>
                            <option value="Admin">Administrator</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium">Batal</button>
                        <button
                            type="submit" disabled={saving}
                            className="flex-1 bg-brand-primary hover:bg-brand-primary text-white py-2 rounded-lg font-bold text-sm shadow transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UserManagement() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editTarget, setEditTarget] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "SA"
    });

    const fetchUsers = async () => {
        try {
            const res = await api.fetch("/users");
            setUsers(res);
        } catch (error: any) {
            if (error.message.includes('role')) {
                toast.error("Unauthorized: Admin access required.");
                router.push("/");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.fetch("/users", {
                method: "POST",
                body: JSON.stringify(formData)
            });
            toast.success("User successfully created");
            setFormData({ name: "", email: "", password: "", role: "SA" });
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this user?")) {
            try {
                await api.fetch(`/users/${id}`, { method: "DELETE" });
                toast.success("User deleted");
                fetchUsers();
            } catch (error: any) {
                toast.error(error.message);
            }
        }
    };

    const roleColors = {
        Admin: "bg-red-100 text-red-700 border border-red-200",
        SA: "bg-blue-100 text-blue-700 border border-blue-200",
        Partsman: "bg-orange-100 text-orange-700 border border-orange-200",
    };

    if (isLoading) return <MainLayout><div className="flex justify-center p-12">Loading Admin Panel...</div></MainLayout>;

    const currentUser = JSON.parse(Cookies.get("user") || "{}");

    return (
        <MainLayout>
            {editTarget && <EditUserModal user={editTarget} onClose={() => setEditTarget(null)} onSaved={fetchUsers} />}

            <div className="mb-6 flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold mb-1">User Management</h1>
                    <p className="text-gray-500 text-sm">Control access to the SPARELUX WIRA TOYOTA (Admin Only).</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">

                {/* Create Form */}
                <div className="card p-6 md:col-span-1 h-fit">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                        <KeyRound className="w-5 h-5 text-brand-primary" />
                        Create User
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                            <input
                                name="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
                            <input
                                name="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Password</label>
                            <input
                                name="password" type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Role Permission</label>
                            <select
                                name="role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                            >
                                <option value="SA">Service Advisor (SA)</option>
                                <option value="Partsman">Partsman</option>
                                <option value="Admin">Administrator</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-brand-secondary dark:bg-white text-white dark:text-black py-2.5 rounded-lg font-bold text-sm shadow hover:shadow-md transition-all mt-4"
                        >
                            Create Account
                        </button>
                    </form>
                </div>

                {/* User Data Table */}
                <div className="card p-0 md:col-span-2 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#111]">
                        <h2 className="font-bold">Active Accounts ({users.length})</h2>
                    </div>

                    <div className="overflow-x-auto flex-1 h-full">
                        <table className="w-full text-sm text-left h-full">
                            <thead className="bg-white dark:bg-[#111] text-gray-500 border-b border-gray-200 dark:border-gray-800 tracking-wide sticky top-0">
                                <tr>
                                    <th className="px-6 py-4">User Details</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4 text-center">Created At</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u: any) => (
                                    <tr key={u.id} className="border-b last:border-0 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#111]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-gray-100">{u.name}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${roleColors[u.role as keyof typeof roleColors]}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-500 text-xs font-medium">
                                            {formatDate(u.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => setEditTarget(u)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                {currentUser.id !== u.id && (
                                                    <button
                                                        onClick={() => handleDelete(u.id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-5 h-5 mx-auto" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}
