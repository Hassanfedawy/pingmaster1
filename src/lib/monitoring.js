import { prisma } from './prisma.js';
import { createNotification } from './notifications.js';
import https from 'https';
import dns from 'dns';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve);

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
    await prisma.url.update({
      where: { id: urlData.id },
      data: {
        status,
        lastChecked: new Date(),
        responseTime,
      },
    });

    // Create history record
    await prisma.uRLHistory.create({
      data: {
        urlId: urlData.id,
        status,
        responseTime,
        error,
      },
    });

    // Handle notifications if status is down or there are SSL issues
    if (status === 'down' || (sslInfo && sslInfo.daysUntilExpiry < 30)) {
      const notifications = await prisma.uRLNotification.findMany({
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

  static async startMonitoring() {
    try {
      // Get all URLs that need to be monitored
      const urls = await prisma.uRL.findMany();
      
      // Set up monitoring intervals for each URL
      for (const url of urls) {
        const interval = url.checkInterval * 60 * 1000; // Convert minutes to milliseconds
        setInterval(async () => {
          try {
            await this.checkUrl(url);
          } catch (error) {
            console.error(`Error monitoring ${url.url}:`, error);
          }
        }, interval);
      }

      console.log(`Started monitoring ${urls.length} URLs`);
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      throw error;
    }
  }
}
