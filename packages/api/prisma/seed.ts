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
      inviteCode: 'sanderi1',
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

  // ============== ACTIVE TEST CARDS FOR LOOKUP/CREDIT/DEBIT ==============
  // These cards have holders and points for testing without a physical NFC card

  const testCards = [
    {
      cardUid: 'TEST001',
      customerName: 'Rahul Sharma',
      customerMobile: '9876543210',
      hardwarePoints: 150,
      plywoodPoints: 75,
    },
    {
      cardUid: 'TEST002',
      customerName: 'Priya Patel',
      customerMobile: '9876543211',
      hardwarePoints: 500,
      plywoodPoints: 250,
    },
    {
      cardUid: 'TEST003',
      customerName: 'Amit Kumar',
      customerMobile: '9876543212',
      hardwarePoints: 0,
      plywoodPoints: 100,
    },
  ];

  for (const testCard of testCards) {
    // Create the card with ACTIVE status and points
    await prisma.card.create({
      data: {
        cardUid: testCard.cardUid,
        franchiseeId: franchisee.id,
        status: 'ACTIVE',
        hardwarePoints: testCard.hardwarePoints,
        plywoodPoints: testCard.plywoodPoints,
        issuedById: admin.id,
      },
    });

    // Create the card holder
    await prisma.cardHolder.create({
      data: {
        cardUid: testCard.cardUid,
        name: testCard.customerName,
        mobileNumber: testCard.customerMobile,
      },
    });

    // Create some sample point entry history
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

    if (testCard.hardwarePoints > 0) {
      await prisma.pointEntry.create({
        data: {
          entryId: `SEED-${testCard.cardUid}-HW`,
          cardUid: testCard.cardUid,
          storeId: store.id,
          staffId: admin.id,
          category: 'HARDWARE',
          transactionType: 'CREDIT',
          pointsDelta: testCard.hardwarePoints,
          pointsRemaining: testCard.hardwarePoints,
          expiresAt: expiresAt,
        },
      });
    }

    if (testCard.plywoodPoints > 0) {
      await prisma.pointEntry.create({
        data: {
          entryId: `SEED-${testCard.cardUid}-PW`,
          cardUid: testCard.cardUid,
          storeId: store.id,
          staffId: admin.id,
          category: 'PLYWOOD',
          transactionType: 'CREDIT',
          pointsDelta: testCard.plywoodPoints,
          pointsRemaining: testCard.plywoodPoints,
          expiresAt: expiresAt,
        },
      });
    }

    console.log(`Created active card: ${testCard.cardUid} (${testCard.customerName}, ${testCard.customerMobile})`);
    console.log(`  - Hardware Points: ${testCard.hardwarePoints}, Plywood Points: ${testCard.plywoodPoints}`);
  }

  console.log('\n============== TEST CARD SUMMARY ==============');
  console.log('| Card UID | Customer Name  | Mobile      | HW Pts | PW Pts |');
  console.log('|----------|----------------|-------------|--------|--------|');
  for (const tc of testCards) {
    console.log(`| ${tc.cardUid.padEnd(8)} | ${tc.customerName.padEnd(14)} | ${tc.customerMobile} | ${tc.hardwarePoints.toString().padStart(6)} | ${tc.plywoodPoints.toString().padStart(6)} |`);
  }
  console.log('================================================\n');

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
