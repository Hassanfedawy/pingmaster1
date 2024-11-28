import { prisma } from './prisma.js';
import { createNotification } from './notifications.js';
import https from 'https';
import dns from 'dns';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve);

// Store active monitoring intervals
const activeMonitoringIntervals = new Map();

export class MonitoringService {
  static async checkUrl(urlData) {
    const startTime = Date.now();
    let status = 'up';
    let error = null;
    let responseTime = null;
    let sslInfo = null;

    try {
      // First, check DNS
      const url = new URL(urlData.url);
      try {
        await dnsResolve(url.hostname);
      } catch (err) {
        throw new Error(`DNS resolution failed: ${err.message}`);
      }

      // Check SSL for HTTPS URLs
      if (url.protocol === 'https:') {
        try {
          sslInfo = await this.checkSSL(url.hostname);
        } catch (err) {
          console.warn(`SSL check warning for ${url.hostname}:`, err.message);
        }
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

    // Update URL status
    await prisma.URL.update({
      where: { id: urlData.id },
      data: {
        status,
        lastChecked: new Date(),
        responseTime,
      },
    });

    // Create history record
    await prisma.URLHistory.create({
      data: {
        urlId: urlData.id,
        status,
        responseTime,
        error,
      },
    });

    // Handle notifications if status is down or there are SSL issues
    if (status === 'down' || (sslInfo && sslInfo.daysUntilExpiry < 30)) {
      const notifications = await prisma.URLNotification.findMany({
        where: {
          urlId: urlData.id,
          enabled: true,
        },
        include: {
          url: {
            select: {
              user: {
                select: {
                  email: true,
                  id: true
                }
              }
            }
          }
        }
      });

      for (const notification of notifications) {
        // Create notification in the database
        await createNotification({
          userId: notification.url.user.id,
          title: status === 'down' ? 'Website Down Alert' : 'SSL Certificate Warning',
          message: status === 'down' 
            ? `${urlData.url} is currently down. Error: ${error}`
            : `SSL certificate for ${urlData.url} will expire in ${sslInfo.daysUntilExpiry} days`,
          type: status === 'down' ? 'error' : 'warning',
          urlId: urlData.id
        });

        // Send notification based on type
        await this.sendNotification(notification, {
          url: urlData.url,
          status,
          error,
          responseTime,
          sslInfo
        });
      }
    }

    return {
      status,
      responseTime,
      error,
      sslInfo
    };
  }

  static async startMonitoring() {
    try {
      // Clear any existing intervals
      for (const interval of activeMonitoringIntervals.values()) {
        clearInterval(interval);
      }
      activeMonitoringIntervals.clear();

      // Get all URLs that need to be monitored
      const urls = await prisma.URL.findMany();
      
      if (!urls || urls.length === 0) {
        console.log('No URLs to monitor');
        return;
      }

      // Set up monitoring intervals for each URL
      for (const url of urls) {
        if (activeMonitoringIntervals.has(url.id)) {
          continue;
        }

        // Perform initial check
        await this.checkUrl(url);

        // Set up interval
        const interval = setInterval(async () => {
          try {
            await this.checkUrl(url);
          } catch (error) {
            console.error(`Error monitoring URL ${url.id}:`, error);
          }
        }, url.monitoringInterval * 1000 || 300000); // Default to 5 minutes

        activeMonitoringIntervals.set(url.id, interval);
      }

      console.log(`Started monitoring ${urls.length} URLs`);
    } catch (error) {
      console.error('Error starting monitoring:', error);
      throw error;
    }
  }

  static async setupUrlMonitoring(url) {
    try {
      // Clear existing interval if any
      if (activeMonitoringIntervals.has(url.id)) {
        clearInterval(activeMonitoringIntervals.get(url.id));
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

      // Store the interval
      activeMonitoringIntervals.set(url.id, interval);

    } catch (error) {
      console.error(`Failed to setup monitoring for ${url.url}:`, error);
      throw error;
    }
  }

  static async checkSSL(hostname) {
    return new Promise((resolve, reject) => {
      const options = {
        host: hostname,
        port: 443,
        method: 'HEAD',
      };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        if (cert && cert.valid_to) {
          const expiryDate = new Date(cert.valid_to);
          const now = new Date();
          const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          resolve({
            issuer: cert.issuer,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            daysUntilExpiry
          });
        } else {
          reject(new Error('No SSL certificate found'));
        }
      });

      req.on('error', reject);
      req.end();
    });
  }

  static async sendNotification(notification, data) {
    switch (notification.type) {
      case 'email':
        // Email notifications are handled by the notifications service
        break;

      case 'webhook':
        try {
          const retryCount = 3;
          for (let i = 0; i < retryCount; i++) {
            try {
              const response = await fetch(notification.channel, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              });
              
              if (response.ok) break;
              
              if (i === retryCount - 1) {
                throw new Error(`Failed to send webhook after ${retryCount} attempts`);
              }
              
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            } catch (error) {
              if (i === retryCount - 1) throw error;
            }
          }
        } catch (error) {
          console.error('Webhook notification failed:', error);
        }
        break;

      default:
        console.warn(`Unsupported notification type: ${notification.type}`);
    }
  }
}
