import { Router } from 'express';
import * as clientPortalController from '../controllers/clientPortalController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

/**
 * Authenticated Routes - Require Project Manager or higher
 */

// Generate share link for a project
router.post(
    '/:projectId/share',
    requirePermission('projects', 'update'),
    clientPortalController.generateShareLink
);

// Get all share links for a project
router.get(
    '/:projectId/shares',
    requirePermission('projects', 'read'),
    clientPortalController.getProjectShareLinks
);

// Revoke a share link
router.delete(
    '/shares/:linkId',
    requirePermission('projects', 'update'),
    clientPortalController.revokeShareLink
);

/**
 * Public Routes - No authentication required (token-based validation)
 */

// Validate share token (with optional password)
router.post(
    '/shared/:token/validate',
    clientPortalController.validateShareToken,
    (req, res) => res.json({ success: true, message: 'Token validated' })
);

// Get shared project details
router.get(
    '/shared/:token',
    clientPortalController.validateShareToken,
    clientPortalController.getSharedProject
);

// Get shared project documents
router.get(
    '/shared/:token/documents',
    clientPortalController.validateShareToken,
    clientPortalController.getSharedDocuments
);

// Get shared project photos
router.get(
    '/shared/:token/photos',
    clientPortalController.validateShareToken,
    clientPortalController.getSharedPhotos
);

export default router;
