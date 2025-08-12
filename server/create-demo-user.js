const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const user = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('Demo user created/updated:', user);
  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
