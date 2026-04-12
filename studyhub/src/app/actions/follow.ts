'use server';

import prisma from '@/lib/prisma';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function toggleFollow(currentFirebaseUid: string, currentUserName: string, targetMongoId: string) {
  try {
    // 1. Get target's Firebase UID from MongoDB
    const targetUser = await prisma.user.findUnique({
      where: { id: targetMongoId },
      select: { firebaseUid: true, name: true }
    });

    if (!targetUser) throw new Error('Target user not found');
    const targetFirebaseUid = targetUser.firebaseUid;

    if (currentFirebaseUid === targetFirebaseUid) throw new Error('You cannot follow yourself');

    // 2. Check current follow status from Firestore
    const currentUserRef = doc(db, 'users', currentFirebaseUid);
    const currentUserDoc = await getDoc(currentUserRef);
    const currentFollowing = currentUserDoc.data()?.following || [];
    
    const isFollowing = currentFollowing.includes(targetFirebaseUid);

    const targetUserRef = doc(db, 'users', targetFirebaseUid);

    if (isFollowing) {
      // Unfollow logic...
      await updateDoc(currentUserRef, { following: arrayRemove(targetFirebaseUid) });
      await updateDoc(targetUserRef, { followers: arrayRemove(currentFirebaseUid) });
      return { success: true, isFollowing: false };
    } else {
      // Follow logic
      await updateDoc(currentUserRef, { following: arrayUnion(targetFirebaseUid) });
      await updateDoc(targetUserRef, { followers: arrayUnion(currentFirebaseUid) });

      // Create Notification
      await addDoc(collection(db, 'notifications'), {
        userId: targetFirebaseUid,
        fromUserId: currentFirebaseUid,
        fromUserName: currentUserName,
        type: 'FOLLOW',
        message: `${currentUserName} started following you!`,
        read: false,
        createdAt: serverTimestamp()
      });

      return { success: true, isFollowing: true };
    }
  } catch (error: any) {
    console.error('Toggle follow failed:', error);
    return { success: false, error: error.message };
  }
}
