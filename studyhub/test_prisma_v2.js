const { PrismaClient } = require('@prisma/client');

console.log('--- Prisma Diagnostic ---');
console.log('Typeof PrismaClient:', typeof PrismaClient);
try {
  const prisma = new PrismaClient();
  console.log('Successfully created PrismaClient instance');
  console.log('Constructor properties:', Object.keys(prisma).slice(0, 10));
} catch (e) {
  console.error('Failed to create instance:', e.message);
  console.error('Full Error:', e);
}

const { PrismaClient: GeneratedPrismaClient } = require('./node_modules/.prisma/client');
console.log('\n--- Generated Prisma Diagnostic ---');
console.log('Typeof GeneratedPrismaClient:', typeof GeneratedPrismaClient);
try {
  const gPrisma = new GeneratedPrismaClient();
  console.log('Successfully created GeneratedPrismaClient instance');
} catch (e) {
  console.error('Failed to create generated instance:', e.message);
}
