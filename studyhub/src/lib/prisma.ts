const { PrismaClient } = require('S:\\CLG\\Projects\\StudyHuby\\studyhub\\node_modules\\.prisma\\client\\index.js');

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
