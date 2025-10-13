import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { timezone } = body;

    if (!timezone) {
      return NextResponse.json(
        { error: 'Timezone is required' },
        { status: 400 }
      );
    }

    // Update user's timezone in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { timezone },
      select: {
        id: true,
        timezone: true,
      }
    });

    // The session will be updated on the next sign-in
    // For immediate effect, the client should update the session
    return NextResponse.json({
      message: 'Timezone updated successfully',
      timezone: updatedUser.timezone
    });

  } catch (error) {
    console.error('Error updating timezone:', error);
    return NextResponse.json(
      { error: 'Failed to update timezone' },
      { status: 500 }
    );
  }
}