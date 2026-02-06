import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a franchisee
  const franchisee = await prisma.franchisee.create({
    data: {
      name: 'Sanderi Hardware & Plywood',
    },
  });
  console.log('Created franchisee:', franchisee.name);

  // Create a store
  const store = await prisma.store.create({
    data: {
      franchiseeId: franchisee.id,
      name: 'Sanderi Main Store',
      hardwareConversionRate: 100, // ₹100 = 1 point
      plywoodConversionRate: 100,
    },
  });
  console.log('Created store:', store.name);

  // Create an admin staff member
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.staff.create({
    data: {
      storeId: store.id,
      name: 'Admin User',
      mobileNumber: '9999999999',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Created admin:', admin.name, '(mobile: 9999999999, password: admin123)');

  // Create an employee staff member
  const employeePassword = await bcrypt.hash('employee123', 10);
  const employee = await prisma.staff.create({
    data: {
      storeId: store.id,
      name: 'Test Employee',
      mobileNumber: '8888888888',
      passwordHash: employeePassword,
      role: 'EMPLOYEE',
    },
  });
  console.log('Created employee:', employee.name, '(mobile: 8888888888, password: employee123)');

  // Create some unassigned cards for testing
  const cardUids = ['CARD001', 'CARD002', 'CARD003', 'CARD004', 'CARD005'];
  for (const cardUid of cardUids) {
    await prisma.card.create({
      data: {
        cardUid,
        franchiseeId: franchisee.id,
        status: 'UNASSIGNED',
      },
    });
  }
  console.log('Created', cardUids.length, 'unassigned cards');

  console.log('Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
