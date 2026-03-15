import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Authenticate API requests via NextAuth session or Bearer API key.
 * Returns the userId if authenticated, or null if not.
 */
export async function authenticateApiRequest(
  req: NextRequest
): Promise<string | null> {
  // 1. Try Bearer token authentication
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = authHeader.slice(7).trim();
    if (apiKey) {
      const user = await prisma.user.findUnique({
        where: { apiKey },
        select: { id: true },
      });
      if (user) return user.id;
    }
  }

  // 2. Fall back to NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return (session.user as Record<string, unknown>).id as string;
  }

  return null;
}
