
import { auditLog } from './AuditLogService';

const SERVICES = [
    { name: 'Gemini AI', endpoint: 'https://generativelanguage.googleapis.com' },
    { name: 'Supabase', endpoint: 'https://supabase.co' }, // Simplified
];

export async function runHealthCheck() {
    console.log("Starting Infrastructure Health Check...");
    const results = [];

    for (const service of SERVICES) {
        try {
            const start = Date.now();
            const res = await fetch(service.endpoint, { method: 'HEAD', mode: 'no-cors' });
            const latency = Date.now() - start;
            results.push({ name: service.name, status: 'Online', latency });
        } catch (e) {
            results.push({ name: service.name, status: 'Offline', error: String(e) });
        }
    }

    console.table(results);

    // Log failures
    const failures = results.filter(r => r.status === 'Offline');
    if (failures.length > 0) {
        auditLog.log({
            userId: 'system',
            userName: 'HealthCheckBot',
            action: 'HEALTH_CHECK_FAILURE',
            entityType: 'Security',
            entityId: 'infrastructure',
            details: `Services down: ${failures.map(f => f.name).join(', ')}`,
            tenantId: 'global'
        });
    }

    return results;
}
