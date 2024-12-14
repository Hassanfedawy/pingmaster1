import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subHours } from 'date-fns';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const urlId = params.id;
    const startTime = subHours(new Date(), 24); // Get last 24 hours of data

    // Get the URL and verify ownership
    const url = await prisma.URL.findUnique({
      where: { id: urlId },
      select: { userId: true }
    });

    if (!url || url.userId !== session.user.id) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    // Get URL history for the last 24 hours
    const history = await prisma.URLHistory.findMany({
      where: {
        urlId,
        timestamp: {
          gte: startTime
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Calculate statistics
    let totalChecks = history.length;
    let upChecks = history.filter(check => check.status === 'up').length;
    let totalResponseTime = history.reduce((sum, check) => sum + (check.responseTime || 0), 0);
    let incidents = history.filter(check => check.status === 'down').length;

    // Calculate uptime percentage
    const uptime = totalChecks > 0 ? ((upChecks / totalChecks) * 100).toFixed(2) + '%' : '0%';
    
    // Calculate average response time
    const avgResponseTime = totalChecks > 0 ? Math.round(totalResponseTime / totalChecks) + 'ms' : '0ms';

    // Calculate total downtime in minutes
    const downChecks = history.filter(check => check.status === 'down');
    const downtime = Math.round(downChecks.length * 5) + 'm'; // Assuming 5-minute check intervals

    return NextResponse.json({
      uptime,
      responseTime: avgResponseTime,
      incidents,
      downtime,
      history: history.map(h => ({
        timestamp: h.timestamp,
        status: h.status,
        responseTime: h.responseTime,
        error: h.error
      }))
    });
  } catch (error) {
    console.error('Error fetching URL stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch URL stats' },
      { status: 500 }
    );
  }
}
