import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    userId?: string;
    userName?: string;
    tenantId?: string;
    user?: any;
    context?: {
        userId: string;
        tenantId: string;
        role: string;
        permissions?: string[];
        isSuperadmin?: boolean;
    };
}
