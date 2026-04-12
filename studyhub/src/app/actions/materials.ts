'use server';

import prisma from '@/lib/prisma';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';

export async function uploadMaterial(formData: FormData) {
  const userId = formData.get('userId') as string;
  const title = formData.get('title') as string;
  const subject = formData.get('subject') as string;
  const subjectCode = formData.get('code') as string;
  const year = parseInt(formData.get('year') as string);
  const tags = JSON.parse(formData.get('tags') as string);
  const file = formData.get('file') as File;

  if (!userId || !file) {
    throw new Error('Missing file or user information');
  }

  // Convert File to Buffer for MongoDB
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 0. Find the MongoDB User ID using the Firebase UID
  const mongoUser = await prisma.user.findFirst({
    where: { firebaseUid: userId } as any
  });

  if (!mongoUser) {
    throw new Error('User not found in MongoDB. Please log in again.');
  }

  try {
    // 1. Store the full file and metadata in MongoDB
    const mongoResult = await prisma.studyMaterial.create({
      data: {
        userId: mongoUser.id, // Use the MongoDB ObjectId
        title,
        subject,
        subjectCode,
        year,
        branch: "General", 
        college: "My College", 
        fileContent: buffer,
        fileSize: file.size,
        mimeType: file.type,
        tags: tags,
      }
    });

    // 2. Store just the name and category in Firebase Firestore
    await addDoc(collection(db, 'material_index'), {
      fileName: title,
      category: subject,
      mongodbId: mongoResult.id,
      userId,
      createdAt: new Date(),
    });

    // 3. Create a Discover Alert for all users
    await addDoc(collection(db, 'notifications'), {
      userId: 'GLOBAL_ALERTS', // Marker for broadcast
      type: 'UPLOAD',
      message: `New Document: "${title}" added in ${subject}!`,
      createdAt: serverTimestamp(),
      resourceId: mongoResult.id
    });
    
    // We removed Prisma contributionCount to restore database state.
    // Real-time tracking is handled on the client via Firestore material_index.
    return { success: true, id: mongoResult.id, title, subject };
  } catch (error: any) {
    console.error("Upload failed in MongoDB:", error);
    throw new Error(error.message);
  }
}

export async function getMaterials() {
  return await prisma.studyMaterial.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      subject: true,
      subjectCode: true,
      year: true,
      fileSize: true,
      mimeType: true,
      tags: true,
      createdAt: true,
      user: {
        select: {
          firebaseUid: true
        } as any
      }
    }
  });
}

export async function deleteMaterial(id: string, firebaseUid: string) {
  try {
    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!material) throw new Error("Material not found");
    
    // Ownership check
    if ((material.user as any).firebaseUid !== firebaseUid) {
      throw new Error("Unauthorized: You can only delete your own materials.");
    }

    // 1. Delete from MongoDB
    await prisma.studyMaterial.delete({
      where: { id }
    });

    // 2. Find and delete from Firestore material_index
    const indexQuery = query(collection(db, 'material_index'), where('mongodbId', '==', id));
    const indexSnap = await getDocs(indexQuery);
    
    const deletePromises = indexSnap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Prisma updates for contributionCount removed to restore state.
    return { success: true };
  } catch (error: any) {
    console.error("Delete failed in MongoDB:", error);
    throw new Error(error.message);
  }
}

export async function downloadMaterial(id: string) {
  try {
    const material = await prisma.studyMaterial.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!material || !material.fileContent) {
      throw new Error("File not found");
    }

    // Prisma updates for totalDownloads removed to restore state.
    return {
      content: Array.from(material.fileContent),
      mimeType: material.mimeType,
      fileName: material.title,
    };
  } catch (error: any) {
    console.error("Download failed:", error);
    throw new Error(error.message);
  }
}
