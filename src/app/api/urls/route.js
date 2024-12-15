import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MonitoringService } from '@/lib/monitoring';

// Helper function to validate URL format
function validateUrl(url) {
  try {
    const parsedUrl = new URL(url);
    // Check protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    // Check length
    if (url.length > 2048) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// GET /api/urls - Get all URLs for the current user
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const urls = await prisma.URL.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Error fetching URLs:', error);
    return NextResponse.json({ error: 'Failed to fetch URLs' }, { status: 500 });
  }
}

// POST /api/urls - Add a new URL to monitor
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { url, name, checkInterval = 5 } = await req.json();

    if (!url || !validateUrl(url)) {
      return NextResponse.json({ error: 'Please provide a valid URL' }, { status: 400 });
    }

    if (checkInterval < 1) {
      return NextResponse.json(
        { error: 'Check interval must be at least 1 minute' },
        { status: 400 }
      );
    }

    const now = new Date();
    const newUrl = await prisma.URL.create({
      data: {
        url,
        name: name || url,
        checkInterval,
        userId: session.user.id,
        status: 'pending',
        timeout: 30,
        retryCount: 3,
        createdAt: now,
        updatedAt: now
      }
    });

    // Start monitoring the new URL
    await MonitoringService.setupUrlMonitoring(newUrl);

    return NextResponse.json({ 
      success: true,
      url: newUrl 
    });
  } catch (error) {
    console.error('Error creating URL:', error);
    return NextResponse.json(
      { error: 'Failed to add URL', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/urls - Update an existing URL
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { id, url, name, checkInterval } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'URL ID is required' }, { status: 400 });
    }

    const existingUrl = await prisma.URL.findUnique({
      where: { id },
    });

    if (!existingUrl || existingUrl.userId !== session.user.id) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    if (url && !validateUrl(url)) {
      return NextResponse.json({ error: 'Please provide a valid URL' }, { status: 400 });
    }

    if (checkInterval && checkInterval < 1) {
      return NextResponse.json(
        { error: 'Check interval must be at least 1 minute' },
        { status: 400 }
      );
    }

    const updatedUrl = await prisma.URL.update({
      where: { id },
      data: {
        url: url || existingUrl.url,
        name: name || existingUrl.name,
        checkInterval: checkInterval || existingUrl.checkInterval,
        updatedAt: new Date()
      },
    });

    // Restart monitoring with updated details
    await MonitoringService.setupUrlMonitoring(updatedUrl);

    return NextResponse.json({ 
      success: true,
      url: updatedUrl 
    });
  } catch (error) {
    console.error('Error updating URL:', error);
    return NextResponse.json(
      { error: 'Failed to update URL', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/urls - Delete a URL
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'URL ID is required' }, { status: 400 });
    }

    const url = await prisma.URL.findUnique({
      where: { id },
    });

    if (!url || url.userId !== session.user.id) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    await prisma.URL.delete({
      where: { id },
    });

    // Stop monitoring the URL
    MonitoringService.cleanupUrlMonitoring(id);

    return NextResponse.json({ 
      success: true,
      message: 'URL deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting URL:', error);
    return NextResponse.json(
      { error: 'Failed to delete URL', details: error.message },
      { status: 500 }
    );
  }
}
