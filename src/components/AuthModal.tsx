"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState, memo, useCallback } from "react";
import { signIn } from "next-auth/react";
import TurnstileWidget from "@/components/TurnstileWidget";
import { TIMEZONES, getUserTimezone } from "@/lib/timezones";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,20}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

// Memoized tooltip component
const TooltipRight = memo(({
                               children,
                               visible,
                               error = false,
                           }: {
    children: React.ReactNode;
    visible: boolean;
    error?: boolean;
}) => {
    return (
        <div
            className={error ? "tooltip--error" : "tooltip"}
            data-visible={visible}
            style={{
                position: 'absolute',
                right: '-14px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 9999,
                opacity: visible ? 1 : 0,
                visibility: visible ? 'visible' : 'hidden',
                pointerEvents: visible ? 'auto' : 'none'
            }}
        >
            {children}
        </div>
    );
});

TooltipRight.displayName = 'TooltipRight';

export default function AuthModal({
                                      open,
                                      onClose,
                                  }: {
    open: boolean;
    onClose: () => void;
}) {
    const [mode, setMode] = useState<"login" | "signup" | "verify">("login");

    // shared
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // signup fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [dobMonth, setDobMonth] = useState<number | "">("");
    const [dobDay, setDobDay] = useState<number | "">("");
    const [dobYear, setDobYear] = useState<number | "">("");
    const [timezone, setTimezone] = useState(getUserTimezone()); // Auto-detect user's timezone
    const [captchaToken, setCaptchaToken] = useState("");

    // touched states for validation
    const [touched, setTouched] = useState({
        email: false,
        username: false,
        password: false,
        confirmPassword: false,
        dob: false
    });

    // validation helpers
    const emailValid = useMemo(() => !email || EMAIL_RE.test(email), [email]);
    const usernameValid = useMemo(
        () => !username || USERNAME_RE.test(username),
        [username]
    );
    const passwordValid = useMemo(() => PASSWORD_RE.test(password), [password]);
    const passwordsMatch = useMemo(
        () => !confirmPassword || password === confirmPassword,
        [password, confirmPassword]
    );

    const dobValid = useMemo(() => {
        if (!dobMonth || !dobDay || !dobYear) return true;
        const today = new Date();
        const b = new Date(Number(dobYear), Number(dobMonth) - 1, Number(dobDay));
        let age = today.getFullYear() - b.getFullYear();
        const m = today.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
        return age >= 13;
    }, [dobMonth, dobDay, dobYear]);

    // availability states
    const [emailTaken, setEmailTaken] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [usernameTaken, setUsernameTaken] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);

    // Simplified validation states - only show if field was touched (blurred) AND currently invalid
    const showEmailInvalid = touched.email && email.length > 0 && !emailValid;
    const showEmailTaken = touched.email && emailValid && email.length > 0 && emailTaken;
    const showUsernameInvalid = touched.username && username.length > 0 && !usernameValid;
    const showUsernameTaken = touched.username && usernameValid && username.length > 0 && usernameTaken;
    const showPasswordError = mode === "signup" && touched.password && password.length > 0 && !passwordValid;
    const showConfirmPasswordError = touched.confirmPassword && confirmPassword.length > 0 && !passwordsMatch;
    const showDobError = touched.dob && (dobMonth !== "" || dobDay !== "" || dobYear !== "") && !dobValid;

    useEffect(() => {
        if (!open) {
            // Reset all form fields when modal closes
            setEmail("");
            setPassword("");
            setFirstName("");
            setLastName("");
            setUsername("");
            setConfirmPassword("");
            setDobMonth("");
            setDobDay("");
            setDobYear("");
            setTimezone(getUserTimezone()); // Reset to detected timezone
            setCaptchaToken("");
        }
        setError("");
        setMessage("");
        // Reset touched states when modal opens/closes
        setTouched({
            email: false,
            username: false,
            password: false,
            confirmPassword: false,
            dob: false
        });
    }, [open]);

    useEffect(() => {
        // Reset touched states when switching between login and signup
        setTouched({
            email: false,
            username: false,
            password: false,
            confirmPassword: false,
            dob: false
        });
        setError("");
        setMessage("");
    }, [mode]);

    // check email (debounced, separate)
    useEffect(() => {
        if (mode !== "signup" || !email || !EMAIL_RE.test(email)) {
            setEmailTaken(false);
            return;
        }
        setCheckingEmail(true);
        const t = setTimeout(async () => {
            try {
                const r = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
                const j = await r.json();
                setEmailTaken(!!j.taken);
            } catch {
                setEmailTaken(false);
            } finally {
                setCheckingEmail(false);
            }
        }, 400);
        return () => clearTimeout(t);
    }, [email, mode]);

    // check username (debounced, separate)
    useEffect(() => {
        if (mode !== "signup" || !username || !USERNAME_RE.test(username)) {
            setUsernameTaken(false);
            return;
        }
        setCheckingUsername(true);
        const t = setTimeout(async () => {
            try {
                const r = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
                const j = await r.json();
                setUsernameTaken(!!j.taken);
            } catch {
                setUsernameTaken(false);
            } finally {
                setCheckingUsername(false);
            }
        }, 400);
        return () => clearTimeout(t);
    }, [username, mode]);

    const fieldClass = useCallback((hasError: boolean) => {
        return `w-full block border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/80 transition-colors ${
            hasError ? "border-red-500" : "border-gray-300"
        }`;
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            if (mode === "signup") {
                // Validate all fields before touching them
                const hasErrors = !emailValid || !usernameValid || emailTaken || usernameTaken ||
                    !passwordValid || !passwordsMatch || !dobValid || !captchaToken;

                if (hasErrors) {
                    // Only touch fields that have content
                    setTouched({
                        email: email.length > 0,
                        username: username.length > 0,
                        password: password.length > 0,
                        confirmPassword: confirmPassword.length > 0,
                        dob: dobMonth !== "" || dobDay !== "" || dobYear !== ""
                    });
                }

                if (!emailValid) throw new Error("Enter a valid email.");
                if (!usernameValid) throw new Error("Invalid username.");
                if (emailTaken) throw new Error("Email already registered.");
                if (usernameTaken) throw new Error("Username already taken.");
                if (!passwordValid)
                    throw new Error(
                        "Password must include uppercase, lowercase, number, symbol, and 8+ chars."
                    );
                if (!passwordsMatch) throw new Error("Passwords do not match.");
                if (!dobValid) throw new Error("You must be at least 13 years old.");
                if (!captchaToken) throw new Error("Please complete the captcha.");

                const res = await fetch("/api/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        username,
                        email,
                        password,
                        confirmPassword,
                        dobMonth,
                        dobDay,
                        dobYear,
                        timezone,
                        token: captchaToken,
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Signup failed.");
                setMode("verify");
                setMessage("");
            } else {
                const res = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                });

                if (!res?.ok) {
                    setError("Invalid email or password.");
                    setLoading(false);
                    return;
                }

                setError("");
                setMessage("");
                setLoading(false);
                onClose();
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    }

    async function resendEmail() {
        setLoading(true);
        try {
            await fetch("/api/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            setMessage("Verification email resent.");
        } catch {
            setError("Failed to resend email.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Transition show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 overflow-visible">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                        >
                            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl text-neutral-900 relative overflow-visible">
                                <Dialog.Title className="text-2xl font-semibold text-center mb-6">
                                    {mode === "login"
                                        ? "Log In"
                                        : mode === "signup"
                                            ? "Sign Up"
                                            : "Verify your email"}
                                </Dialog.Title>

                                {mode === "verify" ? (
                                    <div className="text-center space-y-5">
                                        <p className="text-gray-700">
                                            We've sent a verification link to{" "}
                                            <span className="font-medium">{email}</span>.
                                        </p>
                                        <button
                                            onClick={resendEmail}
                                            disabled={loading}
                                            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition disabled:opacity-50"
                                        >
                                            {loading ? "Resending..." : "Resend email"}
                                        </button>
                                        {message && (
                                            <p className="text-green-600 text-sm">{message}</p>
                                        )}
                                        {error && <p className="text-red-500 text-sm">{error}</p>}
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                                        {mode === "signup" && (
                                            <>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="First name"
                                                        value={firstName}
                                                        onChange={(e) => setFirstName(e.target.value)}
                                                        required
                                                        className={fieldClass(false)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Last name"
                                                        value={lastName}
                                                        onChange={(e) => setLastName(e.target.value)}
                                                        required
                                                        className={fieldClass(false)}
                                                    />
                                                </div>
                                                <div className="relative w-full">
                                                    <input
                                                        type="text"
                                                        placeholder="Username"
                                                        value={username}
                                                        onChange={(e) => setUsername(e.target.value)}
                                                        onBlur={(e) => {
                                                            if (e.target.value.length > 0) {
                                                                setTouched(prev => ({ ...prev, username: true }));
                                                            }
                                                        }}
                                                        required
                                                        className={fieldClass(showUsernameInvalid || showUsernameTaken)}
                                                    />
                                                    <TooltipRight
                                                        visible={showUsernameInvalid}
                                                        error
                                                    >
                                                        3-20 characters, letters, numbers, . _ - only
                                                    </TooltipRight>
                                                    <TooltipRight
                                                        visible={showUsernameTaken}
                                                        error
                                                    >
                                                        Username already taken
                                                    </TooltipRight>
                                                    {checkingUsername && (
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                                            …
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        <div className="relative w-full">
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                onBlur={(e) => {
                                                    if (e.target.value.length > 0) {
                                                        setTouched(prev => ({ ...prev, email: true }));
                                                    }
                                                }}
                                                required
                                                className={fieldClass(showEmailInvalid || showEmailTaken)}
                                            />
                                            <TooltipRight
                                                visible={showEmailInvalid}
                                                error
                                            >
                                                Invalid email address
                                            </TooltipRight>
                                            <TooltipRight
                                                visible={showEmailTaken}
                                                error
                                            >
                                                Email already registered —{" "}
                                                <span
                                                    onClick={() => setMode("login")}
                                                    className="underline cursor-pointer"
                                                >
                                                    log in
                                                </span>
                                            </TooltipRight>
                                            {checkingEmail && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                                    …
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative w-full">
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onBlur={(e) => {
                                                    if (e.target.value.length > 0) {
                                                        setTouched(prev => ({ ...prev, password: true }));
                                                    }
                                                }}
                                                required
                                                className={fieldClass(showPasswordError)}
                                            />
                                            <TooltipRight
                                                visible={showPasswordError}
                                                error
                                            >
                                                1+ Capital Letter, 1+ Lowercase Letter,
                                                1 Special Symbol & 8+ Characters
                                            </TooltipRight>
                                        </div>

                                        {mode === "signup" && (
                                            <>
                                                <div className="relative w-full">
                                                    <input
                                                        type="password"
                                                        placeholder="Confirm password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        onBlur={(e) => {
                                                            if (e.target.value.length > 0) {
                                                                setTouched(prev => ({ ...prev, confirmPassword: true }));
                                                            }
                                                        }}
                                                        required
                                                        className={fieldClass(showConfirmPasswordError)}
                                                    />
                                                    <TooltipRight
                                                        visible={showConfirmPasswordError}
                                                        error
                                                    >
                                                        Passwords do not match
                                                    </TooltipRight>
                                                </div>

                                                <label className="text-sm text-gray-600 font-medium mt-1">
                                                    Date of Birth
                                                </label>
                                                <div className="grid grid-cols-3 gap-2 mb-1 relative">
                                                    <select
                                                        value={dobMonth}
                                                        onChange={(e) => setDobMonth(e.target.value ? Number(e.target.value) : "")}
                                                        onBlur={(e) => {
                                                            const hasValue = e.target.value ||
                                                                (e.currentTarget.parentElement?.querySelector('select:nth-child(2)') as HTMLSelectElement)?.value ||
                                                                (e.currentTarget.parentElement?.querySelector('select:nth-child(3)') as HTMLSelectElement)?.value;
                                                            if (hasValue) {
                                                                setTouched(prev => ({ ...prev, dob: true }));
                                                            }
                                                        }}
                                                        required
                                                        className={`${fieldClass(showDobError)} ${dobMonth === "" ? 'text-gray-500' : 'text-gray-900'}`}
                                                    >
                                                        <option value="" className="text-gray-500">Month</option>
                                                        {Array.from({ length: 12 }).map((_, i) => (
                                                            <option key={i + 1} value={i + 1} className="text-gray-900">
                                                                {i + 1}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={dobDay}
                                                        onChange={(e) => setDobDay(e.target.value ? Number(e.target.value) : "")}
                                                        onBlur={(e) => {
                                                            const hasValue = e.target.value || dobMonth || dobYear;
                                                            if (hasValue) {
                                                                setTouched(prev => ({ ...prev, dob: true }));
                                                            }
                                                        }}
                                                        required
                                                        className={`${fieldClass(showDobError)} ${dobDay === "" ? 'text-gray-500' : 'text-gray-900'}`}
                                                    >
                                                        <option value="" className="text-gray-500">Day</option>
                                                        {Array.from({ length: 31 }).map((_, i) => (
                                                            <option key={i + 1} value={i + 1} className="text-gray-900">
                                                                {i + 1}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={dobYear}
                                                        onChange={(e) => setDobYear(e.target.value ? Number(e.target.value) : "")}
                                                        onBlur={(e) => {
                                                            const hasValue = e.target.value || dobMonth || dobDay;
                                                            if (hasValue) {
                                                                setTouched(prev => ({ ...prev, dob: true }));
                                                            }
                                                        }}
                                                        required
                                                        className={`${fieldClass(showDobError)} ${dobYear === "" ? 'text-gray-500' : 'text-gray-900'}`}
                                                    >
                                                        <option value="" className="text-gray-500">Year</option>
                                                        {Array.from({ length: 100 }).map((_, i) => {
                                                            const y = new Date().getFullYear() - i;
                                                            return (
                                                                <option key={y} value={y} className="text-gray-900">
                                                                    {y}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>

                                                    <TooltipRight
                                                        visible={showDobError}
                                                        error
                                                    >
                                                        Must be 13+ years old
                                                    </TooltipRight>
                                                </div>

                                                {/* Timezone Selection */}
                                                <div>
                                                    <label className="text-sm text-gray-600 font-medium">
                                                        Timezone (for charts display)
                                                    </label>
                                                    <select
                                                        value={timezone}
                                                        onChange={(e) => setTimezone(e.target.value)}
                                                        required
                                                        className={`${fieldClass(false)} text-gray-900 mt-2`}
                                                    >
                                                        {TIMEZONES.map((tz) => (
                                                            <option key={tz.value} value={tz.value}>
                                                                {tz.label} ({tz.offset})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        All market data will be displayed in this timezone
                                                    </p>
                                                </div>

                                                <TurnstileWidget onVerify={setCaptchaToken} />
                                            </>
                                        )}

                                        {error && (
                                            <p className="text-red-600 text-sm text-center">
                                                {error}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-black text-white py-2.5 rounded-xl hover:bg-neutral-800 transition disabled:opacity-50"
                                        >
                                            {loading
                                                ? "Please wait..."
                                                : mode === "login"
                                                    ? "Log In"
                                                    : "Sign Up"}
                                        </button>
                                    </form>
                                )}

                                {mode !== "verify" && (
                                    <p className="text-sm text-center text-neutral-500 mt-5">
                                        {mode === "login" ? (
                                            <>
                                                Don't have an account?{" "}
                                                <span
                                                    onClick={() => setMode("signup")}
                                                    className="text-black font-medium cursor-pointer hover:underline"
                                                >
                          Sign up
                        </span>
                                            </>
                                        ) : (
                                            <>
                                                Already have an account?{" "}
                                                <span
                                                    onClick={() => setMode("login")}
                                                    className="text-black font-medium cursor-pointer hover:underline"
                                                >
                          Log in
                        </span>
                                            </>
                                        )}
                                    </p>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}