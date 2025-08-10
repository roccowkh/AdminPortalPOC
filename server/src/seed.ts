import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      phone: '+1234567890',
      role: 'ADMIN',
      password: await bcrypt.hash('admin123', 12)
    }
  });

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      phone: '+1234567891',
      role: 'USER'
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      phone: '+1234567892',
      role: 'USER'
    }
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Johnson',
      phone: '+1234567893',
      role: 'USER'
    }
  });

  // Create sample services
  const service1 = await prisma.service.create({
    data: {
      name: 'Consultation',
      description: 'Initial consultation session',
      duration: 60,
      price: 100.00,
      isActive: true
    }
  });

  const service2 = await prisma.service.create({
    data: {
      name: 'Follow-up',
      description: 'Follow-up appointment',
      duration: 30,
      price: 50.00,
      isActive: true
    }
  });

  const service3 = await prisma.service.create({
    data: {
      name: 'Emergency',
      description: 'Emergency appointment',
      duration: 45,
      price: 150.00,
      isActive: true
    }
  });

  // Create sample bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const booking1 = await prisma.booking.create({
    data: {
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // +1 hour
      status: 'CONFIRMED',
      notes: 'Initial consultation',
      users: {
        create: {
          userId: user1.id
        }
      },
      services: {
        create: {
          serviceId: service1.id
        }
      }
    }
  });

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(14, 0, 0, 0);

  const booking2 = await prisma.booking.create({
    data: {
      startTime: dayAfterTomorrow,
      endTime: new Date(dayAfterTomorrow.getTime() + 30 * 60 * 1000), // +30 minutes
      status: 'CONFIRMED',
      notes: 'Follow-up appointment',
      users: {
        create: {
          userId: user2.id
        }
      },
      services: {
        create: {
          serviceId: service2.id
        }
      }
    }
  });

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(10, 30, 0, 0);

  const booking3 = await prisma.booking.create({
    data: {
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 45 * 60 * 1000), // +45 minutes
      status: 'PENDING',
      notes: 'Emergency appointment',
      users: {
        create: {
          userId: user3.id
        }
      },
      services: {
        create: {
          serviceId: service3.id
        }
      }
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('📧 Admin login: admin@example.com / admin123');
  console.log('👥 Sample users created:', [user1.name, user2.name, user3.name]);
  console.log('🔧 Sample services created:', [service1.name, service2.name, service3.name]);
  console.log('📅 Sample bookings created:', 3);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 