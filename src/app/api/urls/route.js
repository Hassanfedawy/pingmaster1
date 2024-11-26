import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Helper function to validate URL format
function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// GET /api/urls - Get all URLs for the current user
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Detailed Session Info:', {
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      } : 'No session',
      sessionExists: !!session
    });

    if (!session?.user?.id) {
      console.warn('Unauthorized access attempt to /api/urls');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const urls = await prisma.URL.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        history: {
          take: 1,
          orderBy: {
            timestamp: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Fetched URLs:', {
      count: urls.length,
      userIds: urls.map(url => url.userId),
      urlIds: urls.map(url => url.id)
    });

    return NextResponse.json({
      urls: urls.map(url => ({
        ...url,
        lastStatus: url.history[0]?.status || 'pending',
        lastChecked: url.history[0]?.timestamp || null,
        history: undefined
      }))
    });
  } catch (error) {
    console.error('Complete Error in GET /api/urls:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve URLs',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

// POST /api/urls - Create a new URL
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Detailed Session Info:', {
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      } : 'No session',
      sessionExists: !!session
    });

    if (!session?.user?.id) {
      console.warn('Unauthorized access attempt to /api/urls');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { url, name, checkInterval } = data;

    if (!url || !validateUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const newUrl = await prisma.URL.create({
      data: {
        userId: session.user.id,
        url,
        name: name || url,
        checkInterval: +checkInterval || 5,
        timeout: 30,
        retryCount: 3,
        status: 'pending'
      },
    });

    console.log('Created URL:', newUrl);
    return NextResponse.json({ url: newUrl });
  } catch (error) {
    console.error('Error creating URL:', error);
    return NextResponse.json(
      { error: 'Failed to create URL: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/urls - Update a URL
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { id, url, name, checkInterval } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'URL ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingUrl = await prisma.URL.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!existingUrl || existingUrl.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'URL not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the URL
    const updatedUrl = await prisma.URL.update({
      where: { id },
      data: {
        url: url,
        name: name,
        checkInterval: +checkInterval || 5,
      },
    });

    console.log('Updated URL:', updatedUrl);
    return NextResponse.json({ url: updatedUrl });
  } catch (error) {
    console.error('Error updating URL:', error);
    return NextResponse.json(
      { error: 'Failed to update URL: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/urls - Delete a URL
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'URL ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingUrl = await prisma.URL.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!existingUrl || existingUrl.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'URL not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the URL and its associated history
    await prisma.URLHistory.deleteMany({
      where: { urlId: id }
    });

    // Delete the URL
    await prisma.URL.delete({
      where: { id },
    });

    console.log('Deleted URL:', id);
    return NextResponse.json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Error deleting URL:', error);
    return NextResponse.json(
      { error: 'Failed to delete URL: ' + error.message },
      { status: 500 }
    );
  }
}