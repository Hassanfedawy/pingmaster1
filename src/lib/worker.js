import cron from 'node-cron';
import { prisma } from './prisma';
import { MonitoringService } from './monitoring';

let monitoringJob = null;

export const startMonitoringWorker = () => {
  if (monitoringJob) {
    console.log('Monitoring worker is already running');
    return;
  }

  // Run every minute
  monitoringJob = cron.schedule('* * * * *', async () => {
    try {
      console.log('Running URL checks...');
      
      // Get all URLs that need checking
      const urls = await prisma.url.findMany({
        where: {
          OR: [
            { lastChecked: null },
            {
              lastChecked: {
                lte: new Date(Date.now() - 60000) // Checked more than 1 minute ago
              }
            }
          ]
        }
      });

      console.log(`Found ${urls.length} URLs to check`);

      // Process URLs in parallel with a limit
      const batchSize = 5; // Process 5 URLs at a time
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (url) => {
            try {
              await MonitoringService.checkUrl(url);
            } catch (error) {
              console.error(`Error checking URL ${url.id}:`, error);
            }
          })
        );
      }
    } catch (error) {
      console.error('Error in monitoring worker:', error);
    }
  });

  console.log('Monitoring worker started');
  return monitoringJob;
};

export const stopMonitoringWorker = () => {
  if (monitoringJob) {
    monitoringJob.stop();
    monitoringJob = null;
    console.log('Monitoring worker stopped');
  }
};
