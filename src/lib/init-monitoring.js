import { MonitoringService } from './monitoring';

let monitoringInitialized = false;

export async function initializeMonitoring() {
    if (monitoringInitialized) {
        return;
    }

    try {
        await MonitoringService.startMonitoring();
        monitoringInitialized = true;
        console.log('Monitoring service initialized successfully');
    } catch (error) {
        console.error('Failed to initialize monitoring service:', error);
        throw error;
    }
}
