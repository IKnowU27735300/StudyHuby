const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function test() {
  console.log("Starting Prisma test...");
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    console.log("Constructor with 'datasources' succeeded.");
    await prisma.$connect();
    console.log("Connection succeeded.");
    await prisma.$disconnect();
  } catch (e) {
    console.error("Constructor with 'datasources' failed:", e.message);
  }

  try {
    const prisma2 = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL
    });
    console.log("Constructor with 'datasourceUrl' succeeded.");
    await prisma2.$connect();
    console.log("Connection succeeded.");
    await prisma2.$disconnect();
  } catch (e) {
    console.error("Constructor with 'datasourceUrl' failed:", e.message);
  }
}

test();
