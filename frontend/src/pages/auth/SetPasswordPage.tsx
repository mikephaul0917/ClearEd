import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services";
import { motion } from "framer-motion";

// ── Palette (matches RegisterPage) ──────────────────────────────────────────
const C = {
    white: "#FFFFFF",
    black: "#000000",
    deep: "#0a0a0a",
    teal: "#5fcca0",
    muted: "#6B7280",
    subtle: "#9CA3AF",
    font: "'Inter', system-ui, -apple-system, sans-serif",
};

export default function SetPasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [focusField, setFocusField] = useState<string | null>(null);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = localStorage.getItem("role") || "student";

    const roleRoutes: Record<string, string> = {
        student: "/student",
        officer: "/officer",
        dean: "/dean",
        admin: "/admin",
        super_admin: "/super-admin",
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);
        try {
            await authService.setupPassword(password);

            // Update local user data to remove the flag
            const updatedUser = { ...user, requiresPasswordSetup: false };
            localStorage.setItem("user", JSON.stringify(updatedUser));

            // Redirect to dashboard
            navigate(roleRoutes[role] || "/student");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to set password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        navigate(roleRoutes[role] || "/student");
    };

    const inputStyle = (field: string): React.CSSProperties => ({
        width: "100%",
        height: "48px",
        padding: "0 44px 0 16px",
        fontSize: "15px",
        fontFamily: C.font,
        fontWeight: 400,
        color: C.black,
        backgroundColor: focusField === field ? "#FFFFFF" : "#F8FAFC",
        border: focusField === field ? "2px solid #0a0a0a" : "1.5px solid #E2E8F0",
        borderRadius: "14px",
        outline: "none",
        transition: "all 0.2s ease",
        boxSizing: "border-box" as const,
    });

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: C.font,
                background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                padding: "24px",
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                    width: "100%",
                    maxWidth: "440px",
                    backgroundColor: C.white,
                    borderRadius: "24px",
                    padding: "48px 40px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03)",
                }}
            >
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "36px" }}>
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "16px",
                            background: "linear-gradient(135deg, #0a0a0a, #1a1a1a)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px",
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#fff" strokeWidth="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1
                        style={{
                            fontSize: "24px",
                            fontWeight: 700,
                            color: C.black,
                            margin: 0,
                            lineHeight: 1.3,
                        }}
                    >
                        Set Your Password
                    </h1>
                    <p
                        style={{
                            fontSize: "14px",
                            color: C.muted,
                            margin: "10px 0 0",
                            lineHeight: 1.6,
                        }}
                    >
                        Welcome, <strong>{user.fullName || "there"}</strong>! Set a password so
                        you can also sign in with your email and password.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div
                        style={{
                            padding: "12px 16px",
                            marginBottom: "20px",
                            borderRadius: "12px",
                            backgroundColor: "rgba(220, 38, 38, 0.06)",
                            border: "1px solid rgba(220, 38, 38, 0.15)",
                            color: "#DC2626",
                            fontSize: "13px",
                            fontWeight: 500,
                            fontFamily: C.font,
                            lineHeight: 1.5,
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                            <path
                                d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                                stroke="#DC2626"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "20px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: C.black,
                                marginBottom: "8px",
                            }}
                        >
                            New Password
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusField("password")}
                                onBlur={() => setFocusField(null)}
                                style={inputStyle("password")}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute",
                                    right: "14px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: C.subtle,
                                    padding: 0,
                                    display: "flex",
                                }}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: "28px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: C.black,
                                marginBottom: "8px",
                            }}
                        >
                            Confirm Password
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onFocus={() => setFocusField("confirm")}
                            onBlur={() => setFocusField(null)}
                            style={inputStyle("confirm")}
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={!isLoading ? { y: -2, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)" } : {}}
                        whileTap={!isLoading ? { scale: 0.98 } : {}}
                        style={{
                            width: "100%",
                            height: "48px",
                            backgroundColor: C.black,
                            color: C.white,
                            border: "none",
                            borderRadius: "100px",
                            fontSize: "15px",
                            fontWeight: 500,
                            fontFamily: C.font,
                            cursor: isLoading ? "not-allowed" : "pointer",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.18)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {isLoading ? (
                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                <span>Setting password</span>
                                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>.</motion.span>
                                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}>.</motion.span>
                            </div>
                        ) : (
                            "Set Password"
                        )}
                    </motion.button>
                </form>

                {/* Skip Link */}
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <button
                        onClick={handleSkip}
                        style={{
                            background: "none",
                            border: "none",
                            color: C.muted,
                            fontSize: "13px",
                            fontFamily: C.font,
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0,
                        }}
                    >
                        Skip for now — I'll only use Google Sign-in
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
