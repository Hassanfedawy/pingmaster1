import { NextResponse } from 'next/server';
import { monitoringInstance } from '@/lib/monitoringInstance';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (monitoringInstance.isRunning()) {
      return NextResponse.json({ 
        status: 'running',
        message: 'Monitoring service is already running' 
      });
    }

    await monitoringInstance.initialize();
    
    return NextResponse.json({ 
      status: 'started',
      message: 'Monitoring service started successfully' 
    });
  } catch (error) {
    console.error('Monitoring service error:', error);
    return NextResponse.json(
      { error: 'Failed to manage monitoring service' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    switch (action) {
      case 'start':
        await monitoringInstance.initialize();
        return NextResponse.json({ message: 'Monitoring service started' });
      
      case 'stop':
        await monitoringInstance.stop();
        return NextResponse.json({ message: 'Monitoring service stopped' });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Monitoring service error:', error);
    return NextResponse.json(
      { error: 'Failed to manage monitoring service' },
      { status: 500 }
    );
  }
}
