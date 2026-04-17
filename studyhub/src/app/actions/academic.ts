'use server';

import prisma from '@/lib/prisma';

export async function createResearchPaper(data: {
  firebaseUid: string;
  title: string;
  authors: string;
  abstract: string;
  year: number;
  journal: string;
  tags: string[];
  url: string;
}) {
  try {
    console.log("Creating ResearchPaper for user:", data.firebaseUid);
    const mongoUser = await prisma.user.findFirst({
      where: { firebaseUid: data.firebaseUid } as any
    });

    if (!mongoUser) {
      console.error("User not found in MongoDB for Firebase UID:", data.firebaseUid);
      throw new Error("User profile not synced. Please refresh the page.");
    }

    console.log("Found MongoDB User:", mongoUser.id);

    const result = await prisma.researchPaper.create({
      data: {
        userId: mongoUser.id,
        title: data.title,
        authors: data.authors.split(',').map(a => a.trim()),
        abstract: data.abstract,
        publicationYear: data.year,
        journal: data.journal,
        fileUrl: data.url,
        tags: data.tags,
      }
    });

    console.log("ResearchPaper created successfully:", result.id);
    return { success: true, id: String(result.id) };
  } catch (error: any) {
    console.error("Failed to create ResearchPaper in MongoDB:", error);
    return { success: false, error: error.message };
  }
}


export async function createQuestionPaper(data: {
  firebaseUid: string;
  subject: string;
  code: string;
  year: number;
  semester: number;
  branch: string;
  college: string;
  url: string;
  tags: string[];
}) {
  try {
    console.log("Creating QuestionPaper for user:", data.firebaseUid);
    const mongoUser = await prisma.user.findFirst({
      where: { firebaseUid: data.firebaseUid } as any
    });

    if (!mongoUser) {
      console.error("User not found in MongoDB for Firebase UID:", data.firebaseUid);
      throw new Error("User profile not synced. Please refresh the page.");
    }

    const result = await prisma.questionPaper.create({
      data: {
        userId: mongoUser.id,
        subject: data.subject,
        subjectCode: data.code,
        year: data.year,
        semester: data.semester,
        branch: data.branch,
        college: data.college,
        fileUrl: data.url,
        tags: data.tags,
      }
    });

    console.log("QuestionPaper created successfully:", result.id);
    return { success: true, id: String(result.id) };
  } catch (error: any) {
    console.error("Failed to create QuestionPaper in MongoDB:", error);
    return { success: false, error: error.message };
  }
}


export async function createModelPaper(data: {
  firebaseUid: string;
  subject: string;
  code: string;
  year: number;
  semester: number;
  branch: string;
  college: string;
  url: string;
  tags: string[];
}) {
  try {
    console.log("Creating ModelPaper for user:", data.firebaseUid);
    const mongoUser = await prisma.user.findFirst({
      where: { firebaseUid: data.firebaseUid } as any
    });

    if (!mongoUser) {
      console.error("User not found in MongoDB for Firebase UID:", data.firebaseUid);
      throw new Error("User profile not synced. Please refresh the page.");
    }

    const result = await prisma.modelPaper.create({
      data: {
        userId: mongoUser.id,
        subject: data.subject,
        subjectCode: data.code,
        year: data.year,
        semester: data.semester,
        branch: data.branch,
        college: data.college,
        fileUrl: data.url,
        tags: data.tags,
      }
    });

    console.log("ModelPaper created successfully:", result.id);
    return { success: true, id: String(result.id) };
  } catch (error: any) {
    console.error("Failed to create ModelPaper in MongoDB:", error);
    return { success: false, error: error.message };
  }
}


export async function deleteAcademicItem(id: string, firebaseUid: string, type: 'RESEARCH' | 'QUESTION' | 'MODEL') {
  try {
    let material: any;
    
    switch(type) {
      case 'RESEARCH':
        material = await prisma.researchPaper.findUnique({ where: { id }, include: { user: true } });
        if (material?.user.firebaseUid !== firebaseUid) throw new Error("Unauthorized");
        await prisma.researchPaper.delete({ where: { id } });
        break;
      case 'QUESTION':
        material = await prisma.questionPaper.findUnique({ where: { id }, include: { user: true } });
        if (material?.user.firebaseUid !== firebaseUid) throw new Error("Unauthorized");
        await prisma.questionPaper.delete({ where: { id } });
        break;
      case 'MODEL':
        material = await prisma.modelPaper.findUnique({ where: { id }, include: { user: true } });
        if (material?.user.firebaseUid !== firebaseUid) throw new Error("Unauthorized");
        await prisma.modelPaper.delete({ where: { id } });
        break;
    }

    console.log(`Academic item ${id} deleted successfully from MongoDB.`);
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete ${type} from MongoDB:`, error);
    return { success: false, error: error.message };
  }
}

export async function downloadAcademicItem(id: string, type: 'RESEARCH' | 'QUESTION' | 'MODEL') {
  try {
    let item: any;
    
    switch(type) {
      case 'RESEARCH':
        item = await prisma.researchPaper.findUnique({ where: { id } });
        break;
      case 'QUESTION':
        item = await prisma.questionPaper.findUnique({ where: { id } });
        break;
      case 'MODEL':
        item = await prisma.modelPaper.findUnique({ where: { id } });
        break;
    }

    if (!item) throw new Error("Document not found in MongoDB");

    return { 
      url: item.fileUrl, 
      fileName: item.title || item.subject,
      mimeType: (item.fileUrl as string).includes('.pdf') ? 'application/pdf' : 'image/jpeg'
    };
  } catch (error: any) {
    console.error(`Failed to fetch ${type} URL from MongoDB:`, error);
    throw new Error(error.message);
  }
}

