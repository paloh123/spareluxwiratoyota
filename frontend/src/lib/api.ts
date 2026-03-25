import Cookies from "js-cookie";

export const api = {
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",

    async fetch(endpoint: string, options: RequestInit = {}) {
        const token = Cookies.get("token");

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            ...(options.headers as Record<string, string> || {})
        };

        const res = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers
        });

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                if (typeof window !== "undefined") {
                    Cookies.remove("token");
                    window.location.href = "/login";
                }
            }
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Something went wrong");
        }

        return res.json();
    },

    async post(endpoint: string, data: any, options: RequestInit = {}) {
        return this.fetch(endpoint, {
            ...options,
            method: "POST",
            body: JSON.stringify(data)
        });
    }
};
