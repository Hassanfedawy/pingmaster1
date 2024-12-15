const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOrphanedUrls() {
  try {
    // Find all URLs without a user
    const orphanedUrls = await prisma.URL.findMany({
      where: { userId: null }
    });

    console.log(`Found ${orphanedUrls.length} orphaned URLs`);

    if (orphanedUrls.length > 0) {
      // Delete orphaned URLs
      const deleteResult = await prisma.URL.deleteMany({
        where: { 
          id: { 
            in: orphanedUrls.map(url => url.id) 
          } 
        }
      });

      console.log(`Deleted ${deleteResult.count} orphaned URLs`);
    }
  } catch (error) {
    console.error('Error cleaning up orphaned URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedUrls();
