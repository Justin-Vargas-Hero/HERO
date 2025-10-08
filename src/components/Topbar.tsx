"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AuthModal from "@/components/AuthModal";
import UserDropdown from "@/components/UserDropdown";

export default function Topbar() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);

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

                {/* Center search */}
                <div className="flex-1 flex justify-center px-4">
                    <form
                        action="/search"
                        className="relative flex items-center w-full max-w-[560px] h-10 bg-hero-gray rounded-full border border-gray-200 pl-4 pr-2 focus-within:border-hero-black transition"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 text-gray-500"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                            />
                        </svg>
                        <input
                            type="text"
                            name="q"
                            placeholder="Search"
                            className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-500 pl-3"
                        />
                    </form>
                </div>

                {/* Right side actions */}
                <div className="flex items-center justify-end gap-3">
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
