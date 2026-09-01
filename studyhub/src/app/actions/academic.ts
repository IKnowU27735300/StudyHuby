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
    const mongoUser = await prisma.user.findFirst({
      where: { firebaseUid: data.firebaseUid }
    });

    if (!mongoUser) {
      throw new Error("User profile not synced. Please refresh the page.");
    }

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

    return { success: true, id: String(result.id) };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create Research Paper";
    console.error("Failed to create ResearchPaper in MongoDB:", msg);
    return { success: false, error: msg };
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
    const mongoUser = await prisma.user.findFirst({
      where: { firebaseUid: data.firebaseUid }
    });

    if (!mongoUser) {
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

    return { success: true, id: String(result.id) };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create Question Paper";
    console.error("Failed to create QuestionPaper in MongoDB:", msg);
    return { success: false, error: msg };
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
    const mongoUser = await prisma.user.findFirst({
      where: { firebaseUid: data.firebaseUid }
    });

    if (!mongoUser) {
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

    return { success: true, id: String(result.id) };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create Model Paper";
    console.error("Failed to create ModelPaper in MongoDB:", msg);
    return { success: false, error: msg };
  }
}

export async function deleteAcademicItem(id: string, firebaseUid: string, type: 'RESEARCH' | 'QUESTION' | 'MODEL') {
  try {
    switch(type) {
      case 'RESEARCH': {
        const material = await prisma.researchPaper.findUnique({ where: { id }, include: { user: true } });
        if (!material || material.user.firebaseUid !== firebaseUid) throw new Error("Unauthorized");
        await prisma.researchPaper.delete({ where: { id } });
        break;
      }
      case 'QUESTION': {
        const material = await prisma.questionPaper.findUnique({ where: { id }, include: { user: true } });
        if (!material || material.user.firebaseUid !== firebaseUid) throw new Error("Unauthorized");
        await prisma.questionPaper.delete({ where: { id } });
        break;
      }
      case 'MODEL': {
        const material = await prisma.modelPaper.findUnique({ where: { id }, include: { user: true } });
        if (!material || material.user.firebaseUid !== firebaseUid) throw new Error("Unauthorized");
        await prisma.modelPaper.delete({ where: { id } });
        break;
      }
    }

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete item";
    console.error(`Failed to delete ${type} from MongoDB:`, msg);
    return { success: false, error: msg };
  }
}

export async function downloadAcademicItem(id: string, type: 'RESEARCH' | 'QUESTION' | 'MODEL') {
  try {
    let itemUrl = '';
    let itemName = '';
    
    switch(type) {
      case 'RESEARCH': {
        const res = await prisma.researchPaper.findUnique({ where: { id } });
        if (!res) throw new Error("Document not found in MongoDB");
        itemUrl = res.fileUrl;
        itemName = res.title;
        break;
      }
      case 'QUESTION': {
        const q = await prisma.questionPaper.findUnique({ where: { id } });
        if (!q) throw new Error("Document not found in MongoDB");
        itemUrl = q.fileUrl;
        itemName = q.subject;
        break;
      }
      case 'MODEL': {
        const m = await prisma.modelPaper.findUnique({ where: { id } });
        if (!m) throw new Error("Document not found in MongoDB");
        itemUrl = m.fileUrl;
        itemName = m.subject;
        break;
      }
    }

    return { 
      url: itemUrl, 
      fileName: itemName,
      mimeType: itemUrl.includes('.pdf') ? 'application/pdf' : 'image/jpeg'
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to download item";
    console.error(`Failed to fetch ${type} URL from MongoDB:`, msg);
    throw new Error(msg);
  }
}

