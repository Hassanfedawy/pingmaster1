import { prisma } from './prisma';
import { sendIncidentEmail } from './email';
import https from 'https';
import dns from 'dns';
import { promisify } from 'util';
import { emailThrottler } from './emailThrottling';

const dnsResolve = promisify(dns.resolve);

// Store active monitoring intervals
const activeMonitoringIntervals = new Map();

export class MonitoringService {
  static async startMonitoring() {
    try {
      const urls = await prisma.URL.findMany({
        include: { 
          user: {
            select: {
              id: true,
              email: true,
              emailNotifications: true
            }
          }
        }
      });

      if (!urls.length) {
        console.log('No URLs to monitor');
        return;
      }

      console.log(`Starting monitoring for ${urls.length} URLs`);
      this.stopAllMonitoring();

      for (const url of urls) {
        if (!url.user) {
          console.warn(`Skipping URL ${url.id}: No associated user`);
          continue;
        }

        try {
          await this.setupUrlMonitoring(url);
        } catch (error) {
          console.error(`Failed to setup monitoring for ${url.url}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  }

  static async setupUrlMonitoring(url) {
    try {
      // Clear existing interval if any
      if (activeMonitoringIntervals.has(url.id)) {
        this.cleanupUrlMonitoring(url.id);
      }

      // Perform immediate check
      await this.checkUrl(url);

      // Set up new interval
      const interval = setInterval(async () => {
        try {
          await this.checkUrl(url);
        } catch (error) {
          console.error(`Error monitoring ${url.url}:`, error);
        }
      }, url.checkInterval * 60 * 1000); // Convert minutes to milliseconds

      // Store the interval with metadata
      activeMonitoringIntervals.set(url.id, {
        interval,
        lastCheck: new Date(),
        url: url
      });

    } catch (error) {
      console.error(`Failed to setup monitoring for ${url.url}:`, error);
      throw error;
    }
  }

  static cleanupUrlMonitoring(urlId) {
    const intervalData = activeMonitoringIntervals.get(urlId);
    if (intervalData) {
      clearInterval(intervalData.interval);
      activeMonitoringIntervals.delete(urlId);
      console.log(`Cleaned up monitoring for URL ${urlId}`);
    }
  }

  static stopAllMonitoring() {
    for (const [urlId, intervalData] of activeMonitoringIntervals.entries()) {
      clearInterval(intervalData.interval);
    }
    activeMonitoringIntervals.clear();
    console.log('Stopped all monitoring intervals');
  }

  static async checkUrl(urlData) {
    const startTime = Date.now();
    let status = 'up';
    let error = null;
    let responseTime = null;

    try {
      // First, check DNS
      const url = new URL(urlData.url);
      try {
        await dnsResolve(url.hostname);
      } catch (err) {
        throw new Error(`DNS resolution failed: ${err.message}`);
      }

      // Perform the actual health check
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, urlData.timeout * 1000 || 30000);

      const response = await fetch(urlData.url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'PingMaster-Monitor/1.0'
        }
      });

      clearTimeout(timeout);

      responseTime = Date.now() - startTime;

      if (!response.ok) {
        status = 'down';
        error = `HTTP error! status: ${response.status}`;
      }
    } catch (err) {
      status = 'down';
      error = err.message;
      responseTime = Date.now() - startTime;
    }

    const now = new Date();

    // Update URL status in database
    await prisma.URL.update({
      where: { id: urlData.id },
      data: {
        status,
        lastChecked: now,
        responseTime,
        updatedAt: now
      },
    });

    // Create history record
    await prisma.URLHistory.create({
      data: {
        urlId: urlData.id,
        status,
        responseTime,
        error,
        timestamp: now
      },
    });

    // Handle notifications if site is down
    if (status === 'down') {
      try {
        if (!urlData.user?.id) {
          console.warn(`No user data for URL ${urlData.id}`);
          return;
        }
        
        // Create notification with retry
        let retries = 3;
        while (retries > 0) {
          try {
            await prisma.notification.create({
              data: {
                userId: urlData.user.id,
                title: 'Website Down Alert',
                message: `${urlData.url} is currently down. Error: ${error}`,
                type: 'error',
                urlId: urlData.id,
                createdAt: now,
                updatedAt: now,
                read: false
              }
            });
            break;
          } catch (err) {
            retries--;
            if (retries === 0) throw err;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Send email if user has email notifications enabled
        if (urlData.user.emailNotifications && urlData.user.email) {
          await this.sendNotification(urlData, status, error);
        }
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
    }

    return {
      status,
      responseTime,
      error,
      lastChecked: now
    };
  }

  static async sendNotification(urlData, status, error) {
    if (!urlData.user?.id || !urlData.user?.email) {
      console.warn(`Skipping notification for URL ${urlData.id}: No user data`);
      return;
    }

    if (!emailThrottler.canSendEmail(urlData.id, status)) {
      console.log(`Email throttled for URL ${urlData.url}`);
      return;
    }

    try {
      await sendIncidentEmail(urlData.user.email, {
        url: urlData.url,
        status,
        error,
        responseTime: urlData.responseTime,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to send notification email:', error);
    }
  }
}
