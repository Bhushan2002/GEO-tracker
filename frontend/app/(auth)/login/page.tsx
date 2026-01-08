"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";

/**
 * Login page component for user authentication.
 * Handles credential submission, error handling, and session redirection.
 */
export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Welcome back!", {
                    description: "Login successful. Redirecting to dashboard...",
                });
                router.push("/");
                router.refresh();
            } else {
                toast.error("Authentication failed", {
                    description: data.message || "Invalid credentials provided.",
                });
            }
        } catch (error) {
            toast.error("Error", {
                description: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#050505] text-white">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#0a0a0a] relative overflow-hidden border-r border-white/5">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-white">
                        Geo-Tracker
                    </h1>
                    <p className="mt-4 text-white/50 text-lg max-w-md font-light">
                        Audit Intelligence Portal
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-white/30 text-sm font-mono">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Protected Workspace
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-sm font-mono tracking-widest text-white/40 uppercase outline-none">
                            Sign In
                        </h2>
                        <h3 className="text-3xl font-semibold tracking-tight">Welcome back</h3>
                        <p className="text-white/40 font-light">Authenticate to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {/* Username Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="username"
                                    className="text-xs font-medium text-white/60 ml-1"
                                >
                                    Username
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        id="username"
                                        type="text"
                                        required
                                        className="w-full bg-[#111] border border-white/5 focus:border-white/20 rounded-xl px-12 py-3 outline-none transition-all placeholder:text-white/10"
                                        placeholder="Enter your username"
                                        value={formData.username}
                                        onChange={(e) =>
                                            setFormData({ ...formData, username: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="text-xs font-medium text-white/60 ml-1"
                                >
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-[#111] border border-white/5 focus:border-white/20 rounded-xl px-12 py-3 outline-none transition-all placeholder:text-white/10"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({ ...formData, password: e.target.value })
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:active:scale-100"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
