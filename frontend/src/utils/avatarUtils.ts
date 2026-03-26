export const getAbsoluteUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    const normalizedPath = path.replace(/\\/g, '/');
    if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
        return normalizedPath;
    }
    // @ts-ignore
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const serverUrl = baseUrl.replace(/\/api$/, '');
    return `${serverUrl}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
};

export const getInitials = (name?: string, fallbackMail?: string): string => {
    if (name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        if (parts.length > 1) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
    }
    return fallbackMail?.charAt(0).toUpperCase() || "U";
};
