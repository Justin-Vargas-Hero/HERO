// src/components/SettingsModal.tsx
"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
    user: {
        id: string;
        email?: string | null;
        name?: string | null;
        username?: string | null;
        profilePicture?: string | null;
    };
}

type TabType = "profile" | "account" | "security";

export default function SettingsModal({ open, onClose, user }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>("profile");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile state
    const [profilePicture, setProfilePicture] = useState(user.profilePicture || "");
    const [previewUrl, setPreviewUrl] = useState("");

    // Account state
    const [email, setEmail] = useState(user.email || "");
    const [emailConfirm, setEmailConfirm] = useState("");

    // Security state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be less than 5MB");
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleProfilePictureUpload = async () => {
        if (!previewUrl) return;

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("/api/user/profile-picture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    profilePicture: previewUrl 
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update profile picture");

            setMessage("Profile picture updated successfully");
            setProfilePicture(previewUrl);
            setPreviewUrl("");
            router.refresh(); // Refresh to update the profile picture in the header
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveProfilePicture = async () => {
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("/api/user/profile-picture", {
                method: "DELETE",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to remove profile picture");

            setMessage("Profile picture removed");
            setProfilePicture("");
            setPreviewUrl("");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = async () => {
        if (!email || email === user.email) return;
        if (email !== emailConfirm) {
            setError("Emails do not match");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("/api/user/email", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.toLowerCase() }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update email");

            setMessage("Email updated successfully. Please verify your new email address.");
            setEmailConfirm("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword) return;
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            setError("Password must have 8+ characters with uppercase, lowercase, number, and symbol");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("/api/user/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    currentPassword,
                    newPassword 
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update password");

            setMessage("Password updated successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setError("");
        setMessage("");
        setPreviewUrl("");
        setEmailConfirm("");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    return (
        <Transition show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => {
                resetForm();
                onClose();
            }}>
                <Transition.Child 
                    as={Fragment}
                    enter="ease-out duration-200" 
                    enterFrom="opacity-0" 
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                                <Dialog.Title className="text-xl font-semibold mb-4">
                                    Settings
                                </Dialog.Title>

                                {/* Tab Navigation */}
                                <div className="flex gap-1 mb-6 border-b border-gray-200">
                                    <button
                                        onClick={() => setActiveTab("profile")}
                                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                            activeTab === "profile" 
                                                ? "text-black border-black" 
                                                : "text-gray-500 border-transparent hover:text-gray-700"
                                        }`}
                                    >
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("account")}
                                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                            activeTab === "account" 
                                                ? "text-black border-black" 
                                                : "text-gray-500 border-transparent hover:text-gray-700"
                                        }`}
                                    >
                                        Account
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("security")}
                                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                            activeTab === "security" 
                                                ? "text-black border-black" 
                                                : "text-gray-500 border-transparent hover:text-gray-700"
                                        }`}
                                    >
                                        Security
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="min-h-[300px]">
                                    {activeTab === "profile" && (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    Profile Picture
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-24 h-24 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-50">
                                                        {(previewUrl || profilePicture) ? (
                                                            <img
                                                                src={previewUrl || profilePicture}
                                                                alt="Profile"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageSelect}
                                                            className="hidden"
                                                        />
                                                        <button
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition"
                                                        >
                                                            Upload New
                                                        </button>
                                                        {(profilePicture || previewUrl) && (
                                                            <button
                                                                onClick={handleRemoveProfilePicture}
                                                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    JPG, PNG or GIF. Max size 5MB.
                                                </p>
                                                {previewUrl && (
                                                    <button
                                                        onClick={handleProfilePictureUpload}
                                                        disabled={loading}
                                                        className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                                                    >
                                                        {loading ? "Saving..." : "Save Changes"}
                                                    </button>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Username
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500">@</span>
                                                    <input
                                                        type="text"
                                                        value={user.username || ""}
                                                        disabled
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Username cannot be changed
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "account" && (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black"
                                                    placeholder="Enter new email"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Confirm Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={emailConfirm}
                                                    onChange={(e) => setEmailConfirm(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black"
                                                    placeholder="Confirm new email"
                                                />
                                            </div>

                                            <button
                                                onClick={handleEmailChange}
                                                disabled={loading || !email || !emailConfirm || email === user.email}
                                                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                                            >
                                                {loading ? "Updating..." : "Update Email"}
                                            </button>
                                        </div>
                                    )}

                                    {activeTab === "security" && (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Current Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black"
                                                    placeholder="Enter current password"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black"
                                                    placeholder="Enter new password"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    8+ characters with uppercase, lowercase, number & symbol
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>

                                            <button
                                                onClick={handlePasswordChange}
                                                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                                                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                                            >
                                                {loading ? "Updating..." : "Update Password"}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Messages */}
                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}
                                {message && (
                                    <div className="mt-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
                                        {message}
                                    </div>
                                )}

                                {/* Close Button */}
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            onClose();
                                        }}
                                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}