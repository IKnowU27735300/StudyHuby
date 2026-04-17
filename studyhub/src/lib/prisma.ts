import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  // Optional: Test connection on start-up (only in dev to avoid blocking production startup)
  if (process.env.NODE_ENV === 'development') {
    client.$connect()
      .then(() => console.log('Successfully connected to MongoDB via Prisma'))
      .catch((err) => console.error('Prisma failed to connect to MongoDB:', err));
  }
  
  return client;
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
