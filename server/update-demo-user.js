const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateDemoUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const user = await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('Demo user updated with password:', user.email);
  } catch (error) {
    console.error('Error updating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDemoUser();
