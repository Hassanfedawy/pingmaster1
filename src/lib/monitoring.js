import { prisma } from './prisma';
import { sendIncidentEmail } from './email';
import https from 'https';
import dns from 'dns';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve);

// Store active monitoring intervals
const activeMonitoringIntervals = new Map();

export class MonitoringService {
  static async startMonitoring() {
    try {
      // Fetch URLs with optional user inclusion
      const urls = await prisma.URL.findMany({
        include: { 
          user: false  // Explicitly set to false to avoid required user relation
        }
      });

      console.log(`Starting monitoring for ${urls.length} URLs`);

      // Stop any existing monitoring to prevent duplicate intervals
      this.stopAllMonitoring();

      for (const url of urls) {
        try {
          // Skip URLs without a check interval
          if (!url.checkInterval || url.checkInterval <= 0) {
            console.warn(`Skipping URL ${url.id} due to invalid check interval`);
            continue;
          }

          // Initial check
          await this.checkUrl({
            ...url,
            timeout: url.timeout || 30,  // Default timeout
          });

          // Set up new interval
          const interval = setInterval(async () => {
            try {
              await this.checkUrl({
                ...url,
                timeout: url.timeout || 30,  // Default timeout
              });
            } catch (intervalError) {
              console.error(`Interval error for URL ${url.url}:`, intervalError);
            }
          }, (url.checkInterval || 5) * 60 * 1000); // Default to 5 minutes if not set

          // Store the interval with metadata
          activeMonitoringIntervals.set(url.id, {
            interval,
            lastCheck: new Date(),
            url: url
          });

        } catch (urlError) {
          console.error(`Failed to setup monitoring for ${url.url}:`, urlError);
          // Continue with next URL even if one fails
        }
      }

      console.log('Monitoring service started successfully');
    } catch (error) {
      console.error('Error starting monitoring service:', error);
      throw error;  // Rethrow to allow caller to handle
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
        // Create notification in database
        const notification = await prisma.notification.create({
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

        // Send email if user has email notifications enabled
        if (urlData.user.emailNotifications && urlData.user.email) {
          await sendIncidentEmail(urlData.user.email, {
            url: urlData.url,
            status,
            error,
            responseTime,
            timestamp: now,
          });
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
}
