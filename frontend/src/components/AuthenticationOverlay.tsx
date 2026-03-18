import React, { useEffect, useState } from 'react';
import { Fade, Backdrop } from '@mui/material';

// ── Design Tokens — Modern Bento Theme ───────────────────────────────────────
// 60% White · 30% Black · 10% Accent (teal / lavender / yellow)
const C = {
  white: '#FFFFFF',
  black: '#0a0a0a',
  muted: '#6B7280',
  subtle: '#9CA3AF',
  border: '#000000',       // flat black borders
  teal: '#5fcca0',
  lavender: '#cb9bfb',
  yellow: '#f9fd91',
  font: "'Plus Jakarta Sans', 'Inter', 'Montserrat', system-ui, -apple-system, sans-serif",
};

interface AuthenticationOverlayProps {
  isOpen: boolean;
  message?: string;
  userName?: string;
  userRole?: string;
  institutionName?: string;
  duration?: number;
  onComplete?: () => void;
}

const AuthenticationOverlay: React.FC<AuthenticationOverlayProps> = ({
  isOpen,
  message = 'Authentication Successful',
  userName,
  userRole,
  institutionName,
  duration = 3000,
  onComplete,
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false);
      setProgress(0);

      const successTimer = setTimeout(() => setShowSuccess(true), 500);

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) { clearInterval(progressInterval); return 100; }
          return prev + 2;
        });
      }, duration / 50);

      const closeTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, duration);

      return () => {
        clearTimeout(successTimer);
        clearTimeout(closeTimer);
        clearInterval(progressInterval);
      };
    }
  }, [isOpen, duration, onComplete]);

  if (!isOpen) return null;

  return (
    <>
      {/* Load all three theme fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Montserrat:wght@400;500;600;700;800;900&display=swap"
      />

      {/* ── Backdrop — flat black, no blur ── */}
      <Backdrop open={isOpen} sx={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.72)' }}>
        <Fade in={isOpen} timeout={400}>
          {/* ── Card ─────────────────────────────────────────────────────── */}
          <div style={{
            width: '100%',
            maxWidth: '400px',
            margin: '0 24px',
            backgroundColor: C.white,
            border: `1.5px solid ${C.black}`,
            borderRadius: '20px',
            overflow: 'hidden',
            fontFamily: C.font,
          }}>

            {/* Body */}
            <div style={{ padding: '36px 32px 32px', textAlign: 'center' }}>

              {/* Avatar circle */}
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: showSuccess ? C.black : C.white,
                border: `1.5px solid ${C.black}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                transition: 'background-color 0.4s ease',
              }}>
                {showSuccess ? (
                  /* Checkmark */
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  /* Spinning ring */
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.black} strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'ao-spin 0.75s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.15" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                )}
              </div>

              {/* Main message */}
              <h2 style={{
                margin: '0 0 6px',
                fontFamily: C.font,
                fontSize: '1.375rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: C.black,
                opacity: showSuccess ? 1 : 0.3,
                transition: 'opacity 0.4s ease',
              }}>
                {showSuccess ? 'Access Granted' : 'Verifying…'}
              </h2>

              <p style={{
                margin: '0 0 20px',
                fontFamily: C.font,
                fontSize: '0.875rem',
                color: C.muted,
                lineHeight: 1.7,
                opacity: showSuccess ? 1 : 0.3,
                transition: 'opacity 0.4s ease 0.1s',
              }}>
                {message}
              </p>

              {/* User info pills — flat Bento style */}
              {showSuccess && (userName || userRole || institutionName) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  {userName && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      backgroundColor: C.teal,       // 10% teal accent
                      border: 'none',
                      borderRadius: '999px',          // pill
                      padding: '6px 18px',
                      fontFamily: C.font,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: C.black,
                    }}>
                      Welcome, {userName}!
                    </div>
                  )}
                  {userRole && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      backgroundColor: C.black,      // 30% black anchor
                      borderRadius: '999px',          // pill
                      padding: '5px 18px',
                      fontFamily: C.font,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: C.white,
                    }}>
                      {userRole}
                    </div>
                  )}
                  {institutionName && (
                    <div style={{
                      fontFamily: C.font,
                      fontSize: '0.75rem',
                      color: C.muted,
                      lineHeight: 1.6,
                    }}>
                      {institutionName}
                    </div>
                  )}
                </div>
              )}

              {/* Progress bar — flat teal, no gradient */}
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#E5E7EB',
                borderRadius: '999px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: showSuccess ? C.teal : C.lavender,  // flat accent swap
                  borderRadius: '999px',
                  transition: 'width 0.1s linear',
                }} />
              </div>

              {/* Status caption */}
              <p style={{
                margin: '12px 0 0',
                fontFamily: C.font,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.subtle,
              }}>
                {showSuccess ? 'Redirecting to dashboard…' : 'Securing your session…'}
              </p>
            </div>

            {/* Footer — flat white, black border top, accent dots */}
            <div style={{
              borderTop: `1.5px solid ${C.black}`,
              backgroundColor: C.white,
              padding: '10px 32px',
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
            }}>
              {[C.teal, C.lavender, C.yellow].map((col, i) => (
                <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col }} />
              ))}
            </div>
          </div>
        </Fade>
      </Backdrop>

      <style>{`@keyframes ao-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default AuthenticationOverlay;
