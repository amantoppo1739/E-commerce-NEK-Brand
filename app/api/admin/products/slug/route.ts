import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { slugCheckSchema } from '@/lib/validators/adminProduct';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = (session.user as any)?.role === 'admin';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const result = slugCheckSchema.safeParse(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: result.error.flatten() },
        { status: 422 }
      );
    }

    const { slug, excludeId } = result.data;

    const existing = await prisma.product.findFirst({
      where: {
        slug,
        NOT: excludeId
          ? {
              id: excludeId,
            }
          : undefined,
      },
      select: { id: true },
    });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error('Error checking slug:', error);
    return NextResponse.json(
      { error: 'Failed to check slug' },
      { status: 500 }
    );
  }
}

