import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Store active connections
const clients = new Map();

// Helper to send events to all connected clients for a user
export function sendEventToUser(userId, event) {
  const userClients = clients.get(userId) || [];
  userClients.forEach(client => {
    client.write(`data: ${JSON.stringify(event)}\n\n`);
  });
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const headersList = headers();
  const userId = session.user.id;

  // Set up SSE headers
  const responseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Add this client to the clients map
  if (!clients.has(userId)) {
    clients.set(userId, []);
  }
  clients.get(userId).push(writer);

  // Send initial connection message
  writer.write('data: {"type":"connected"}\n\n');

  // Remove client when connection closes
  request.signal.addEventListener('abort', () => {
    const userClients = clients.get(userId) || [];
    const index = userClients.indexOf(writer);
    if (index > -1) {
      userClients.splice(index, 1);
    }
    if (userClients.length === 0) {
      clients.delete(userId);
    }
    writer.close();
  });

  return new Response(stream.readable, { headers: responseHeaders });
}
