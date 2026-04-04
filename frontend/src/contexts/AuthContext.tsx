import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AuthPayload, AuthUser } from '../types/auth';
import { api, authService, setAuthHeader, clearAuthHeader } from '../services';
import { formatErrorForDisplay } from '../utils/errorMessages';

export interface AuthContextProps {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string, isSuperAdmin?: boolean, isRegister?: boolean) => Promise<boolean>;
    loginWithToken: (jwt: string, returnedUser: any) => boolean;
    logout: () => void;
    mockLogin: (userData: any, mockToken: string) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // Start as true while checking local storage

    const decodeToken = (jwt: string): AuthPayload | null => {
        try {
            // Check if it's a mock token (base64 encoded JSON from test mode)
            // Mock tokens are shorter and don't have the typical JWT structure with dots
            if (jwt.length < 200 && !jwt.includes('.')) {
                const decoded = JSON.parse(atob(jwt));
                return {
                    id: decoded.id,
                    role: decoded.role,
                    institutionId: decoded.institutionId,
                    email: decoded.email,
                    exp: decoded.exp,
                    iat: decoded.iat
                };
            }
            return jwtDecode<AuthPayload>(jwt);
        } catch (error) {
            console.error('[AuthContext] Token decode error:', error);
            return null;
        }
    };

    const persistToken = (jwt: string | null) => {
        if (jwt) {
            localStorage.setItem('authToken', jwt);
            setAuthHeader(jwt);
        } else {
            localStorage.removeItem('authToken');
            clearAuthHeader();
        }
    };

    const performLogout = useCallback(() => {
        persistToken(null);
        setToken(null);
        setUser(null);
    }, []);

    // Initial load from storage
    useEffect(() => {
        const stored = localStorage.getItem('authToken');
        console.log('[AuthContext] Initial load, checking stored token:', stored ? 'found' : 'not found');
        
        if (stored) {
            const payload = decodeToken(stored);
            console.log('[AuthContext] Decoded payload:', payload);
            
            if (payload && payload.exp * 1000 > Date.now()) {
                console.log('[AuthContext] Token valid, setting user state');
                setToken(stored);
                setUser({
                    id: payload.id,
                    role: payload.role,
                    institutionId: payload.institutionId,
                    email: payload.email
                });
                setAuthHeader(stored);
            } else {
                console.log('[AuthContext] Token expired or invalid, clearing');
                persistToken(null);
            }
        }
        setLoading(false);

        // Listen to unauthorized events globally triggered by API interceptor
        const handleUnauthorized = () => {
            console.log('[AuthContext] Unauthorized event received');
            performLogout();
        };

        // Listen to storage events for token changes
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'authToken') {
                console.log('[AuthContext] Storage event detected for authToken');
                const newToken = e.newValue;
                if (newToken) {
                    const payload = decodeToken(newToken);
                    if (payload && payload.exp * 1000 > Date.now()) {
                        console.log('[AuthContext] Storage event - Token valid, updating user state');
                        setToken(newToken);
                        setUser({
                            id: payload.id,
                            role: payload.role,
                            institutionId: payload.institutionId,
                            email: payload.email
                        });
                        setAuthHeader(newToken);
                    } else {
                        console.log('[AuthContext] Storage event - Token expired or invalid, clearing');
                        performLogout();
                    }
                } else {
                    console.log('[AuthContext] Storage event - Token cleared, logging out');
                    performLogout();
                }
            }
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [performLogout]);

    const login = async (email: string, password: string, isSuperAdmin = false, isRegister = false): Promise<boolean> => {
        try {
            const data = await authService.login(email, password, isSuperAdmin, isRegister);
            const { token: jwt, user: returnedUser } = data;
            const payload = decodeToken(jwt);
            if (!payload) throw new Error('Invalid token');

            const userData: AuthUser = {
                id: payload.id,
                role: payload.role,
                institutionId: payload.institutionId,
                email: payload.email,
                avatarUrl: returnedUser.avatarUrl,
                fullName: returnedUser.fullName,
                username: returnedUser.username
            };

            persistToken(jwt);
            setToken(jwt);
            setUser(userData);

            // Set variables needed by other pages/legacy logic
            localStorage.setItem("token", jwt);
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("role", userData.role);
            localStorage.setItem("email", userData.email || "");
            localStorage.setItem("username", userData.fullName || "");

            return true;
        } catch (error: any) {
            console.error('Login failed:', error);
            return false;
        }
    };

    // Login with an existing JWT token (for Google OAuth)
    const loginWithToken = (jwt: string, returnedUser: any): boolean => {
        try {
            const payload = decodeToken(jwt);
            if (!payload) throw new Error('Invalid token');

            const userData: AuthUser = {
                id: payload.id,
                role: payload.role,
                institutionId: payload.institutionId,
                email: payload.email,
                avatarUrl: returnedUser.avatarUrl,
                fullName: returnedUser.fullName,
                username: returnedUser.username
            };

            persistToken(jwt);
            setToken(jwt);
            setUser(userData);

            // Set variables needed by other pages/legacy logic
            localStorage.setItem("token", jwt);
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("role", userData.role);
            localStorage.setItem("email", userData.email || "");
            if (returnedUser.institutionId) {
                localStorage.setItem("institutionId", returnedUser.institutionId);
            }
            localStorage.setItem("username", returnedUser.fullName || "");

            return true;
        } catch (error) {
            console.error('loginWithToken failed:', error);
            return false;
        }
    };

    // Mock login for test mode
    const mockLogin = (userData: any, mockToken: string): void => {
        console.log('[AuthContext] Mock login called with token:', mockToken);
        console.log('[AuthContext] Mock login called with userData:', userData);
        
        const payload = decodeToken(mockToken);
        if (!payload) {
            console.error('[AuthContext] Invalid mock token - decodeToken returned null');
            console.error('[AuthContext] Token length:', mockToken.length);
            console.error('[AuthContext] Token content:', mockToken);
            return;
        }

        console.log('[AuthContext] Mock login - setting user state');
        
        // First, update all AuthContext state
        persistToken(mockToken);
        setToken(mockToken);
        setUser({
            id: payload.id,
            role: payload.role,
            institutionId: payload.institutionId,
            email: payload.email
        });

        // Then set localStorage for legacy compatibility
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("role", userData.role);
        localStorage.setItem("email", userData.email);
        localStorage.setItem("institutionId", userData.institutionId);

        // Force a storage event to ensure consistency
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'authToken',
            newValue: mockToken,
            oldValue: null
        }));

        console.log('[AuthContext] Mock login completed - user state set and storage event dispatched');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, loginWithToken, logout: performLogout, mockLogin }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
