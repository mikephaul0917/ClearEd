import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { motion } from "framer-motion";
import AuthenticationOverlay from "../../components/AuthenticationOverlay";
import { InlineSpinner, spinnerStyles } from "../../components/ui/LoadingSpinner";
import { formatErrorForDisplay } from "../../utils/errorMessages";

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
    white: "#FFFFFF",
    black: "#000000",
    deep: "#0a0a0a",
    teal: "#5fcca0",
    lavender: "#cb9bfb",
    yellow: "#FEF08A",
    orange: "#ff895d",
    muted: "#6B7280",
    subtle: "#9CA3AF",
    font: "'Inter', system-ui, -apple-system, sans-serif",
};

interface Quote {
    text: string;
    author: string;
}

const RegisterPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showAuthOverlay, setShowAuthOverlay] = useState(false);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [focusField, setFocusField] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const quotes = await authService.getPublicQuotes("login");
                if (quotes && quotes.length > 0) {
                    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                    setQuote(randomQuote);
                }
            } catch (error) {
                console.error("Failed to fetch quotes:", error);
            }
        };
        fetchQuote();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            Swal.fire({
                icon: "warning",
                title: "Required Fields",
                text: "Please enter your email and password.",
                confirmButtonColor: C.black,
            });
            return;
        }

        setIsLoading(true);
        try {
            const success = await login(formData.email.toLowerCase(), formData.password);
            if (success) {
                setShowAuthOverlay(true);
            } else {
                throw new Error("Login failed. Please check your credentials.");
            }
        } catch (error: any) {
            const errorInfo = formatErrorForDisplay(error);
            Swal.fire({
                icon: "error",
                title: errorInfo.title,
                text: errorInfo.message,
                confirmButtonColor: C.black,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthOverlayComplete = () => {
        setShowAuthOverlay(false);
        navigate("/role-selection");
    };

    const inputContainerStyle = {
        marginBottom: "32px",
    };

    const labelStyle = (fieldName: string): React.CSSProperties => ({
        display: "block",
        fontFamily: C.font,
        fontSize: "14px",
        fontWeight: 500,
        color: C.black,
        marginBottom: "8px",
    });

    const inputStyle = (fieldName: string): React.CSSProperties => ({
        width: "100%",
        fontFamily: C.font,
        fontSize: "16px",
        backgroundColor: C.white,
        border: `1px solid ${focusField === fieldName ? C.black : "#E2E8F0"}`,
        borderRadius: "12px",
        padding: "12px 16px",
        outline: "none",
        transition: "border-color 0.2s ease",
        color: C.black,
        boxSizing: "border-box",
    });

    return (
        <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{
                display: "flex",
                height: "calc(100vh - 56px)",
                overflow: "hidden",
                boxSizing: "border-box",
                backgroundColor: C.white,
                fontFamily: C.font,
                flexDirection: "row" // Default for desktop
            }} className="register-container">
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&display=swap"
            />

            {/* ── Left Side: Inspiration ── */}
            <div className="register-quote-side" style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "80px 40px",
                fontFamily: "'Inter', sans-serif",
                position: "relative",
                overflow: "hidden",
            }}>
                <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "440px" }}>
                    {/* Large Quote Symbol */}
                    <div className="register-quote-symbol" style={{
                        fontSize: "120px",
                        lineHeight: 1,
                        fontFamily: "Georgia, serif",
                        color: "#5f5f5fff",
                        marginBottom: "0px",
                        fontWeight: "bold",
                        userSelect: "none"
                    }}>
                        ❝
                    </div>

                    {quote ? (
                        <>
                            <h2 className="register-quote-text" style={{
                                fontSize: "36px",
                                fontWeight: 700,
                                lineHeight: 1.25,
                                color: "#111827",
                                marginBottom: "28px",
                                letterSpacing: "-0.02em"
                            }}>
                                "{quote.text}"
                            </h2>
                            <p className="register-quote-author" style={{
                                fontSize: "18px",
                                color: "#4B5563",
                                fontWeight: 400,
                            }}>
                                — {quote.author}
                            </p>
                        </>
                    ) : (
                        <h2 className="register-quote-text" style={{
                            fontSize: "24px",
                            fontWeight: 600,
                            lineHeight: 1.25,
                            color: "#111827",
                            marginBottom: "20px",
                            letterSpacing: "-0.02em"
                        }}>
                            "Programming isn't about what you know; it's about what you can figure out."
                            <br />
                            <span className="register-quote-author" style={{ fontSize: "18px", color: "#6B7280", fontWeight: 400, display: "block", marginTop: "16px" }}>— Chris Pine</span>
                        </h2>
                    )}
                </div>
            </div>

            {/* ── Right Side: Authentication ── */}
            <div className="register-right-side" style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 40px",
                backgroundColor: "#F9FAFB",
            }}>
                <div style={{ width: "100%", maxWidth: "440px" }}>
                    <div className="register-form-header" style={{ textAlign: "center", marginBottom: "64px" }}>
                        <h1 className="register-welcome-title" style={{
                            margin: "0 0 0px",
                            fontWeight: 700,
                            fontSize: "32px",
                            letterSpacing: "-0.025em",
                            color: "#111827",
                        }}>
                            Welcome back
                        </h1>
                        <p className="register-welcome-subtitle" style={{
                            margin: 0,
                            fontSize: "16px",
                            color: "#6B7280",
                            fontWeight: 400,
                        }}>
                            Let's get you back to learning
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <div style={inputContainerStyle}>
                            <label style={labelStyle("email")}>Email address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                placeholder="Enter your email"
                                autoComplete="off"
                                disabled={isLoading}
                                onChange={handleInputChange}
                                onFocus={() => setFocusField("email")}
                                onBlur={() => setFocusField(null)}
                                style={inputStyle("email")}
                            />
                        </div>

                        <div style={inputContainerStyle}>
                            <label style={labelStyle("password")}>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                placeholder="Enter your password"
                                autoComplete="new-password"
                                disabled={isLoading}
                                onChange={handleInputChange}
                                onFocus={() => setFocusField("password")}
                                onBlur={() => setFocusField(null)}
                                style={inputStyle("password")}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "#4B5563", fontWeight: 400 }}>
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleInputChange}
                                    style={{ cursor: "pointer" }}
                                />
                                Remember me
                            </label>
                            <a href="#" style={{ fontSize: "14px", fontWeight: 500, color: C.black, textDecoration: "none" }}>
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: "100%",
                                fontSize: "15px",
                                fontWeight: 500,
                                color: C.white,
                                backgroundColor: C.black,
                                border: "1px solid #000000",
                                borderRadius: "100px",
                                padding: "14px",
                                cursor: isLoading ? "not-allowed" : "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                marginBottom: "0px",
                                boxShadow: "0 8px 16px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.1)",
                                transform: "translateY(0)"
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = "#222";
                                e.currentTarget.style.transform = "translateY(-1px)";
                                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.2), 0 6px 12px rgba(0,0,0,0.15)";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = C.black;
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.1)";
                            }}
                        >
                            {isLoading ? (
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                                    <span>Signing in</span>
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                    >.</motion.span>
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                    >.</motion.span>
                                    <motion.span
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                    >.</motion.span>
                                </div>
                            ) : "Sign in"}
                        </button>
                    </form>

                    {/* Google Sign In Section */}
                    <div style={{ display: "flex", alignItems: "center", margin: "20px 0 24px", gap: "16px" }}>
                        <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
                        <span style={{ fontSize: "14px", color: "#94A3B8" }}>OR</span>
                        <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
                    </div>

                    <button
                        type="button"
                        style={{
                            width: "100%",
                            fontSize: "15px",
                            fontWeight: 500,
                            color: C.black,
                            backgroundColor: C.white,
                            border: "3px solid #FFFFFF",
                            borderRadius: "100px",
                            padding: "11px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: "0 8px 16px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)",
                            transform: "translateY(0)"
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#F9FAFB";
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 12px 20px rgba(0,0,0,0.08), 0 6px 10px rgba(0,0,0,0.06)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = C.white;
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)";
                        }}
                    >
                        {/* Placeholder for Google Icon */}
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        sign in with google
                    </button>
                </div>
            </div>

            <style>{`
        ${spinnerStyles}
        @media (max-width: 900px) {
            .register-container { flex-direction: column !important; height: auto !important; overflow: auto !important; min-height: 100vh !important; }
            .register-quote-side { 
                flex: none !important;
                min-height: 30vh !important;
                width: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                padding: 32px 24px !important; 
                text-align: center !important;
            }
            .register-right-side {
                flex: 1 !important;
                width: 100% !important;
                padding: 40px 24px !important;
            }
            .register-quote-text { font-size: 20px !important; margin-bottom: 12px !important; }
            .register-quote-author { font-size: 14px !important; }
            .register-quote-symbol { font-size: 60px !important; margin-bottom: -10px !important; }
        }
        @media (max-width: 600px) {
            .register-right-side { padding: 64px 32px !important; }
            .register-form-header { margin-bottom: 32px !important; }
            .register-welcome-title { font-size: 26px !important; }
            .register-welcome-subtitle { font-size: 14px !important; }
        }
        input::placeholder { color: #94A3B8; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #FFFFFF inset;
          -webkit-text-fill-color: #0a0a0a;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

            <AuthenticationOverlay
                isOpen={showAuthOverlay}
                message="Login Successful"
                userName={formData.email.split('@')[0]}
                userRole="Verified User"
                institutionName="E-Clearance System"
                duration={2500}
                onComplete={handleAuthOverlayComplete}
            />
        </motion.div>
    );
};

export default RegisterPage;
