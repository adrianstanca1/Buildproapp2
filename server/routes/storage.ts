
import express from 'express';
import multer from 'multer';
import { uploadFile, getSignedUrl, deleteFile } from '../services/storageService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Memory storage for multer (files are uploaded to Supabase immediately)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// POST /api/storage/upload
router.post('/upload', upload.single('file'), async (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const bucket = req.body.bucket || 'project-documents';
        const pathPrefix = req.body.pathPrefix || '';

        logger.info(`Uploading file ${req.file.originalname} to bucket ${bucket}`);

        const { path, error } = await uploadFile(
            bucket,
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname,
            pathPrefix
        );

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // Get signed URL for immediate display
        let signedUrl = null;
        try {
            signedUrl = await getSignedUrl(bucket, path);
        } catch (err) {
            logger.warn('Failed to generate signed URL after upload', err);
        }

        res.json({ success: true, path, bucket, url: signedUrl });
    } catch (e: any) {
        logger.error('Upload Route Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/storage/url
router.get('/url', async (req: any, res: any) => {
    try {
        const { bucket, path } = req.query;
        if (!bucket || !path) {
            return res.status(400).json({ error: 'Bucket and path are required' });
        }

        const signedUrl = await getSignedUrl(bucket as string, path as string);
        res.json({ signedUrl });
    } catch (e: any) {
        logger.error('Signed URL Route Error:', e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
