'use server';

import prisma from '@/lib/prisma';
import { db } from '@/lib/firebase';
import { doc, setDoc, increment } from 'firebase/firestore';

export async function incrementContribution(firebaseUid: string) {
  try {
    // We only update Firestore now to avoid Prisma schema sync issues
    // Real-time counts are driven by Firestore snapshots
    const userDocRef = doc(db, 'users', firebaseUid);
    await setDoc(userDocRef, {
      contributionCount: increment(1)
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error('Error incrementing contribution:', error);
    return { success: false, error: error.message };
  }
}

export async function decrementContribution(firebaseUid: string) {
  try {
    const userDocRef = doc(db, 'users', firebaseUid);
    await setDoc(userDocRef, {
      contributionCount: increment(-1)
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error('Error decrementing contribution:', error);
    return { success: false, error: error.message };
  }
}

export async function syncUser(data: {
  firebaseUid: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  try {
    let user = await prisma.user.findFirst({
      where: { firebaseUid: data.firebaseUid } as any
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: data.email,
          name: data.name,
          avatarUrl: data.avatarUrl,
          lastLoginAt: new Date(),
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          firebaseUid: data.firebaseUid,
          email: data.email,
          name: data.name,
          avatarUrl: data.avatarUrl,
          loginStreak: 1,
        } as any
      });
    }
    return { success: true, id: user.id };
  } catch (error: any) {
    console.error('Error syncing user to MongoDB:', error);
    return { success: false, error: error.message };
  }
}

export async function searchUsers(query: string) {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { college: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        college: true,
        course: true,
        role: true,
      },
      take: 20,
    });
    return { success: true, users };
  } catch (error: any) {
    console.error('Error searching users:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        college: true,
        course: true,
        role: true,
        createdAt: true,
      }
    });
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUsersByFirebaseUids(uids: string[]) {
  try {
    const users = await prisma.user.findMany({
      where: {
        firebaseUid: { in: uids }
      } as any,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        college: true,
        course: true,
      }
    });
    return { success: true, users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
