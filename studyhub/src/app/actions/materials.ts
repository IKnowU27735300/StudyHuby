'use server';

import prisma from '@/lib/prisma';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
  const mongoUser = await prisma.user.findUnique({
    where: { firebaseUid: userId }
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
      createdAt: new Date(),
    });

    return { success: true, id: mongoResult.id };
  } catch (error: any) {
    console.error("Upload failed:", error);
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
    }
  });
}

export async function downloadMaterial(id: string) {
  const material = await prisma.studyMaterial.findUnique({
    where: { id },
  });
  
  if (!material || !material.fileContent) {
    throw new Error("File not found");
  }

  return {
    content: Array.from(material.fileContent),
    mimeType: material.mimeType,
    fileName: material.title,
  };
}
