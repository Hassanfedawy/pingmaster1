import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subHours, subDays } from 'date-fns';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';

    // Calculate start date based on time range
    let startDate;
    switch (timeRange) {
      case '7d':
        startDate = subDays(new Date(), 7);
        break;
      case '30d':
        startDate = subDays(new Date(), 30);
        break;
      case '90d':
        startDate = subDays(new Date(), 90);
        break;
      default: // 24h
        startDate = subHours(new Date(), 24);
    }

    // Fetch URLs and their histories
    const urls = await prisma.uRL.findMany({
      where: { userId: session.user.id },
      include: {
        urlHistories: {
          where: {
            timestamp: { gte: startDate }
          },
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });

    // Process incidents with validation
    const recentIncidents = [];
    let totalResponseTime = 0;
    let totalChecks = 0;
    let upChecks = 0;
    const statusCounts = {
      down: 0,
      error: 0,
      up: 0,
      pending: 0
    };

    urls.forEach(url => {
      if (!url.urlHistories) return;
      
      url.urlHistories.forEach(history => {
        if (history.status === 'down' || history.status === 'error') {
          recentIncidents.push({
            id: history.id,
            url: url.url,
            status: history.status,
            error: history.error || 'Unknown error',
            timestamp: history.timestamp
          });
        }
        
        // Update counts only for valid status
        if (statusCounts.hasOwnProperty(history.status)) {
          statusCounts[history.status]++;
        }
        
        if (history.responseTime) {
          totalResponseTime += history.responseTime;
          totalChecks++;
        }
        
        if (history.status === 'up') upChecks++;
      });
    });

    // Sort incidents by timestamp
    recentIncidents.sort((a, b) => b.timestamp - a.timestamp);

    // Calculate averages and percentages
    const avgResponseTime = totalChecks > 0 ? totalResponseTime / totalChecks : 0;
    const uptimePercentage = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 0;

    // Prepare chart data
    const responseTimeData = {
      labels: urls.map(url => url.name || url.url),
      datasets: [{
        label: 'Average Response Time (ms)',
        data: urls.map(url => {
          const urlAvg = url.urlHistories.reduce((acc, history) => {
            return history.responseTime ? acc + history.responseTime : acc;
          }, 0) / url.urlHistories.length;
          return Math.round(urlAvg || 0);
        }),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      }]
    };

    const uptimeData = {
      labels: urls.map(url => url.name || url.url),
      datasets: [{
        label: 'Uptime Percentage',
        data: urls.map(url => {
          const upCount = url.urlHistories.filter(h => h.status === 'up').length;
          return Math.round((upCount / url.urlHistories.length) * 100) || 0;
        }),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      }]
    };

    const incidentDistribution = {
      labels: ['Down', 'Error', 'Up', 'Pending'],
      datasets: [{
        data: [
          statusCounts.down || 0,
          statusCounts.error || 0,
          statusCounts.up || 0,
          statusCounts.pending || 0
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(59, 130, 246, 0.5)',
          'rgba(107, 114, 128, 0.5)',
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
          'rgb(59, 130, 246)',
          'rgb(107, 114, 128)',
        ],
      }]
    };

    return NextResponse.json({
      responseTimeData,
      uptimeData,
      incidentDistribution,
      incidents: recentIncidents.slice(0, 10), // Only return 10 most recent incidents
      stats: {
        avgResponseTime: Math.round(avgResponseTime),
        uptimePercentage: Math.round(uptimePercentage * 100) / 100,
        totalIncidents: recentIncidents.length
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}