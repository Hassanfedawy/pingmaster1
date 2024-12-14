import { MonitoringService } from './monitoring.js';
import { prisma } from './prisma.js';

async function simulateUrlDowntime() {
    try {
        // Get a test URL
        const testUrl = await prisma.URL.findFirst({
            where: {
                url: 'https://amazonclone-rosy-omega.vercel.app/'
            }
        });

        if (!testUrl) {
            console.log('Test URL not found');
            return;
        }

        // Force an immediate check
        console.log('Testing URL:', testUrl.url);
        const result = await MonitoringService.checkUrl({
            ...testUrl,
            // Simulate timeout by setting a very low timeout
            timeout: 0.1 // 100ms timeout to force failure
        });

        console.log('Check result:', result);

        // Wait for 2 minutes
        await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));

        // Check again with normal timeout
        console.log('Checking again with normal timeout...');
        const secondResult = await MonitoringService.checkUrl(testUrl);
        
        console.log('Second check result:', secondResult);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
simulateUrlDowntime().then(() => {
    console.log('Test completed');
}).catch(console.error);
