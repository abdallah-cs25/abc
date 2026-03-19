import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const router = express.Router();

// ============================================
// STORAGE CONFIGURATION (Dual Strategy)
// ============================================

// 1. Local Storage (Fallback)
const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// 2. S3 Storage (Primary if configured)
let s3Storage;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME) {
    const s3 = new S3Client({
        region: process.env.AWS_REGION || 'eu-west-3', // Default to Paris or standard region
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });

    s3Storage = multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        // acl: 'public-read', // Deprecated in many buckets, better to use strict policy or public access block settings
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            cb(null, `uploads/${Date.now()}_${path.basename(file.originalname)}`);
        }
    });
    console.log('✅ AWS S3 Storage Configured');
} else {
    console.log('⚠️ AWS Credentials missing. Falling back to Local Storage.');
}

// Select Storage Engine
const storage = s3Storage || diskStorage;

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Single file upload route
router.post('/', upload.single('image'), (req: any, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Check if file was uploaded to S3 (has location) or Local (needs path construction)
        let fileUrl;
        if (req.file.location) {
            fileUrl = req.file.location; // S3 URL
        } else {
            fileUrl = `/uploads/${req.file.filename}`; // Local URL
        }

        res.json({
            success: true,
            data: {
                url: fileUrl,
                filename: req.file.key || req.file.filename // store key for S3, filename for local
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

// Multiple files upload route
router.post('/multiple', upload.array('images', 5), (req: any, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const files = req.files as any[]; // Type assertion for S3/Multer mix
        const fileUrls = files.map(file => {
            if (file.location) return file.location;
            return `/uploads/${file.filename}`;
        });

        res.json({
            success: true,
            data: {
                urls: fileUrls
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

export default router;
