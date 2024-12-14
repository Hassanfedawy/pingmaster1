import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Test endpoint to create a test user and URL
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Create a test URL
    const now = new Date();
    const testUrl = await prisma.URL.create({
      data: {
        url: 'https://example.com',
        name: 'Test URL',
        checkInterval: 5,
        userId: session.user.id,
        status: 'pending',
        timeout: 30,
        retryCount: 3,
        createdAt: now,
        updatedAt: now
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Test data created successfully',
      url: testUrl
    });
  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json({ 
      error: 'Failed to create test data',
      details: error.message 
    }, { status: 500 });
  }
}

// Get test data
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const urls = await prisma.URL.findMany({
      where: {
        userId: session.user.id
      }
    });

    return NextResponse.json({ 
      success: true,
      urls 
    });
  } catch (error) {
    console.error('Error fetching test data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch test data',
      details: error.message 
    }, { status: 500 });
  }
}
