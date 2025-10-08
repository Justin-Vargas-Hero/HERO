"use client";
import { useEffect, useRef } from "react";

interface TurnstileWidgetProps {
    onVerify?: (token: string) => void;
}

export default function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const renderWidget = () => {
            const cf = (window as any).turnstile;
            if (!cf || !ref.current) return;
            ref.current.innerHTML = "";
            cf.render(ref.current, {
                sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
                theme: "light",
                callback: (token: string) => {
                    console.log("✅ Captcha token:", token);
                    if (onVerify) onVerify(token);
                },
            });
        };

        renderWidget();

        // 🔁 Refresh every 90 seconds
        const refreshInterval = setInterval(() => {
            const cf = (window as any).turnstile;
            if (cf && ref.current) {
                console.log("♻️ Refreshing Turnstile widget...");
                cf.reset(ref.current);
            }
        }, 90000);

        return () => clearInterval(refreshInterval);
    }, []);

    return (
        <div
            ref={ref}
            style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "12px",
                minHeight: "70px",
            }}
        />
    );
}