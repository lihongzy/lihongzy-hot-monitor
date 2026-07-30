import cron from 'node-cron';
import { runHotspotCheck } from './hotspotChecker.js';
export function startHotspotScheduler(io) {
    const task = cron.schedule('*/30 * * * *', async () => {
        console.log('Running scheduled hotspot check...');
        try {
            await runHotspotCheck(io);
            console.log('Scheduled hotspot check completed');
        }
        catch (error) {
            console.error('Scheduled hotspot check failed:', error);
        }
    });
    return task;
}
//# sourceMappingURL=scheduler.js.map