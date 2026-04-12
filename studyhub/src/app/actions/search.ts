'use server';

import prisma from '@/lib/prisma';

export type SearchCategory = 'MATERIALS' | 'QUESTION_PAPERS' | 'MODEL_PAPERS' | 'RESEARCH_PAPERS' | 'ACCOUNTS';

export async function globalSearch(query: string, categories: SearchCategory[], excludeFirebaseUid?: string) {
  try {
    const results: any[] = [];
    
    const searches = categories.map(async (category) => {
      switch (category) {
        case 'ACCOUNTS':
          const users = await prisma.user.findMany({
            where: {
              AND: [
                {
                  OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { college: { contains: query, mode: 'insensitive' } },
                  ],
                },
                excludeFirebaseUid ? { NOT: { firebaseUid: excludeFirebaseUid } } : {},
              ]
            } as any,
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              college: true,
              course: true,
            },
            take: 10,
          });
          return users.map(u => ({ ...u, _type: 'ACCOUNTS' }));

        case 'MATERIALS':
          const materials = await prisma.studyMaterial.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { subject: { contains: query, mode: 'insensitive' } },
                { subjectCode: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              title: true,
              subject: true,
              subjectCode: true,
              year: true,
              mimeType: true,
              fileSize: true,
              createdAt: true,
            },
            take: 10,
          });
          return materials.map(m => ({ ...m, _type: 'MATERIALS' }));

        case 'RESEARCH_PAPERS':
          const research = await prisma.researchPaper.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { abstract: { contains: query, mode: 'insensitive' } },
                { journal: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              title: true,
              abstract: true,
              journal: true,
              publicationYear: true,
              doi: true,
              createdAt: true,
            },
            take: 10,
          });
          return research.map(r => ({ ...r, _type: 'RESEARCH_PAPERS' }));

        case 'QUESTION_PAPERS':
          const questions = await prisma.questionPaper.findMany({
            where: {
              OR: [
                { subject: { contains: query, mode: 'insensitive' } },
                { subjectCode: { contains: query, mode: 'insensitive' } },
                { college: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              subject: true,
              subjectCode: true,
              college: true,
              year: true,
              createdAt: true,
            },
            take: 10,
          });
          return questions.map(q => ({ ...q, _type: 'QUESTION_PAPERS' }));

        case 'MODEL_PAPERS':
          const models = await prisma.modelPaper.findMany({
            where: {
              OR: [
                { subject: { contains: query, mode: 'insensitive' } },
                { subjectCode: { contains: query, mode: 'insensitive' } },
                { college: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              subject: true,
              subjectCode: true,
              college: true,
              year: true,
              createdAt: true,
            },
            take: 10,
          });
          return models.map(m => ({ ...m, _type: 'MODEL_PAPERS' }));

        default:
          return [];
      }
    });

    const allResults = await Promise.all(searches);
    const combined = allResults.flat();
    
    return { success: true, data: combined };
  } catch (error: any) {
    console.error('Global search error:', error);
    return { success: false, error: error.message };
  }
}

export async function getUserContributions(userId: string) {
  try {
    const materials = await prisma.studyMaterial.findMany({ 
      where: { userId }, 
      select: { id: true, title: true, subject: true, subjectCode: true, year: true, createdAt: true, fileSize: true } 
    });
    const research = await prisma.researchPaper.findMany({ 
      where: { userId }, 
      select: { id: true, title: true, publicationYear: true, abstract: true, createdAt: true } 
    });
    const questions = await prisma.questionPaper.findMany({ 
      where: { userId }, 
      select: { id: true, subject: true, subjectCode: true, year: true, createdAt: true } 
    });
    const models = await prisma.modelPaper.findMany({ 
      where: { userId }, 
      select: { id: true, subject: true, subjectCode: true, year: true, createdAt: true } 
    });

    return {
      success: true,
      contributions: {
        materials,
        research,
        questions,
        models
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
