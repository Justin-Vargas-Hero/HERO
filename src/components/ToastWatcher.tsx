"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

export default function ToastWatcher() {
    const params = useSearchParams();

    useEffect(() => {
        if (params.get("verified") === "1") {
            toast.success("Email verified successfully. Please log in.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (params.get("authError") === "1") {
            toast.error("Invalid email or password.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [params]);

    return (
        <Toaster
            position="top-center"
            toastOptions={{
                style: {
                    background: "#111",
                    color: "#fff",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                },
                success: { iconTheme: { primary: "#10b981", secondary: "#111" } },
            }}
        />
    );
}
