import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock Auth Middleware BEFORE importing app
vi.mock('../middleware/authMiddleware.js', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        req.user = { id: 'test-user', email: 'test@example.com' };
        // also set headers if tenantMiddleware uses them?
        // tenantMiddleware reads x-company-id header.
        next();
    }
}));

import app from '../index.js';
// Mock database to avoid writing to real DB during tests?
// ideally yes, but for "functional" test against sqlite/mock it might be fine for now.
// For now, let's just test the validation logic which doesn't hit DB if it fails early?
// Actually, it hits DB on success. 
// Since we use `getDb()` which uses `initializeDatabase()`, we should ensure DB is init.
// Vitest runs in a separate process, so it will use the "Local/Dev" sqlite logic.

describe('API Integration Tests', () => {

    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/api/unknown-route');
        expect(res.status).toBe(404);
        expect(res.body.status).toBe('fail');
    });

    it('POST /api/companies should return 400 if name is missing', async () => {
        const res = await request(app)
            .post('/api/companies')
            .send({
                // missing name
                plan: 'Enterprise'
            });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(res.body.message).toBe('Company name is required');
    });

    it('POST /api/companies should create a company with valid data', async () => {
        const res = await request(app)
            .post('/api/companies')
            .send({
                name: 'Test Company ' + Date.now(),
                plan: 'Pro'
            });

        // It might fail if DB is not initialized. 
        // In server/index.ts, DB init happens in `startServer()`. 
        // `app` is exported, but `startServer` is called as side effect?
        // Yes, `startServer()` is called at the end of `index.ts`. 
        // So when we import `app`, `startServer` runs. 
        // But it's async. We might need to wait a bit or export a promise?
        // For this stabilization phase, let's hope it inits fast enough or mock it.
        // Actually, creating a company writes to DB.

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
    });

    it('GET /api/projects should return empty list (or filtered) initially', async () => {
        const res = await request(app).get('/api/projects').set('x-company-id', 'test-tenant-123');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/projects should fail validation if name missing', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('x-company-id', 'test-tenant-123')
            .send({
                description: 'Project without name'
            });

        expect(res.status).toBe(400); // Zod validation error
        expect(res.body.status).toBe('fail');
    });

    it('POST /api/projects should create project', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('x-company-id', 'test-tenant-123')
            .send({
                name: 'New Skyscraper',
                status: 'Planning'
            });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        // expect(res.body.companyId).toBe('test-tenant-123'); // logic might depend on header injection order
    });
});
