"use client";
import { useEffect } from "react";

export default function TurnstileLoader() {
    useEffect(() => {
        // Prevent duplicate script injection
        if (document.getElementById("cf-turnstile-script")) return;

        const script = document.createElement("script");
        script.id = "cf-turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.defer = true;
        script.onload = () => console.log("✅ Cloudflare Turnstile script loaded");
        document.head.appendChild(script);
    }, []);

    return null;
}