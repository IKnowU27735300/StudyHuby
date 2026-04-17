
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Testing Prisma StudyMaterial findMany...');
    const materials = await prisma.studyMaterial.findMany({
      include: {
        user: {
          select: {
            firebaseUid: true
          }
        }
      }
    });
    console.log(`Success! Found ${materials.length} materials.`);
  } catch (error) {
    console.error('Prisma query failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
