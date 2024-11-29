import { prisma } from './prisma';
import { transporter } from './email';

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
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

export async function markNotificationsAsRead(notificationIds, userId) {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: userId,
      },
      data: {
        read: true,
      },
    });

    return result;
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    throw error;
  }
}

export async function deleteNotifications(notificationIds, userId) {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId: userId,
      },
    });

    return result;
  } catch (error) {
    console.error('Failed to delete notifications:', error);
    throw error;
  }
}

export async function getUnreadNotificationCount(userId) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Failed to get unread notification count:', error);
    throw error;
  }
}
