import { prisma } from './prisma';

export class MonitoringService {
  static async checkUrl(urlData) {
    const startTime = Date.now();
    let status = 'up';
    let error = null;
    let responseTime = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, urlData.timeout * 1000 || 30000);

      const response = await fetch(urlData.url, {
        method: 'GET',
        signal: controller.signal,
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

    // If status is down, create notifications
    if (status === 'down') {
      const notifications = await prisma.uRLNotification.findMany({
        where: {
          urlId: urlData.id,
          enabled: true,
        },
      });

      for (const notification of notifications) {
        await this.sendNotification(notification, {
          url: urlData.url,
          status,
          error,
          responseTime,
        });
      }
    }

    return {
      status,
      responseTime,
      error,
    };
  }

  static async sendNotification(notification, data) {
    // Implement different notification types
    switch (notification.type) {
      case 'email':
        // Implement email notification
        console.log('Sending email notification:', {
          to: notification.channel,
          data,
        });
        break;

      case 'webhook':
        try {
          await fetch(notification.channel, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
        } catch (error) {
          console.error('Webhook notification failed:', error);
        }
        break;

      default:
        console.log('Unknown notification type:', notification.type);
    }
  }

  static async startMonitoring() {
    console.log('Starting URL monitoring service...');

    // Get all URLs that need to be checked
    const urls = await prisma.url.findMany();

    // Set up monitoring intervals for each URL
    for (const url of urls) {
      this.scheduleUrlCheck(url);
    }
  }

  static scheduleUrlCheck(url) {
    const interval = url.checkInterval * 60 * 1000; // Convert minutes to milliseconds

    setInterval(async () => {
      try {
        await this.checkUrl(url);
      } catch (error) {
        console.error(`Error checking URL ${url.url}:`, error);
      }
    }, interval);
  }
}
