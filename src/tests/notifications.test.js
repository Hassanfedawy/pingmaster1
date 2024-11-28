import https from 'https';
import dns from 'dns';
import { promisify } from 'util';
import express from 'express';
import nodemailer from 'nodemailer';

const dnsResolve = promisify(dns.resolve);

// Mock email transporter
const mockTransporter = {
  sendMail: async (mailOptions) => {
    console.log('📧 Email would be sent:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      template: mailOptions.html ? 'HTML Template' : mailOptions.text
    });
    return { messageId: 'mock-email-id' };
  }
};

// Mock notification service
class NotificationService {
  static async createNotification(data) {
    console.log('📝 Notification created:', data);
    return {
      id: 'mock-notification-id',
      ...data,
      createdAt: new Date(),
      read: false
    };
  }

  static async sendEmailNotification(data) {
    const { to, subject, text, type, urlName, urlAddress } = data;
    
    // Get email template based on type
    const template = emailTemplates[type]({
      title: subject,
      message: text,
      urlName,
      urlAddress
    });

    // Send email using mock transporter
    const result = await mockTransporter.sendMail({
      from: '"PingMaster" <test@pingmaster.com>',
      to,
      subject: template.subject,
      html: template.template
    });

    return result;
  }
}

// Email templates (simplified version)
const emailTemplates = {
  success: (data) => ({
    subject: `✅ ${data.title}`,
    template: `Success: ${data.message}`
  }),
  error: (data) => ({
    subject: `🚨 ${data.title}`,
    template: `Error: ${data.message}`
  }),
  warning: (data) => ({
    subject: `⚠️ ${data.title}`,
    template: `Warning: ${data.message}`
  }),
  info: (data) => ({
    subject: `ℹ️ ${data.title}`,
    template: `Info: ${data.message}`
  })
};

// Mock webhook server
const webhookServer = express();
const webhookPort = 3001;

webhookServer.post('/webhook', (req, res) => {
  console.log('�webhook Received webhook:', req.body);
  res.status(200).json({ received: true });
});

// Test cases
async function testNotifications() {
  console.log('🧪 Starting Notification System Tests...\n');

  // 1. Test email notifications
  console.log('📧 Testing Email Notifications:');
  try {
    await NotificationService.sendEmailNotification({
      to: 'test@example.com',
      subject: 'Test Alert',
      text: 'Your website is down!',
      type: 'error',
      urlName: 'Test Website',
      urlAddress: 'https://test.com'
    });
    console.log('✅ Email notification test passed\n');
  } catch (error) {
    console.error('❌ Email notification test failed:', error);
  }

  // 2. Test different notification types
  console.log('🎨 Testing Different Notification Types:');
  const types = ['success', 'error', 'warning', 'info'];
  
  for (const type of types) {
    try {
      const notification = await NotificationService.createNotification({
        userId: 'test-user',
        title: `Test ${type} notification`,
        message: `This is a test ${type} notification`,
        type,
        urlId: 'test-url'
      });
      console.log(`✅ ${type} notification created:`, notification);
    } catch (error) {
      console.error(`❌ ${type} notification creation failed:`, error);
    }
  }

  // 3. Test webhook notifications
  console.log('\n🌐 Testing Webhook Notifications:');
  try {
    const webhookUrl = `http://localhost:${webhookPort}/webhook`;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'error',
        title: 'Website Down',
        message: 'Your website is not responding',
        url: 'https://test.com'
      })
    });

    if (response.ok) {
      console.log('✅ Webhook notification test passed');
    } else {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Webhook notification test failed:', error);
  }

  console.log('\n✅ Notification Testing completed!');
}

// Start webhook server and run tests
const server = webhookServer.listen(webhookPort, async () => {
  console.log(`🚀 Mock webhook server running on port ${webhookPort}`);
  
  try {
    await testNotifications();
  } catch (error) {
    console.error('Test suite failed:', error);
  } finally {
    server.close();
  }
});
