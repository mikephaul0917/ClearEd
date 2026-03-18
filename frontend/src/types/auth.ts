export interface AuthPayload {
    id: string; // user id (Mongo ObjectId as string)
    role: 'student' | 'officer' | 'admin' | 'super_admin' | 'dean';
    institutionId?: string; // undefined for super‑admin
    email?: string; // optional, useful for UI
    username?: string; // full name
    exp: number; // JWT expiry (seconds since epoch)
    iat: number; // issued‑at
}

/** Minimal user object stored in context */
export interface AuthUser {
    id: string;
    role: AuthPayload['role'];
    institutionId?: string;
    email?: string;
    username?: string;
}
