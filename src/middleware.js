import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      if (
        req.nextUrl.pathname.startsWith('/dashboard') ||
        req.nextUrl.pathname.startsWith('/settings')
      ) {
        return token !== null;
      }
      return true;
    },
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};
