const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test user...');
  try {
    const user = await prisma.user.create({
      data: {
        email: 'test' + Date.now() + '@example.com',
        name: 'Test User',
      }
    });
    console.log('Test user created:', user);

    const material = await prisma.studyMaterial.create({
      data: {
        userId: user.id,
        title: 'Test Material',
        subject: 'Testing',
        subjectCode: 'TEST101',
        year: 2024,
        branch: 'General',
        college: 'Test College',
        fileSize: 1024,
        mimeType: 'application/pdf',
      }
    });
    console.log('Test material created:', material);

    console.log('\nVerifying counts...');
    const uCount = await prisma.user.count();
    const mCount = await prisma.studyMaterial.count();
    console.log(`Users: ${uCount}, Materials: ${mCount}`);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
