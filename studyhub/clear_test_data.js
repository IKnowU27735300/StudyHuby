const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing test data...');
  try {
    await prisma.studyMaterial.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Successfully cleared all users and materials.');
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
