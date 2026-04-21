import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import AuthenticationOverlay from "../../components/AuthenticationOverlay";
import { InlineSpinner, spinnerStyles } from "../../components/ui/LoadingSpinner";
import { formatErrorForDisplay } from "../../utils/errorMessages";
import GlassButton from "./liquid-glass";

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
    white: "#FFFFFF",
    black: "#3c4043",
    deep: "#0a0a0a",
    teal: "#5fcca0",
    lavender: "#cb9bfb",
    yellow: "#FEF08A",
    orange: "#ff895d",
    muted: "#6B7280",
    subtle: "#9CA3AF",
    font: '"Google Sans", "Product Sans", Roboto, sans-serif',
};

interface Quote {
    text: string;
    author: string;
}

const RegisterPage = () => {
    const navigate = useNavigate();
    const { login, loginWithToken } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showAuthOverlay, setShowAuthOverlay] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);
    const [googleSuccess, setGoogleSuccess] = useState<string | null>(null);
    const [authUserName, setAuthUserName] = useState<string>("");
    const [authUserRole, setAuthUserRole] = useState<string>("");
    const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
    const [quote, setQuote] = useState<Quote>({ text: "Loading inspiration...", author: "" });
    const [focusField, setFocusField] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const response = await authService.getPublicQuotes("login");

                // Handle both single quote object and array response
                const fetchedQuotes = Array.isArray(response) ? response : (response ? [response] : []);

                if (fetchedQuotes.length > 0) {
                    const randomQuote = fetchedQuotes[Math.floor(Math.random() * fetchedQuotes.length)];
                    setQuote(randomQuote);
                }
            } catch (error) {
                console.error("Failed to fetch quotes:", error);
            }
        };
        fetchQuote();

        // Check for remembered email
        const rememberedEmail = localStorage.getItem("rememberedEmail");
        const rememberMe = localStorage.getItem("rememberMe") === "true";
        if (rememberedEmail) {
            setFormData(prev => ({
                ...prev,
                email: rememberedEmail,
                rememberMe: rememberMe
            }));
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        // Clear errors for this field when typing
        if (errors[name]) {
            const newErrors = { ...errors };
            delete newErrors[name];
            setErrors(newErrors);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) return;

        setIsLoading(true);
        try {
            const success = await login(
                formData.email.toLowerCase(),
                formData.password,
                false,
                false, // Registration disabled on this flow
                formData.rememberMe
            );
            if (success) {
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                setAuthUserName(storedUser.fullName || formData.email.split('@')[0]);
                setAuthUserRole(storedUser.role || 'student');
                setShowAuthOverlay(true);
            } else {
                setErrors({
                    email: "Invalid email or password",
                    password: "Invalid email or password"
                });
            }
        } catch (error: any) {
            const errorInfo = formatErrorForDisplay(error);
            // Targeted inline errors instead of popups
            setErrors({
                email: errorInfo.message,
                password: errorInfo.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthOverlayComplete = () => {
        setShowAuthOverlay(false);
        // Redirect to password setup if required, otherwise to role dashboard
        if (needsPasswordSetup) {
            navigate('/set-password');
            return;
        }
        const roleRoutes: Record<string, string> = {
            student: '/student',
            officer: '/officer',
            dean: '/dean',
            admin: '/admin',
            super_admin: '/super-admin'
        };
        const targetRoute = roleRoutes[authUserRole] || '/student';
        navigate(targetRoute);
    };

    // Google Sign-in handler
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleLoading(true);
            setGoogleError(null);
            setGoogleSuccess(null);
            try {
                const data = await authService.googleAuth(tokenResponse.access_token);
                const { token: jwt, user: returnedUser } = data;

                // Use loginWithToken to properly update AuthContext + localStorage
                loginWithToken(jwt, returnedUser, formData.rememberMe);

                setAuthUserName(returnedUser.fullName || returnedUser.email.split('@')[0]);
                setAuthUserRole(returnedUser.role);
                setNeedsPasswordSetup(returnedUser.requiresPasswordSetup || false);
                setShowAuthOverlay(true);
            } catch (error: any) {
                const code = error?.response?.data?.code;
                const errorMsg = error?.response?.data?.message || 'Google sign-in failed. Please try again.';

                // Access request was created/pending — show as info, not error
                if (code === 'ACCESS_REQUEST_SENT' || code === 'ACCESS_REQUEST_PENDING') {
                    setGoogleError(null);
                    setGoogleSuccess(errorMsg);
                } else {
                    setGoogleSuccess(null);
                    setGoogleError(errorMsg);
                }
            } finally {
                setGoogleLoading(false);
            }
        },
        onError: () => {
            setGoogleError('Google sign-in was cancelled or failed.');
        },
    });

    const inputContainerStyle: React.CSSProperties = {
        position: "relative",
        marginBottom: "36px",
        width: "100%",
    };

    const labelStyle = (name: string): React.CSSProperties => {
        const hasError = !!errors?.[name];
        const isFocused = focusField === name;
        const hasValue = !!formData[name as keyof typeof formData];
        const isFloating = isFocused || hasValue;

        return {
            position: "absolute",
            left: "14px",
            top: isFloating ? "-10px" : "16px",
            fontSize: isFloating ? "12px" : "15px",
            color: hasError ? "#DC2626" : (isFocused ? C.black : "#64748B"),
            backgroundColor: isFloating ? "white" : "transparent",
            padding: "0 6px",
            pointerEvents: "none",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: 3,
            fontWeight: isFloating ? 700 : 400,
            fontFamily: C.font,
        };
    };

    const inputStyle = (name: string): React.CSSProperties => {
        const hasError = !!errors?.[name];
        const isFocused = focusField === name;
        const hasValue = !!formData[name as keyof typeof formData];

        return {
            width: "100%",
            height: "54px",
            padding: "16px 20px",
            fontSize: "15px",
            fontFamily: C.font,
            backgroundColor: "white",
            border: `1.5px solid ${hasError ? "#DC2626" : (isFocused ? C.black : "#E2E8F0")}`,
            borderRadius: "14px",
            outline: "none",
            transition: "all 0.2s ease",
            color: '#000',
            boxShadow: (isFocused && !hasError) ? `0 0 0 4px rgba(0, 0, 0, 0.05)` : "none",
            boxSizing: "border-box",
        };
    };

    const errorMsgStyle: React.CSSProperties = {
        fontSize: "12px",
        color: "#DC2626",
        marginTop: "6px",
        marginLeft: "14px",
        fontWeight: 500,
        fontStyle: "italic",
        display: "block"
    };

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
                backgroundColor: "#F6F6F6",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "80px 40px",
                fontFamily: '"Google Sans", "Product Sans", Roboto, sans-serif',
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

                    <h2 className="register-quote-text" style={{
                        fontSize: "24px",
                        fontWeight: 600,
                        lineHeight: 1.25,
                        color: "#111827",
                        marginBottom: "16px",
                        letterSpacing: "-0.0125em"
                    }}>
                        "{quote.text}"
                    </h2>
                    <p className="register-quote-author" style={{
                        fontSize: "18px",
                        color: "#4B5563",
                        fontWeight: 400,
                    }}>
                        - {quote.author}
                    </p>
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
                    <div className="register-form-header" style={{ textAlign: "center", marginBottom: "48px" }}>
                        <h1 className="register-welcome-title" style={{
                            fontSize: "34px",
                            fontWeight: 700,
                            letterSpacing: "-0.03em",
                            lineHeight: "1.0",
                            color: '#000',
                            marginBottom: "12px"
                        }}>
                            Welcome back
                        </h1>
                        <p className="register-welcome-subtitle" style={{
                            fontSize: "16px",
                            color: "#64748B",
                            fontWeight: 400,
                            lineHeight: "1.0",
                            maxWidth: "500px",
                            margin: "0 auto"
                        }}>
                            Access your e-clearance dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: "24px" }}>
                            <div style={inputContainerStyle}>
                                <label style={labelStyle("email")}>Email address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    autoComplete="off"
                                    disabled={isLoading}
                                    onChange={handleInputChange}
                                    onFocus={() => setFocusField("email")}
                                    onBlur={() => setFocusField(null)}
                                    style={inputStyle("email")}
                                    required
                                />
                                {errors.email && <span style={errorMsgStyle}>{errors.email}</span>}
                            </div>
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <div style={inputContainerStyle}>
                                <label style={labelStyle("password")}>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    autoComplete="new-password"
                                    disabled={isLoading}
                                    onChange={handleInputChange}
                                    onFocus={() => setFocusField("password")}
                                    onBlur={() => setFocusField(null)}
                                    style={inputStyle("password")}
                                    required
                                />
                                {errors.password && <span style={errorMsgStyle}>{errors.password}</span>}
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div
                                onClick={() => setFormData(prev => ({ ...prev, rememberMe: !prev.rememberMe }))}
                                style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}
                            >
                                <motion.div
                                    animate={{
                                        backgroundColor: formData.rememberMe ? C.black : "transparent",
                                        borderColor: formData.rememberMe ? C.black : "#E2E8F0"
                                    }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        border: "2px solid",
                                        borderRadius: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden"
                                    }}
                                >
                                    {formData.rememberMe && (
                                        <motion.svg
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            width="12"
                                            height="12"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                        >
                                            <path
                                                d="M2 6L5 9L10 3"
                                                stroke="white"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </motion.svg>
                                    )}
                                </motion.div>
                                <span style={{ fontSize: "14px", color: "#64748B", fontWeight: 500 }}>
                                    Remember me
                                </span>
                            </div>
                            <a href="https://support.google.com/mail/answer/41078?hl=en&co=GENIE.Platform%3DDesktop" style={{ fontSize: "14px", color: '#000', fontWeight: 600, textDecoration: "none" }}>
                                Forgot password?
                            </a>
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={!isLoading ? {
                                    y: -2,
                                    scale: 1.01,
                                    boxShadow: '0 30px 45px -12px rgba(0,0,0,0.45), 0 15px 20px -8px rgba(0,0,0,0.25)'
                                } : {}}
                                whileTap={!isLoading ? { scale: 0.98 } : {}}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    backgroundColor: C.black,
                                    color: C.white,
                                    border: "none",
                                    borderRadius: "100px",
                                    fontSize: "15px",
                                    fontWeight: 500,
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    boxShadow: "0 20px 30px -10px rgba(0,0,0,0.35), 0 10px 15px -5px rgba(0,0,0,0.15)",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                {isLoading ? (
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                                        <span>Signing in</span>
                                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>.</motion.span>
                                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}>.</motion.span>
                                    </div>
                                ) : "Sign in"}
                            </motion.button>
                        </div>
                    </form>

                    {/* Google Sign In Section */}
                    <div style={{ display: "flex", alignItems: "center", margin: "20px 0 24px", gap: "16px" }}>
                        <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
                        <span style={{ fontSize: "14px", color: "#94A3B8" }}>OR</span>
                        <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
                    </div>

                    {googleError && (
                        <div style={{
                            padding: '12px 16px',
                            marginBottom: '16px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(220, 38, 38, 0.06)',
                            border: '1px solid rgba(220, 38, 38, 0.15)',
                            color: '#DC2626',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: C.font,
                            lineHeight: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                <path d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {googleError}
                        </div>
                    )}

                    {googleSuccess && (
                        <div style={{
                            padding: '12px 16px',
                            marginBottom: '16px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(16, 185, 129, 0.06)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            color: '#047857',
                            fontSize: '13px',
                            fontWeight: 500,
                            fontFamily: C.font,
                            lineHeight: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                <path d="M9 12l2 2 4-4m6 2a10 10 0 11-20 0 10 10 0 0120 0z" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {googleSuccess}
                        </div>
                    )}

                    <GlassButton
                        variant="default"
                        size="md"
                        onClick={() => googleLogin()}
                        disabled={googleLoading}
                        style={{ padding: "12px 16px" }}
                    >
                        {googleLoading ? (
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                                <span>Signing in</span>
                                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }}>.</motion.span>
                                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}>.</motion.span>
                            </div>
                        ) : (
                            <>
                                {/* Google Icon */}
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Sign in with Google
                            </>
                        )}
                    </GlassButton>
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
                userName={authUserName || formData.email.split('@')[0]}
                userRole="Verified User"
                institutionName="E-Clearance System"
                duration={2500}
                onComplete={handleAuthOverlayComplete}
            />
        </motion.div>
    );
};

export default RegisterPage;
