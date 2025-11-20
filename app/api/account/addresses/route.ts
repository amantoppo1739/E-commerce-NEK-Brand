import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json([], { status: 200 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(addresses);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: (session.user as any).id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      ...body,
      userId: (session.user as any).id,
    },
  });

  return NextResponse.json(address, { status: 201 });
}

