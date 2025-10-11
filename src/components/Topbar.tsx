"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AuthModal from "@/components/AuthModal";
import UserDropdown from "@/components/UserDropdown";
import { TickerSearch } from "@/components/market/TickerSearch";
import { LivePing } from "@/components/LivePing";
import { isMarketOpen, getMarketStatus } from "@/lib/market-utils";

export default function Topbar() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [marketStatus, setMarketStatus] = useState<'Open' | 'Closed' | 'Pre-Market' | 'After-Hours'>('Closed');
    const [isOpen, setIsOpen] = useState(false);

    // Update market status every minute
    useEffect(() => {
        const updateMarketStatus = () => {
            setMarketStatus(getMarketStatus());
            setIsOpen(isMarketOpen());
        };

        // Initial update
        updateMarketStatus();

        // Update every minute
        const interval = setInterval(updateMarketStatus, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <header className="sticky top-0 z-50 border-b border-gray-200 backdrop-blur-md bg-white/80">
            <nav className="flex items-center h-14 px-4">
                {/* Left side */}
                <div className="flex items-center justify-start gap-3">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded hover:bg-gray-100 transition"
                        aria-label="Open menu"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                            />
                        </svg>
                    </button>

                    <Link
                        href="/"
                        className="text-2xl font-display font-bold tracking-tight"
                    >
                        HERO
                    </Link>
                </div>

                {/* Center search - Now using TickerSearch */}
                <div className="flex-1 flex justify-center px-4">
                    <div className="w-full max-w-[560px]">
                        <TickerSearch 
                            placeholder="Search stocks, crypto, ETFs..."
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center justify-end gap-3">
                    {/* Market Status */}
                    <div className="flex items-center gap-2 text-sm font-inter text-gray-600">
                        <LivePing status={isOpen ? 'live' : 'offline'} />
                        <span className="hidden sm:inline">
                            Market {marketStatus}
                        </span>
                    </div>
                    {/* If user logged in → show user dropdown */}
                    {session?.user ? (
                        <UserDropdown 
                            user={{
                                id: session.user.id || "",
                                email: session.user.email,
                                name: session.user.name,
                                username: session.user.username,
                                profilePicture: session.user.profilePicture,
                            }}
                        />
                    ) : (
                        // Otherwise show Login button
                        <button
                            onClick={() => setLoginOpen(true)}
                            className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-900 transition"
                        >
                            Log In
                        </button>
                    )}
                </div>
            </nav>

            {/* Auth Modal */}
            <AuthModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </header>
    );
}