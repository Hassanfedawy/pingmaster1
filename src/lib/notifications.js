import { prisma } from './prisma';
import nodemailer from 'nodemailer';
import emailQueue from './emailQueue';

// Create reusable transporter using Gmail SMTP
export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Email templates
const emailTemplates = {
  success: (data) => ({
    subject: `✅ ${data.title}`,
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background-color: #28a745; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: white; margin: 0;">${data.title}</h2>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">${data.message}</p>
          ${data.urlName ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 8px;">
              <p style="margin: 0; color: #4b5563;"><strong>URL Name:</strong> ${data.urlName}</p>
              <p style="margin: 5px 0 0; color: #4b5563;"><strong>Address:</strong> ${data.urlAddress}</p>
            </div>
          ` : ''}
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message from PingMaster. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),
  error: (data) => ({
    subject: `🚨 ${data.title}`,
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background-color: #dc3545; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: white; margin: 0;">${data.title}</h2>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">${data.message}</p>
          ${data.urlName ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #f8d7da; border-radius: 8px;">
              <p style="margin: 0; color: #721c24;"><strong>URL Name:</strong> ${data.urlName}</p>
              <p style="margin: 5px 0 0; color: #721c24;"><strong>Address:</strong> ${data.urlAddress}</p>
            </div>
          ` : ''}
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message from PingMaster. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),
  warning: (data) => ({
    subject: `⚠️ ${data.title}`,
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background-color: #ffc107; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">${data.title}</h2>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">${data.message}</p>
          ${data.urlName ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 8px;">
              <p style="margin: 0; color: #856404;"><strong>URL Name:</strong> ${data.urlName}</p>
              <p style="margin: 5px 0 0; color: #856404;"><strong>Address:</strong> ${data.urlAddress}</p>
            </div>
          ` : ''}
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message from PingMaster. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),
  info: (data) => ({
    subject: `ℹ️ ${data.title}`,
    template: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background-color: #17a2b8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: white; margin: 0;">${data.title}</h2>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">${data.message}</p>
          ${data.urlName ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #d1ecf1; border-radius: 8px;">
              <p style="margin: 0; color: #0c5460;"><strong>URL Name:</strong> ${data.urlName}</p>
              <p style="margin: 5px 0 0; color: #0c5460;"><strong>Address:</strong> ${data.urlAddress}</p>
            </div>
          ` : ''}
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated message from PingMaster. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  })
};

export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  urlId = null,
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        urlId,
      },
      include: {
        user: true,
        url: true,
      },
    });

    // Send real-time notification
    const { sendEventToUser } = await import('@/app/api/notifications/sse/route');
    sendEventToUser(userId, {
      type: 'notification',
      action: 'created',
      data: notification,
    });

    // Trigger webhooks
    const webhooks = await prisma.webhookConfig.findMany({
      where: {
        userId,
        active: true,
        events: {
          hasSome: ['*', 'notification.created'],
        },
      },
    });

    for (const webhook of webhooks) {
      const { createWebhookDelivery, processWebhookDelivery } = await import(
        '@/lib/webhooks'
      );
      const delivery = await createWebhookDelivery({
        webhookId: webhook.id,
        eventType: 'notification.created',
        payload: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          url: notification.url?.url,
          createdAt: notification.createdAt,
        },
      });
      processWebhookDelivery(delivery);
    }

    // If it's an important notification (error/warning) and user has email notifications enabled
    if (['error', 'warning'].includes(type)) {
      const urlNotification = urlId
        ? await prisma.uRLNotification.findFirst({
            where: {
              urlId,
              type: 'email',
              enabled: true,
            },
          })
        : null;

      if (urlNotification) {
        await sendEmailNotification({
          to: notification.user.email,
          subject: title,
          text: message,
          type,
          urlName: notification.url?.name || 'Unknown URL',
          urlAddress: notification.url?.url || '',
        });
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function sendEmailNotification({
  to,
  subject,
  text,
  type = 'info',
  urlName,
  urlAddress,
}) {
  const template = emailTemplates[type]({
    title: subject,
    message: text,
    urlName,
    urlAddress,
  });

  const emailData = {
    from: process.env.EMAIL_FROM || '"PingMaster" <noreply@pingmaster.com>',
    to,
    subject: template.subject,
    text,
    html: template.template,
  };

  // Add to queue instead of sending directly
  emailQueue.addToQueue(emailData);
}

export async function markNotificationsAsRead(notificationIds, userId) {
  try {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: {
        read: true,
      },
    });

    // Send real-time update
    const { sendEventToUser } = await import('@/app/api/notifications/sse/route');
    sendEventToUser(userId, {
      type: 'notification',
      action: 'updated',
      data: { ids: notificationIds, read: true },
    });

    // Trigger webhooks
    const webhooks = await prisma.webhookConfig.findMany({
      where: {
        userId,
        active: true,
        events: {
          hasSome: ['*', 'notification.updated'],
        },
      },
    });

    for (const webhook of webhooks) {
      const { createWebhookDelivery, processWebhookDelivery } = await import(
        '@/lib/webhooks'
      );
      const delivery = await createWebhookDelivery({
        webhookId: webhook.id,
        eventType: 'notification.updated',
        payload: {
          ids: notificationIds,
          read: true,
          updatedAt: new Date(),
        },
      });
      processWebhookDelivery(delivery);
    }
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
}

export async function deleteNotifications(notificationIds, userId) {
  try {
    await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
    });

    // Send real-time update
    const { sendEventToUser } = await import('@/app/api/notifications/sse/route');
    sendEventToUser(userId, {
      type: 'notification',
      action: 'deleted',
      data: { ids: notificationIds },
    });

    // Trigger webhooks
    const webhooks = await prisma.webhookConfig.findMany({
      where: {
        userId,
        active: true,
        events: {
          hasSome: ['*', 'notification.deleted'],
        },
      },
    });

    for (const webhook of webhooks) {
      const { createWebhookDelivery, processWebhookDelivery } = await import(
        '@/lib/webhooks'
      );
      const delivery = await createWebhookDelivery({
        webhookId: webhook.id,
        eventType: 'notification.deleted',
        payload: {
          ids: notificationIds,
          deletedAt: new Date(),
        },
      });
      processWebhookDelivery(delivery);
    }
  } catch (error) {
    console.error('Error deleting notifications:', error);
    throw error;
  }
}

export async function getUnreadNotificationCount(userId) {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
}
