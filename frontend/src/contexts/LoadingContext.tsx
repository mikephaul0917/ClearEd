import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    startLoading: () => void;
    stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Optionally, use a counter to handle multiple simultaneous requests
    const [requestCount, setRequestCount] = useState(0);

    const startLoading = () => setRequestCount((prev) => prev + 1);
    const stopLoading = () => setRequestCount((prev) => Math.max(0, prev - 1));

    const isLoading = requestCount > 0;

    return (
        <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = (): LoadingContextType => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};
