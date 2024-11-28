import express from 'express';
import EventEmitter from 'events';

// Mock email queue
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  addToQueue(emailData) {
    this.queue.push(emailData);
    console.log('📨 Email added to queue:', {
      to: emailData.to,
      subject: emailData.subject
    });
    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const email = this.queue.shift();
    console.log('📧 Processing email:', {
      to: email.to,
      subject: email.subject
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.processQueue();
  }
}

// Mock SSE system
class SSEManager extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map();
  }

  addClient(userId, res) {
    this.clients.set(userId, res);
    console.log('👤 SSE client connected:', userId);
  }

  removeClient(userId) {
    this.clients.delete(userId);
    console.log('👤 SSE client disconnected:', userId);
  }

  sendEventToUser(userId, event) {
    const client = this.clients.get(userId);
    if (client) {
      console.log('📡 SSE event sent to user:', userId, event);
      client.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  }
}

// Mock notification storage
class NotificationStorage {
  constructor() {
    this.notifications = new Map();
    this.unreadCounts = new Map();
  }

  async createNotification(data) {
    const notification = {
      id: `notif-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      read: false
    };
    
    if (!this.notifications.has(data.userId)) {
      this.notifications.set(data.userId, []);
    }
    this.notifications.get(data.userId).push(notification);
    
    // Update unread count
    const currentCount = this.unreadCounts.get(data.userId) || 0;
    this.unreadCounts.set(data.userId, currentCount + 1);
    
    return notification;
  }

  async markAsRead(notificationIds, userId) {
    const userNotifications = this.notifications.get(userId) || [];
    let markedCount = 0;
    
    userNotifications.forEach(notif => {
      if (notificationIds.includes(notif.id) && !notif.read) {
        notif.read = true;
        markedCount++;
      }
    });
    
    // Update unread count
    const currentCount = this.unreadCounts.get(userId) || 0;
    this.unreadCounts.set(userId, Math.max(0, currentCount - markedCount));
    
    return markedCount;
  }

  async deleteNotifications(notificationIds, userId) {
    const userNotifications = this.notifications.get(userId) || [];
    const initialLength = userNotifications.length;
    
    const remainingNotifications = userNotifications.filter(notif => !notificationIds.includes(notif.id));
    this.notifications.set(userId, remainingNotifications);
    
    // Update unread count
    const deletedUnread = userNotifications.filter(
      notif => notificationIds.includes(notif.id) && !notif.read
    ).length;
    const currentCount = this.unreadCounts.get(userId) || 0;
    this.unreadCounts.set(userId, Math.max(0, currentCount - deletedUnread));
    
    return initialLength - remainingNotifications.length;
  }

  async getUnreadCount(userId) {
    return this.unreadCounts.get(userId) || 0;
  }
}

// Initialize test components
const emailQueue = new EmailQueue();
const sseManager = new SSEManager();
const notificationStorage = new NotificationStorage();

// Test webhook server
const app = express();
app.use(express.json());
const webhookPort = 3001;

// Webhook endpoint with delivery tracking
let webhookDeliveries = [];
app.post('/webhook', (req, res) => {
  const delivery = {
    id: `del-${Date.now()}`,
    timestamp: new Date(),
    payload: req.body,
    status: 'success'
  };
  webhookDeliveries.push(delivery);
  console.log('🌐 Webhook delivery:', delivery);
  res.status(200).json({ deliveryId: delivery.id });
});

// Test cases
async function runAdvancedTests() {
  console.log('🧪 Starting Advanced Notification Tests...\n');

  const testUserId = 'user-123';
  
  // 1. Test email queue
  console.log('📨 Testing Email Queue:');
  for (let i = 1; i <= 3; i++) {
    emailQueue.addToQueue({
      to: 'test@example.com',
      subject: `Test Email ${i}`,
      text: `This is test email ${i}`
    });
  }
  await new Promise(resolve => setTimeout(resolve, 3500)); // Wait for queue processing
  console.log('✅ Email queue test completed\n');

  // 2. Test SSE connection
  console.log('📡 Testing SSE:');
  const mockResponse = {
    write: (data) => console.log('Mock SSE Response:', data),
    end: () => console.log('SSE connection closed')
  };
  sseManager.addClient(testUserId, mockResponse);
  sseManager.sendEventToUser(testUserId, {
    type: 'notification',
    action: 'created',
    data: { message: 'Test notification' }
  });
  console.log('✅ SSE test completed\n');

  // 3. Test notification lifecycle
  console.log('🔄 Testing Notification Lifecycle:');
  
  // Create notifications
  const notifications = [];
  for (let i = 1; i <= 3; i++) {
    const notif = await notificationStorage.createNotification({
      userId: testUserId,
      title: `Test Notification ${i}`,
      message: `This is test notification ${i}`,
      type: i === 1 ? 'info' : i === 2 ? 'warning' : 'error'
    });
    notifications.push(notif);
    console.log(`Created notification ${i}:`, notif);
  }

  // Check unread count
  let unreadCount = await notificationStorage.getUnreadCount(testUserId);
  console.log('Initial unread count:', unreadCount);

  // Mark some as read
  const readCount = await notificationStorage.markAsRead(
    [notifications[0].id, notifications[1].id],
    testUserId
  );
  console.log('Marked as read:', readCount);
  
  unreadCount = await notificationStorage.getUnreadCount(testUserId);
  console.log('Unread count after marking read:', unreadCount);

  // Delete a notification
  const deleteCount = await notificationStorage.deleteNotifications(
    [notifications[2].id],
    testUserId
  );
  console.log('Deleted notifications:', deleteCount);
  
  unreadCount = await notificationStorage.getUnreadCount(testUserId);
  console.log('Final unread count:', unreadCount);
  
  console.log('✅ Notification lifecycle test completed\n');

  // 4. Test webhook delivery tracking
  console.log('🌐 Testing Webhook Delivery Tracking:');
  const webhookUrl = `http://localhost:${webhookPort}/webhook`;
  
  for (let i = 1; i <= 2; i++) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'notification.created',
          payload: { message: `Test webhook delivery ${i}` }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Webhook delivery ${i} successful:`, result);
      }
    } catch (error) {
      console.error(`Webhook delivery ${i} failed:`, error);
    }
  }

  console.log('Webhook deliveries:', webhookDeliveries);
  console.log('✅ Webhook delivery tracking test completed\n');

  console.log('✅ All advanced tests completed!');
}

// Start server and run tests
const server = app.listen(webhookPort, async () => {
  console.log(`🚀 Test server running on port ${webhookPort}`);
  
  try {
    await runAdvancedTests();
  } catch (error) {
    console.error('Test suite failed:', error);
  } finally {
    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 1000);
  }
});
