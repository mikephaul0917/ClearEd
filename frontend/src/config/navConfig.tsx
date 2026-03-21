import React from "react";

/* ---------------- Icon Components ---------------- */
/**
 * Generic Icon wrapper using the SVG style from SidebarOriginal
 */
interface IconProps {
    color?: string;
}

const IconBase: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "currentColor" }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
        {children}
    </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <path d="M3 12l9-9 9 9" /> <path d="M5 10v10h14V10" /> </IconBase>
);

export const FileIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /> <path d="M14 2v6h6" /> </IconBase>
);

export const UsersIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <circle cx="9" cy="7" r="4" /> <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /> </IconBase>
);

export const ChartIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <path d="M3 3v18h18" /> <path d="M7 14v4" /> <path d="M12 10v8" /> <path d="M17 6v12" /> </IconBase>
);

export const BellIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /> <path d="M13.7 21a2 2 0 0 1-3.4 0" /> </IconBase>
);

export const SettingsIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 3.4 19l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L3.2 6.2A2 2 0 1 1 6.03 3.4l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 9 2.28V2a2 2 0 1 1 4 0v.09c0 .7.4 1.34 1.03 1.64.63.3 1.37.2 1.88-.3l.06-.06A2 2 0 1 1 20.6 6.03l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01c.3.63.94 1.03 1.64 1.03H22a2 2 0 1 1 0 4h-.09c-.7 0-1.34.4-1.64 1.03z" />
    </IconBase>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /> <polyline points="22 4 12 14.01 9 11.01" /> </IconBase>
);

export const AssignmentIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /> <rect x="8" y="2" width="8" height="4" rx="1" ry="1" /> </IconBase>
);

export const BusinessIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <rect x="2" y="10" width="20" height="12" rx="2" /> <path d="M6 10V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" /> <path d="M10 10h4" /> </IconBase>
);

export const HistoryIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <path d="M12 8v4l3 3" /> <circle cx="12" cy="12" r="9" /> </IconBase>
);

export const RateReviewIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> <path d="M9 10h6" /> <path d="M9 14h3" /> </IconBase>
);

export const CommentIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.6c1.1 0 2.1.2 3.1.5l4-.5-1 4z" /> </IconBase>
);

export const CalendarIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /> <line x1="16" y1="2" x2="16" y2="6" /> <line x1="8" y1="2" x2="8" y2="6" /> <line x1="3" y1="10" x2="21" y2="10" /> </IconBase>
);

export const CertificateIcon: React.FC<IconProps> = ({ color }) => (
    <IconBase color={color} > <circle cx="12" cy="8" r="7" /> <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /> </IconBase>
);

/* ---------------- Configuration ---------------- */

export interface NavItem {
    key: string;
    label: string;
    path: string;
    icon: React.FC<IconProps>;
}

export const NAV_CONFIG: Record<string, NavItem[]> = {
    super_admin: [
        { key: "dashboard", label: "Dashboard", path: "/super-admin/dashboard", icon: HomeIcon },
        { key: "institution-requests", label: "Institution Requests", path: "/super-admin/institution-requests", icon: FileIcon },
        { key: "institution-monitoring", label: "Institution Monitoring", path: "/super-admin/institution-monitoring", icon: BusinessIcon },
        { key: "system-analytics", label: "System Analytics", path: "/super-admin/system-analytics", icon: ChartIcon },
        { key: "announcements", label: "Announcements", path: "/super-admin/announcements", icon: BellIcon },
        { key: "settings", label: "Settings", path: "/super-admin/settings", icon: SettingsIcon },
    ],
    admin: [
        { key: "dashboard", label: "Dashboard", path: "/admin/dashboard", icon: HomeIcon },
        { key: "users", label: "Users List", path: "/admin/users", icon: UsersIcon },
        { key: "terms", label: "AY & Term", path: "/admin/terms", icon: CalendarIcon },
        { key: "organizations", label: "Organizations", path: "/admin/organizations", icon: BusinessIcon },
        { key: "records", label: "System Records", path: "/admin/records", icon: HistoryIcon },
        { key: "settings", label: "Settings", path: "/admin/settings", icon: SettingsIcon },
    ],
    student: [
        { key: "dashboard", label: "Home", path: "/home", icon: HomeIcon },
        { key: "todo", label: "To-Do", path: "/student/todo", icon: CheckCircleIcon },
        { key: "progress", label: "My Clearance", path: "/student/progress", icon: AssignmentIcon },
        { key: "certificate", label: "Clearance Receipt", path: "/student/certificate", icon: CertificateIcon },
        { key: "settings", label: "Settings", path: "/student/settings", icon: SettingsIcon },
    ],
    officer: [
        { key: "dashboard", label: "Home", path: "/home", icon: HomeIcon },
        { key: "todo", label: "To-Do", path: "/officer/todo", icon: CheckCircleIcon },
        { key: "review", label: "Sign Off", path: "/officer/review", icon: RateReviewIcon },
        { key: "settings", label: "Settings", path: "/officer/settings", icon: SettingsIcon },
    ],
    dean: [
        { key: "dashboard", label: "Final Approvals", path: "/dean", icon: CheckCircleIcon },
        { key: "approvals", label: "Org Overview", path: "/dean/approvals", icon: BusinessIcon },
        { key: "settings", label: "Settings", path: "/dean/settings", icon: SettingsIcon },
    ],
};
