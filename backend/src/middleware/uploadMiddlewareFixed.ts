import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Extend Express Request type to include uploadedFiles
declare global {
  namespace Express {
    interface Request {
      uploadedFiles?: Array<{
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploadedAt: Date;
      }>;
    }
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

// File filter to validate file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  // Check file type
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF, Word, and image files are allowed.`));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  }
});

// Middleware to handle file uploads with validation
export const handleFileUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.array('files', 5)(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB per file.'
        });
      }
      
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 5 files per upload.'
        });
      }

      if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'File upload failed: ' + err.message
      });
    }
    
    // Handle files array (can be empty for announcements without attachments)
    const files = req.files as Express.Multer.File[];
    
    // Add file metadata to request for controller access (only if files exist)
    if (files && files.length > 0) {
      req.uploadedFiles = files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      }));
    } else {
      // No files uploaded - set empty array
      req.uploadedFiles = [];
    }

    next();
  });
};

// Utility function to clean up old files (optional)
export const cleanupOldFiles = (daysOld: number = 30) => {
  const uploadDir = 'uploads/';
  const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

  fs.readdir(uploadDir, (err, files) => {
    if (err) return;

    files.forEach((file) => {
      const filePath = path.join(uploadDir, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) return;

        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting old file:', unlinkErr);
            } else {
              console.log('Deleted old file:', file);
            }
          });
        }
      });
    });
  });
};
