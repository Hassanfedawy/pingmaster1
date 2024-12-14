import { prisma } from './prisma.js';
import { sendEmail } from './email.js';

// Store notification batches
const notificationBatches = new Map();
const BATCH_WINDOW = 60 * 1000; // 1 minute batching window

export async function createNotification({ userId, title, message, type = 'info', urlId = null }) {
  try {
    const batchKey = `${userId}_${type}_${urlId}`;
    const now = Date.now();
    
    // Check if there's an existing batch
    const existingBatch = notificationBatches.get(batchKey);
    if (existingBatch && (now - existingBatch.timestamp) < BATCH_WINDOW) {
      // Update existing batch
      existingBatch.count++;
      existingBatch.messages.push(message);
      notificationBatches.set(batchKey, existingBatch);
      
      // Don't create a new notification yet
      return null;
    }

    // Process previous batch if it exists
    if (existingBatch) {
      await processBatch(existingBatch, userId, title, type, urlId);
    }

    // Start new batch
    notificationBatches.set(batchKey, {
      timestamp: now,
      count: 1,
      messages: [message],
      userId,
      title,
      type,
      urlId
    });

    // Create the initial notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        urlId,
        read: false
      }
    });

    // Trigger real-time notification via Server-Sent Events
    await triggerSSENotification(notification);

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

async function processBatch(batch, userId, baseTitle, type, urlId) {
  if (batch.count <= 1) return;

  // Create a summary notification
  const summaryMessage = `${batch.count} similar notifications in the last minute. Latest: ${batch.messages[batch.messages.length - 1]}`;
  
  await prisma.notification.create({
    data: {
      userId,
      title: `${baseTitle} (Summary)`,
      message: summaryMessage,
      type,
      urlId,
      read: false
    }
  });
}

export async function markNotificationAsRead(notificationId) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  });
}

export async function markAllNotificationsAsRead(userId) {
  return prisma.notification.updateMany({
    where: { userId },
    data: { read: true }
  });
}

export async function deleteNotification(notificationId) {
  return prisma.notification.delete({
    where: { id: notificationId }
  });
}

export async function getNotifications(userId, { page = 1, limit = 10, unreadOnly = false }) {
  const skip = (page - 1) * limit;
  
  const where = {
    userId,
    ...(unreadOnly ? { read: false } : {})
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        url: {
          select: {
            url: true
          }
        }
      }
    }),
    prisma.notification.count({ where })
  ]);

  return {
    notifications,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      perPage: limit
    }
  };
}

async function triggerSSENotification(notification) {
  // Implementation for Server-Sent Events
  // This would connect to your SSE implementation
  try {
    // Your SSE implementation here
    // For example, emit an event to connected clients
    // global.sse.emit('notification', { userId: notification.userId, notification });
  } catch (error) {
    console.error('Error triggering SSE notification:', error);
  }
}
