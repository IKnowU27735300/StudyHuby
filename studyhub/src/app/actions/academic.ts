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
      where: { firebaseUid: data.firebaseUid } as any
    });

    if (!mongoUser) throw new Error("User not synced to MongoDB");

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

    return { success: true, id: result.id };
  } catch (error: any) {
    console.error("Failed to create ResearchPaper in MongoDB:", error);
    throw new Error(error.message);
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
      where: { firebaseUid: data.firebaseUid } as any
    });

    if (!mongoUser) throw new Error("User not synced to MongoDB");

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

    return { success: true, id: result.id };
  } catch (error: any) {
    console.error("Failed to create QuestionPaper in MongoDB:", error);
    throw new Error(error.message);
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
      where: { firebaseUid: data.firebaseUid } as any
    });

    if (!mongoUser) throw new Error("User not synced to MongoDB");

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

    return { success: true, id: result.id };
  } catch (error: any) {
    console.error("Failed to create ModelPaper in MongoDB:", error);
    throw new Error(error.message);
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

    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete ${type} from MongoDB:`, error);
    throw new Error(error.message);
  }
}
