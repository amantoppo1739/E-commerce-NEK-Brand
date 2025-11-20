import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

  const address = await prisma.address.update({
    where: {
      id: params.id,
      userId: (session.user as any).id,
    },
    data: body,
  });

  return NextResponse.json(address);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.address.delete({
    where: {
      id: params.id,
      userId: (session.user as any).id,
    },
  });

  return NextResponse.json({ success: true });
}

