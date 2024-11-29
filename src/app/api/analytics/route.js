import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { subHours, subDays, subWeeks, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';

    // Calculate the start date based on time range
    const getStartDate = () => {
      const now = new Date();
      switch (timeRange) {
        case '24h': return subHours(now, 24);
        case '7d': return subDays(now, 7);
        case '30d': return subDays(now, 30);
        case '90d': return subMonths(now, 3);
        default: return subHours(now, 24);
      }
    };

    const startDate = getStartDate();

    // Get all URLs for the user with their history
    const urls = await prisma.uRL.findMany({
      where: { userId: session.user.id },
      include: {
        history: {
          where: {
            timestamp: { gte: startDate }
          },
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });

    // Process response time data
    const responseTimeData = {
      labels: [],
      datasets: [{
        label: 'Average Response Time (ms)',
        data: [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      }]
    };

    // Process uptime data
    const uptimeData = {
      labels: [],
      datasets: [{
        label: 'Uptime Percentage',
        data: [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      }]
    };

    // Calculate incident distribution
    let incidents = {
      'HTTP Error': 0,
      'Timeout': 0,
      'DNS Error': 0,
      'Other': 0
    };

    // Process the data
    urls.forEach(url => {
      if (url.history.length > 0) {
        // Group history by hour/day based on time range
        const groupedHistory = groupHistoryByTimeRange(url.history, timeRange);
        
        groupedHistory.forEach((group, index) => {
          if (index >= responseTimeData.labels.length) {
            responseTimeData.labels.push(group.label);
            responseTimeData.datasets[0].data.push(group.avgResponseTime);
            
            const uptimePercentage = (group.upCount / group.totalChecks) * 100;
            uptimeData.labels.push(group.label);
            uptimeData.datasets[0].data.push(uptimePercentage);
          } else {
            responseTimeData.datasets[0].data[index] = 
              (responseTimeData.datasets[0].data[index] + group.avgResponseTime) / 2;
            
            const uptimePercentage = (group.upCount / group.totalChecks) * 100;
            uptimeData.datasets[0].data[index] = 
              (uptimeData.datasets[0].data[index] + uptimePercentage) / 2;
          }
        });

        // Process incidents
        url.history.forEach(record => {
          if (record.status === 'down' && record.error) {
            if (record.error.includes('timeout')) {
              incidents['Timeout']++;
            } else if (record.error.includes('DNS')) {
              incidents['DNS Error']++;
            } else if (record.error.includes('HTTP')) {
              incidents['HTTP Error']++;
            } else {
              incidents['Other']++;
            }
          }
        });
      }
    });

    const incidentDistribution = {
      labels: Object.keys(incidents),
      datasets: [{
        data: Object.values(incidents),
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

    // Collect recent incidents
    const recentIncidents = [];
    urls.forEach(url => {
      if (url.history.length > 0) {
        url.history.forEach(record => {
          if (record.status === 'down' || record.status === 'error') {
            recentIncidents.push({
              id: record.id,
              url: url.url,
              status: record.status,
              error: record.error,
              timestamp: record.timestamp
            });
          }
        });
      }
    });

    // Sort incidents by timestamp, most recent first
    recentIncidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json({
      responseTimeData,
      uptimeData,
      incidentDistribution,
      incidents: recentIncidents.slice(0, 10) // Return only the 10 most recent incidents
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

function groupHistoryByTimeRange(history, timeRange) {
  const groups = new Map();
  
  history.forEach(record => {
    let key;
    switch (timeRange) {
      case '24h':
        key = record.timestamp.getHours();
        break;
      case '7d':
      case '30d':
        key = record.timestamp.toISOString().split('T')[0];
        break;
      case '90d':
        key = `${record.timestamp.getFullYear()}-${record.timestamp.getMonth() + 1}`;
        break;
    }

    if (!groups.has(key)) {
      groups.set(key, {
        label: key.toString(),
        totalResponseTime: 0,
        upCount: 0,
        totalChecks: 0,
      });
    }

    const group = groups.get(key);
    group.totalResponseTime += record.responseTime || 0;
    group.upCount += record.status === 'up' ? 1 : 0;
    group.totalChecks++;
  });

  return Array.from(groups.values()).map(group => ({
    ...group,
    avgResponseTime: group.totalResponseTime / group.totalChecks
  }));
}