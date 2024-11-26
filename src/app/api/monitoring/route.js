import { MonitoringService } from '@/lib/monitoring';
import { NextResponse } from 'next/server';

let isMonitoringStarted = false;

export async function GET() {
  try {
    if (!isMonitoringStarted) {
      await MonitoringService.startMonitoring();
      isMonitoringStarted = true;
      return NextResponse.json({ message: 'Monitoring service started successfully' });
    }
    return NextResponse.json({ message: 'Monitoring service is already running' });
  } catch (error) {
    console.error('Failed to start monitoring service:', error);
    return NextResponse.json(
      { error: 'Failed to start monitoring service' },
      { status: 500 }
    );
  }
}

// Start monitoring service when the application starts
if (!isMonitoringStarted) {
  MonitoringService.startMonitoring()
    .then(() => {
      isMonitoringStarted = true;
      console.log('Monitoring service started automatically');
    })
    .catch((error) => {
      console.error('Failed to start monitoring service:', error);
    });
}
