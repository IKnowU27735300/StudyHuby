
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Checking database storage usage...');
    const materials = await prisma.studyMaterial.findMany({
      select: { fileSize: true }
    });
    const totalBytes = materials.reduce((acc, curr) => acc + curr.fileSize, 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    console.log(`Total Materials: ${materials.length}`);
    console.log(`Total Storage Usage: ${totalMB} MB`);
    
    if (parseFloat(totalMB) > 450) {
      console.warn('WARNING: You are approaching the 512MB free tier limit of MongoDB Atlas!');
    }
  } catch (error) {
    console.error('Failed to check storage:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
