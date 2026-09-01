'use server';

import prisma from '@/lib/prisma';
import { db } from '@/lib/firebase';
import { doc, setDoc, increment } from 'firebase/firestore';

export async function incrementContribution(firebaseUid: string) {
  try {
    const userDocRef = doc(db, 'users', firebaseUid);
    await setDoc(userDocRef, {
      contributionCount: increment(1)
    }, { merge: true });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error incrementing contribution';
    console.error('Error incrementing contribution:', message);
    return { success: false, error: message };
  }
}

export async function decrementContribution(firebaseUid: string) {
  try {
    const userDocRef = doc(db, 'users', firebaseUid);
    await setDoc(userDocRef, {
      contributionCount: increment(-1)
    }, { merge: true });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error decrementing contribution';
    console.error('Error decrementing contribution:', message);
    return { success: false, error: message };
  }
}

export async function incrementDownloads(firebaseUid: string) {
  try {
    const userDocRef = doc(db, 'users', firebaseUid);
    await setDoc(userDocRef, {
      totalDownloads: increment(1)
    }, { merge: true });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error incrementing downloads';
    console.error('Error incrementing downloads:', message);
    return { success: false, error: message };
  }
}

export async function decrementDownloads(firebaseUid: string) {
  try {
    const userDocRef = doc(db, 'users', firebaseUid);
    await setDoc(userDocRef, {
      totalDownloads: increment(-1)
    }, { merge: true });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error decrementing downloads';
    console.error('Error decrementing downloads:', message);
    return { success: false, error: message };
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
      where: { firebaseUid: data.firebaseUid }
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
        }
      });
    }
    return { success: true, id: user.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error syncing user';
    console.error('Error syncing user to MongoDB:', message);
    return { success: false, error: message };
  }
}

export async function updateUserOnboarding(data: {
  firebaseUid: string;
  college: string;
  course: string;
  semester: number;
  academicYear: string;
  registrationNo: string;
}) {
  try {
    const user = await prisma.user.findFirst({
      where: { firebaseUid: data.firebaseUid }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          college: data.college,
          course: data.course,
          semester: data.semester,
          academicYear: data.academicYear,
          registrationNo: data.registrationNo,
        }
      });
    }
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating user onboarding';
    console.error('Error updating user onboarding in MongoDB:', message);
    return { success: false, error: message };
  }
}

export async function updateUserProfile(data: {
  firebaseUid: string;
  name?: string;
  avatarUrl?: string;
  email?: string;
}) {
  try {
    const user = await prisma.user.findFirst({
      where: { firebaseUid: data.firebaseUid }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
          ...(data.email !== undefined ? { email: data.email } : {}),
        }
      });
    }
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update user profile';
    console.error('Error updating user profile in MongoDB:', message);
    return { success: false, error: message };
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error searching users';
    console.error('Error searching users:', message);
    return { success: false, error: message };
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firebaseUid: true,
        name: true,
        email: true,
        avatarUrl: true,
        college: true,
        course: true,
        role: true,
        loginStreak: true,
        createdAt: true,
      }
    });
    return { success: true, user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching user';
    return { success: false, error: message };
  }
}

export async function getUsersByFirebaseUids(uids: string[]) {
  try {
    const users = await prisma.user.findMany({
      where: {
        firebaseUid: { in: uids }
      },
      select: {
        id: true,
        firebaseUid: true,
        name: true,
        email: true,
        avatarUrl: true,
        college: true,
        course: true,
      }
    });
    return { success: true, users };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching users';
    return { success: false, error: message };
  }
}

