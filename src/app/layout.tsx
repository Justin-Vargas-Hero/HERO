import "./globals.css";
import { ReactNode } from "react";
import type { Metadata } from "next";

import { Manrope, Inter } from "next/font/google";

import Topbar from "@/components/Topbar";
import SideNav from "@/components/LeftNavbar";
import TurnstileLoader from "@/components/TurnstileLoader";
import Footer from "@/components/Footer";

import SessionProviderWrapper from "@/app/providers/SessionProviderWrapper";

const manrope = Manrope({
    variable: "--font-manrope",
    subsets: ["latin"],
});

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "HERO",
    description: "A premiere trading forum",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
        <body className="min-h-screen">
        <SessionProviderWrapper>
            <Topbar />
            <div className="flex">
                <SideNav />
                <main className="flex-1 flex flex-col min-h-[calc(100vh-56px)]">
                    <div className="flex-1 px-6 py-4">
                        {children}
                    </div>
                    <Footer />
                </main>
            </div>
            <TurnstileLoader />
        </SessionProviderWrapper>
        </body>
        </html>
    );
}
