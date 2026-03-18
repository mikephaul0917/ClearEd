/**
 * Custom application error class to standardize error reporting.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly status: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Helper to wrap async functions and catch errors, passing them to the next middleware.
 */
export const catchAsync = (fn: Function) => {
    return (req: any, res: any, next: any) => {
        fn(req, res, next).catch(next);
    };
};
