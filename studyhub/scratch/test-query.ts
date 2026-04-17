
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Testing case-insensitive search on MongoDB...');
    const users = await prisma.user.findMany({
      where: {
        name: { contains: 'test', mode: 'insensitive' }
      } as any
    });
    console.log('Search success!');
  } catch (error) {
    console.error('Search failed:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
