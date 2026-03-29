import React from "react";
import { motion } from "framer-motion";

interface GlassButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "default" | "primary" | "secondary";
    size?: "sm" | "md" | "lg";
    style?: React.CSSProperties;
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit" | "reset";
}

/**
 * Reusable Liquid Glass Button component
 * Provides a highly translucent, frosted glass aesthetic with a subtle shimmer.
 */
const GlassButton: React.FC<GlassButtonProps> = ({
    children,
    onClick,
    variant = "default",
    size = "md",
    style,
    disabled = false,
    className,
    type = "button",
}) => {
    // Handling different sizes
    const padding = size === "sm" ? "10px 18px" : size === "lg" ? "18px 36px" : "13px 26px";
    const fontSize = size === "sm" ? "14px" : size === "lg" ? "18px" : "15px";

    // Base background colors based on variants
    const getBaseBackground = () => {
        if (disabled) return "#F9FAFB";
        switch (variant) {
            case "primary": return "#F3F4F6";
            case "secondary": return "#F9FAFB";
            default: return "#FFFFFF";
        }
    };

    const baseShadow = "0 15px 35px rgba(0,0,0,0.12)";
    const hoverShadow = "0 20px 45px rgba(0,0,0,0.18)";

    return (
        <motion.button
            type={type}
            whileHover={!disabled ? {
                y: -2,
                scale: 1.01,
                boxShadow: hoverShadow,
                backgroundColor: "#FFFFFF"
            } : undefined}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
            onClick={onClick}
            disabled={disabled}
            className={className}
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                width: "100%",
                padding,
                fontSize,
                fontWeight: 700,
                color: "#000000",
                background: getBaseBackground(),
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid #E5E7EB",
                borderRadius: "100px",
                cursor: disabled ? "not-allowed" : "pointer",
                overflow: "hidden",
                boxShadow: baseShadow,
                ...style,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            {/* Extremely subtle Shimmer effect */}
            {!disabled && (
                <motion.div
                    initial={{ left: "-100%" }}
                    animate={{ left: "100%" }}
                    transition={{
                        repeat: Infinity,
                        duration: 4,
                        ease: "linear",
                    }}
                    style={{
                        position: "absolute",
                        top: 0,
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
            )}

            <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "inherit" }}>
                {children}
            </span>
        </motion.button>
    );
};

export default GlassButton;
