const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database status...');
  try {
    const userCount = await prisma.user.count();
    const materialCount = await prisma.studyMaterial.count();
    const researchPaperCount = await prisma.researchPaper.count();
    const questionPaperCount = await prisma.questionPaper.count();
    const modelPaperCount = await prisma.modelPaper.count();

    console.log('--- Database Stats ---');
    console.log(`Users: ${userCount}`);
    console.log(`Study Materials: ${materialCount}`);
    console.log(`Research Papers: ${researchPaperCount}`);
    console.log(`Question Papers: ${questionPaperCount}`);
    console.log(`Model Papers: ${modelPaperCount}`);
    console.log('---------------------');

    if (userCount > 0) {
      console.log('\nLast 5 Users:');
      const users = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, createdAt: true }
      });
      console.table(users);
    }

    if (materialCount > 0) {
      console.log('\nLast 5 Study Materials:');
      const materials = await prisma.studyMaterial.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, subject: true, createdAt: true }
      });
      console.table(materials);
    }

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
