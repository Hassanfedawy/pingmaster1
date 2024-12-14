import { MonitoringService } from '@/lib/monitoring';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        // Get all URLs
        const urls = await prisma.URL.findMany();
        
        // Force immediate checks with different timeouts to simulate issues
        const results = await Promise.all(urls.map(async (url) => {
            // For the first URL, simulate a timeout
            if (url.url.includes('amazonclone')) {
                const result = await MonitoringService.checkUrl({
                    ...url,
                    timeout: 0.1 // 100ms timeout to force failure
                });
                return { url: url.url, result };
            }
            
            // Normal check for other URLs
            const result = await MonitoringService.checkUrl(url);
            return { url: url.url, result };
        }));

        return NextResponse.json({
            success: true,
            message: 'Test completed successfully',
            results
        });
    } catch (error) {
        console.error('Test failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the URL ID from the request
    const { urlId } = await req.json();
    if (!urlId) {
      return NextResponse.json({ error: 'URL ID is required' }, { status: 400 });
    }

    // Get the URL from the database
    const url = await prisma.URL.findUnique({
      where: { id: urlId },
      include: { user: true }
    });

    if (!url) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    if (url.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Perform the check
    const result = await MonitoringService.checkUrl(url);

    return NextResponse.json({ 
      success: true,
      status: result.status,
      responseTime: result.responseTime,
      error: result.error,
      lastChecked: result.lastChecked
    });
  } catch (error) {
    console.error('Error testing URL:', error);
    return NextResponse.json({ 
      error: 'Failed to test URL',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Force restart monitoring service
    await MonitoringService.startMonitoring();

    return NextResponse.json({ 
      success: true,
      message: 'Monitoring service restarted'
    });
  } catch (error) {
    console.error('Error restarting monitoring:', error);
    return NextResponse.json({ 
      error: 'Failed to restart monitoring',
      details: error.message 
    }, { status: 500 });
  }
}
