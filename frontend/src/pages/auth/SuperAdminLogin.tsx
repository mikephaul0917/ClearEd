import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { InlineSpinner, spinnerStyles } from "../../components/ui/LoadingSpinner";
import { formatErrorForDisplay } from "../../utils/errorMessages";
import { ERROR_MESSAGES } from "../../utils/errorMessages";

// ── Palette ────────────────────────────────────────────────────────────────────
// White #FFFFFF (60%) · Black #000000 (30%) · Accents (10%)
// Teal #5fcca0 · Deep Black #0a0a0a · Lavender #cb9bfb · Yellow #FEF08A · Orange #ff895d
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
  font: "'Inter', system-ui, -apple-system, sans-serif",
};

export default function SuperAdminLoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      const validationError = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
      window.dispatchEvent(new CustomEvent('app:show-modal', {
        detail: {
          title: validationError.title,
          description: validationError.message,
          mode: 'error'
        }
      }));
      return;
    }
    setIsLoading(true);
    try {
      await login(email.toLowerCase(), password, true);
      nav("/super-admin/dashboard");
    } catch (error: any) {
      const errorInfo = formatErrorForDisplay(error);
      window.dispatchEvent(new CustomEvent('app:show-modal', {
        detail: {
          title: errorInfo.title,
          description: errorInfo.message,
          mode: 'error'
        }
      }));
    } finally {
      setIsLoading(false);
    }
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
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
      />

      <div className="login-container" style={{
        minHeight: "100vh",
        backgroundColor: C.white,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 40px",
        fontFamily: C.font,
      }}>
        <div className="login-box" style={{ width: "100%", maxWidth: "440px" }}>

          <div className="login-header" style={{ textAlign: "center", marginBottom: "64px" }}>
            <h1 className="login-title" style={{
              margin: "0 0 8px",
              fontWeight: 700,
              fontSize: "32px",
              letterSpacing: "-0.025em",
              color: "#111827",
            }}>
              Super Admin
            </h1>
            <p className="login-subtitle" style={{
              margin: 0,
              fontSize: "16px",
              color: "#6B7280",
              fontWeight: 400,
            }}>
              Sign in to manage and monitor the platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div style={inputContainerStyle}>
              <label style={labelStyle("email")}>Email address</label>
              <input
                type="email"
                value={email}
                placeholder="superadmin@email.com"
                autoComplete="off"
                disabled={isLoading}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusField("email")}
                onBlur={() => setFocusField(null)}
                style={inputStyle("email")}
              />
            </div>

            <div style={inputContainerStyle}>
              <label style={labelStyle("password")}>Password</label>
              <input
                type="password"
                value={password}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusField("password")}
                onBlur={() => setFocusField(null)}
                style={inputStyle("password")}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                fontSize: "14px",
                fontWeight: 600,
                color: C.white,
                backgroundColor: C.black,
                border: "none",
                borderRadius: "999px",
                padding: "16px 32px",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#4d5154";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#3c4043";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
              }}
            >
              {isLoading ? (
                <>
                  <InlineSpinner color={C.white} />
                  authenticating…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Footer separator */}
          <div style={{
            borderTop: "1px solid rgba(0,0,0,0.08)",
            paddingTop: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{
              fontSize: "12px",
              color: C.subtle,
              fontWeight: 400,
            }}>
              Unauthorized access may result in legal action.
            </span>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: C.teal,
              }} />
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                color: C.teal,
                letterSpacing: "0.05em",
              }}>
                Online
              </span>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        ${spinnerStyles}
        @media (max-width: 600px) {
            .login-container { padding: 64px 32px !important; }
            .login-header { margin-bottom: 32px !important; }
            .login-title { font-size: 26px !important; }
            .login-subtitle { font-size: 14px !important; }
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

    </>
  );
}
