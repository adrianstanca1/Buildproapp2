import { Request, Response, NextFunction } from 'express';
import { fileBucket } from '../buckets/FileBucket.js';
import { BucketRegistry } from '../buckets/DataBucket.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Document Controller
 * Handles document upload, download, and management with tenant isolation
 */

const documentBucket = BucketRegistry.getOrCreate('documents', 'companyId');

/**
 * Upload document
 */
export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
        const userId = req.user?.id;

        if (!tenantId || !userId) {
            throw new AppError('Authentication required', 401);
        }

        // In a real implementation, this would use multer or similar
        // For now, we'll assume file data is in req.body
        const { filename, content, projectId, category } = req.body;

        if (!filename || !content) {
            throw new AppError('Filename and content required', 400);
        }

        // Upload file with tenant namespacing
        const { path, url } = await fileBucket.upload(
            tenantId,
            filename,
            Buffer.from(content, 'base64'),
            userId,
            { projectId, category: category || 'documents' }
        );

        // Store document metadata in database
        const document = await documentBucket.create(
            tenantId,
            {
                id: `doc-${Date.now()}`,
                filename,
                path,
                url,
                projectId,
                category: category || 'documents',
                uploadedBy: userId,
                uploadedAt: new Date().toISOString(),
                size: Buffer.from(content, 'base64').length,
            },
            userId
        );

        res.status(201).json({ success: true, data: document });
    } catch (error) {
        next(error);
    }
};

/**
 * Get documents for tenant
 */
export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
        const { projectId, category } = req.query;

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        const filters: any = {};
        if (projectId) filters.projectId = projectId;
        if (category) filters.category = category;

        const documents = await documentBucket.query(tenantId, filters, {
            orderBy: 'uploadedAt',
            orderDirection: 'DESC',
        });

        res.json({ success: true, data: documents });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single document
 */
export const getDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
        const { id } = req.params;

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        const document = await documentBucket.getById(tenantId, id);

        if (!document) {
            throw new AppError('Document not found', 404);
        }

        res.json({ success: true, data: document });
    } catch (error) {
        next(error);
    }
};

/**
 * Download document
 */
export const downloadDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
        const { id } = req.params;

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        // Get document metadata
        const document = await documentBucket.getById(tenantId, id);

        if (!document) {
            throw new AppError('Document not found', 404);
        }

        // Download file content
        const content = await fileBucket.download(
            tenantId,
            document.filename,
            { projectId: document.projectId, category: document.category }
        );

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
        res.send(content);
    } catch (error) {
        next(error);
    }
};

/**
 * Delete document
 */
export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
        const userId = req.user?.id;
        const { id } = req.params;

        if (!tenantId || !userId) {
            throw new AppError('Authentication required', 401);
        }

        // Get document metadata
        const document = await documentBucket.getById(tenantId, id);

        if (!document) {
            throw new AppError('Document not found', 404);
        }

        // Delete file from storage
        await fileBucket.delete(
            tenantId,
            document.filename,
            userId,
            { projectId: document.projectId, category: document.category }
        );

        // Delete document metadata
        await documentBucket.delete(tenantId, id, userId);

        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * List files in directory
 */
export const listFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
        const { projectId, category } = req.query;

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        const files = await fileBucket.list(tenantId, {
            projectId: projectId as string,
            category: category as string,
        });

        res.json({ success: true, data: files });
    } catch (error) {
        next(error);
    }
};
