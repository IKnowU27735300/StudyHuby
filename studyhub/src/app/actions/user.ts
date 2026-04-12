'use server';

import prisma from '@/lib/prisma';

export async function syncUser(data: {
  firebaseUid: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  try {
    const user = await prisma.user.upsert({
      where: { firebaseUid: data.firebaseUid },
      update: {
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        lastLoginAt: new Date(),
      },
      create: {
        firebaseUid: data.firebaseUid,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        loginStreak: 1,
      },
    });
    return { success: true, id: user.id };
  } catch (error: any) {
    console.error('Error syncing user to MongoDB:', error);
    return { success: false, error: error.message };
  }
}
