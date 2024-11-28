import https from 'https';
import dns from 'dns';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve);

// Mock MonitoringService for testing without database dependencies
class MonitoringService {
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
}

async function testMonitoring() {
  console.log('🧪 Starting Monitoring Service Tests...\n');

  // Test cases with different scenarios
  const testUrls = [
    {
      id: 'test-1',
      url: 'https://www.google.com',
      timeout: 30,
      description: 'Testing a reliable HTTPS site (Google)'
    },
    {
      id: 'test-2',
      url: 'http://this-is-definitely-not-a-real-website.com',
      timeout: 30,
      description: 'Testing DNS failure'
    },
    {
      id: 'test-3',
      url: 'https://expired.badssl.com',
      timeout: 30,
      description: 'Testing SSL certificate issues'
    },
    {
      id: 'test-4',
      url: 'https://httpstat.us/500',
      timeout: 30,
      description: 'Testing HTTP 500 error'
    },
    {
      id: 'test-5',
      url: 'https://httpstat.us/200?sleep=5000',
      timeout: 3,
      description: 'Testing timeout'
    }
  ];

  for (const testUrl of testUrls) {
    console.log(`\n📝 Test Case: ${testUrl.description}`);
    console.log(`URL: ${testUrl.url}`);
    
    try {
      const result = await MonitoringService.checkUrl(testUrl);
      console.log('Result:', {
        status: result.status,
        responseTime: `${result.responseTime}ms`,
        error: result.error,
        sslInfo: result.sslInfo ? {
          daysUntilExpiry: result.sslInfo.daysUntilExpiry,
          validTo: result.sslInfo.validTo
        } : null
      });
    } catch (error) {
      console.error('Test failed:', error.message);
    }
  }

  console.log('\n✅ Testing completed!');
}

// Run the tests
testMonitoring().catch(console.error);
