import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function createWebhook({
  userId,
  name,
  url,
  secret = null,
  events = ['*'],
}) {
  return prisma.webhookConfig.create({
    data: {
      userId,
      name,
      url,
      secret,
      events,
    },
  });
}

export async function deleteWebhook(id, userId) {
  return prisma.webhookConfig.deleteMany({
    where: {
      id,
      userId,
    },
  });
}

export async function updateWebhook(id, userId, data) {
  return prisma.webhookConfig.updateMany({
    where: {
      id,
      userId,
    },
    data,
  });
}

export async function getWebhooks(userId) {
  return prisma.webhookConfig.findMany({
    where: {
      userId,
      active: true,
    },
    include: {
      deliveries: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
    },
  });
}

export function generateWebhookSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

export async function createWebhookDelivery({
  webhookId,
  eventType,
  payload,
}) {
  return prisma.webhookDelivery.create({
    data: {
      webhookId,
      eventType,
      payload,
      status: 'pending',
    },
  });
}

export async function updateWebhookDelivery(id, data) {
  return prisma.webhookDelivery.update({
    where: { id },
    data,
  });
}

export async function processWebhookDelivery(delivery) {
  const webhook = await prisma.webhookConfig.findUnique({
    where: { id: delivery.webhookId },
  });

  if (!webhook || !webhook.active) {
    return;
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-PingMaster-Event': delivery.eventType,
      'X-PingMaster-Delivery': delivery.id,
      'X-PingMaster-Timestamp': new Date().toISOString(),
    };

    if (webhook.secret) {
      headers['X-PingMaster-Signature'] = generateWebhookSignature(
        delivery.payload,
        webhook.secret
      );
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(delivery.payload),
    });

    const responseBody = await response.text();

    await updateWebhookDelivery(delivery.id, {
      responseStatus: response.status,
      responseBody,
      status: response.ok ? 'success' : 'failed',
      attempts: delivery.attempts + 1,
      ...(response.ok
        ? {}
        : {
            error: `HTTP ${response.status}: ${responseBody}`,
            nextRetry: calculateNextRetry(delivery.attempts + 1),
          }),
    });
  } catch (error) {
    await updateWebhookDelivery(delivery.id, {
      error: error.message,
      status: 'failed',
      attempts: delivery.attempts + 1,
      nextRetry: calculateNextRetry(delivery.attempts + 1),
    });
  }
}

function calculateNextRetry(attempts) {
  // Exponential backoff with jitter
  const baseDelay = 5000; // 5 seconds
  const maxDelay = 3600000; // 1 hour
  const jitter = Math.random() * 1000;
  const delay = Math.min(
    baseDelay * Math.pow(2, attempts - 1) + jitter,
    maxDelay
  );
  return new Date(Date.now() + delay);
}

export async function retryFailedDeliveries() {
  const failedDeliveries = await prisma.webhookDelivery.findMany({
    where: {
      status: 'failed',
      nextRetry: {
        lte: new Date(),
      },
      attempts: {
        lt: 5, // Max 5 attempts
      },
    },
  });

  for (const delivery of failedDeliveries) {
    await processWebhookDelivery(delivery);
  }
}

// Start retry process
if (typeof window === 'undefined') {
  setInterval(retryFailedDeliveries, 60000); // Check every minute
}
