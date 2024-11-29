import { MonitoringService } from '@/lib/monitoring';
import { NextResponse } from 'next/server';

// Use global state to persist monitoring state across hot reloads
const globalForMonitoring = global;
globalForMonitoring.monitoringPromise = globalForMonitoring.monitoringPromise || null;

export async function GET() {
  try {
    if (!globalForMonitoring.monitoringPromise) {
      globalForMonitoring.monitoringPromise = MonitoringService.startMonitoring();
      await globalForMonitoring.monitoringPromise;
      return NextResponse.json({ message: 'Monitoring service started successfully' });
    }
    return NextResponse.json({ message: 'Monitoring service is already running' });
  } catch (error) {
    console.error('Failed to start monitoring service:', error);
    // Reset the promise on error so we can try again
    globalForMonitoring.monitoringPromise = null;
    return NextResponse.json(
      { error: 'Failed to start monitoring service: ' + error.message },
      { status: 500 }
    );
  }
}

// Initialize monitoring in development (will be handled by _app.js in production)
if (process.env.NODE_ENV === 'development' && !globalForMonitoring.monitoringPromise) {
  globalForMonitoring.monitoringPromise = MonitoringService.startMonitoring()
    .then(() => {
      console.log('Monitoring service started automatically in development');
    })
    .catch((error) => {
      console.error('Failed to start monitoring service:', error);
      globalForMonitoring.monitoringPromise = null;
    });
}
