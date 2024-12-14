const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDates() {
  const currentDate = new Date();

  try {
    // Fix User records
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { createdAt: { equals: undefined } },
          { updatedAt: { equals: undefined } }
        ]
      }
    });

    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          createdAt: user.createdAt || currentDate,
          updatedAt: user.updatedAt || currentDate
        }
      });
    }

    // Fix URL records
    const urls = await prisma.uRL.findMany({
      where: {
        OR: [
          { createdAt: { equals: undefined } },
          { updatedAt: { equals: undefined } }
        ]
      }
    });

    for (const url of urls) {
      await prisma.uRL.update({
        where: { id: url.id },
        data: {
          createdAt: url.createdAt || currentDate,
          updatedAt: url.updatedAt || currentDate
        }
      });
    }

    // Fix URLNotification records
    const notifications = await prisma.uRLNotification.findMany({
      where: {
        OR: [
          { createdAt: { equals: undefined } },
          { updatedAt: { equals: undefined } }
        ]
      }
    });

    for (const notification of notifications) {
      await prisma.uRLNotification.update({
        where: { id: notification.id },
        data: {
          createdAt: notification.createdAt || currentDate,
          updatedAt: notification.updatedAt || currentDate
        }
      });
    }

    console.log('Successfully fixed all dates');
  } catch (error) {
    console.error('Error fixing dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDates();