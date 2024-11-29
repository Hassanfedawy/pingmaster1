import nodemailer from 'nodemailer';
import { formatDistanceToNow, format } from 'date-fns';

// Create reusable transporter using SMTP
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

function getStatusEmoji(status) {
  switch (status.toLowerCase()) {
    case 'down':
      return '🔴';
    case 'error':
      return '⚠️';
    case 'slow':
      return '🟡';
    default:
      return '🟢';
  }
}

function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'down':
      return '#DC2626'; // red
    case 'error':
      return '#F59E0B'; // amber
    case 'slow':
      return '#FBBF24'; // yellow
    default:
      return '#10B981'; // green
  }
}

export async function sendIncidentEmail(userEmail, incident) {
  const { url, status, error, responseTime, timestamp } = incident;
  
  const emoji = getStatusEmoji(status);
  const statusColor = getStatusColor(status);
  const formattedTime = format(new Date(timestamp), 'PPpp'); // e.g., "Apr 29, 2023, 1:25 PM"
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  
  const subject = `${emoji} Alert: ${url} is ${status.toUpperCase()}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PingMaster Alert</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="margin: 0; color: #111827; font-size: 24px;">PingMaster Incident Alert</h1>
              <p style="color: #6B7280; margin-top: 8px;">Incident detected at ${timeAgo}</p>
            </div>

            <!-- Status Badge -->
            <div style="text-align: center; margin: 20px 0;">
              <span style="background-color: ${statusColor}; color: white; padding: 8px 16px; border-radius: 9999px; font-weight: 500;">
                ${status.toUpperCase()}
              </span>
            </div>

            <!-- URL Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 16px; color: #4B5563;">Monitored URL</h2>
              <a href="${url}" style="color: #2563EB; text-decoration: none; word-break: break-all;">${url}</a>
            </div>

            <!-- Incident Details -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #4B5563;">Incident Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6B7280;">Status</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${status}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280;">Response Time</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${responseTime ? `${responseTime}ms` : 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6B7280;">Timestamp</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${formattedTime}</td>
                </tr>
                ${error ? `
                <tr>
                  <td style="padding: 8px 0; color: #6B7280;">Error</td>
                  <td style="padding: 8px 0; color: #DC2626; text-align: right;">${error}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 24px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" 
                 style="background-color: #2563EB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                View in Dashboard
              </a>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 24px; text-align: center; color: #6B7280; font-size: 14px;">
              <p style="margin: 0;">You received this email because you have notifications enabled for this URL in PingMaster.</p>
              <p style="margin: 8px 0 0 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard/settings" style="color: #2563EB; text-decoration: none;">
                  Manage notification settings
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: userEmail,
      subject,
      html: htmlContent,
    });
    console.log(`Incident notification sent to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send incident email:', error);
  }
}
