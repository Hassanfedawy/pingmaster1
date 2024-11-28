import { MonitoringService } from '@/lib/monitoring';
import { NextResponse } from 'next/server';

// Use a more reliable way to track monitoring state
let monitoringPromise = null;

export async function GET() {
  try {
    if (!monitoringPromise) {
      monitoringPromise = MonitoringService.startMonitoring();
      await monitoringPromise;
      return NextResponse.json({ message: 'Monitoring service started successfully' });
    }
    return NextResponse.json({ message: 'Monitoring service is already running' });
  } catch (error) {
    console.error('Failed to start monitoring service:', error);
    // Reset the promise on error so we can try again
    monitoringPromise = null;
    return NextResponse.json(
      { error: 'Failed to start monitoring service: ' + error.message },
      { status: 500 }
    );
  }
}

// Start monitoring service when the application starts
if (!monitoringPromise) {
  monitoringPromise = MonitoringService.startMonitoring()
    .then(() => {
      console.log('Monitoring service started automatically');
    })
    .catch((error) => {
      console.error('Failed to start monitoring service:', error);
      monitoringPromise = null;
    });
}
