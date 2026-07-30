import { Router } from 'express';
import { runHotspotCheck } from '../jobs/hotspotChecker.js';
export function createChecksRouter(io) {
    const router = Router();
    router.post('/', async (_req, res) => {
        try {
            await runHotspotCheck(io);
            res.json({ message: 'Hotspot check completed' });
        }
        catch (error) {
            console.error('Manual hotspot check failed:', error);
            res.status(500).json({ error: 'Failed to run hotspot check' });
        }
    });
    return router;
}
//# sourceMappingURL=checks.js.map