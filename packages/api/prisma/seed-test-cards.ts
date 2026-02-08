import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding test cards...\n');

    // Get the first franchisee and store
    const franchisee = await prisma.franchisee.findFirst();
    if (!franchisee) {
        console.error('No franchisee found! Please run the main seed first.');
        process.exit(1);
    }

    const store = await prisma.store.findFirst({
        where: { franchiseeId: franchisee.id },
    });
    if (!store) {
        console.error('No store found! Please run the main seed first.');
        process.exit(1);
    }

    // Get an admin staff member
    const admin = await prisma.staff.findFirst({
        where: { role: 'ADMIN' },
    });
    if (!admin) {
        console.error('No admin staff found! Please run the main seed first.');
        process.exit(1);
    }

    console.log(`Using franchisee: ${franchisee.name}`);
    console.log(`Using store: ${store.name}`);
    console.log(`Using admin: ${admin.name}\n`);

    // Test cards to create
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
        // Check if card already exists
        const existingCard = await prisma.card.findUnique({
            where: { cardUid: testCard.cardUid },
        });

        if (existingCard) {
            console.log(`Card ${testCard.cardUid} already exists, skipping...`);
            continue;
        }

        // Check if mobile number is already used
        const existingHolder = await prisma.cardHolder.findUnique({
            where: { mobileNumber: testCard.customerMobile },
        });

        if (existingHolder) {
            console.log(`Mobile ${testCard.customerMobile} already registered, skipping card ${testCard.cardUid}...`);
            continue;
        }

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

        // Create sample point entry history
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
                    amount: testCard.hardwarePoints * 100,
                    pointsDelta: testCard.hardwarePoints,
                    pointsRemaining: testCard.hardwarePoints,
                    expiresAt,
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
                    amount: testCard.plywoodPoints * 100,
                    pointsDelta: testCard.plywoodPoints,
                    pointsRemaining: testCard.plywoodPoints,
                    expiresAt,
                },
            });
        }

        console.log(`✓ Created: ${testCard.cardUid} (${testCard.customerName})`);
        console.log(`  Mobile: ${testCard.customerMobile}`);
        console.log(`  Hardware Points: ${testCard.hardwarePoints}, Plywood Points: ${testCard.plywoodPoints}`);
    }

    console.log('\n============================================');
    console.log('          TEST CARD SUMMARY                 ');
    console.log('============================================');
    console.log('| Card UID | Customer       | Mobile      | HW Pts | PW Pts |');
    console.log('|----------|----------------|-------------|--------|--------|');
    for (const tc of testCards) {
        console.log(`| ${tc.cardUid.padEnd(8)} | ${tc.customerName.padEnd(14)} | ${tc.customerMobile} | ${tc.hardwarePoints.toString().padStart(6)} | ${tc.plywoodPoints.toString().padStart(6)} |`);
    }
    console.log('============================================\n');

    console.log('Test cards seeding completed!');
    console.log('\nYou can now use these card UIDs or mobile numbers for lookup:');
    console.log('  - TEST001 / 9876543210 (Rahul Sharma)');
    console.log('  - TEST002 / 9876543211 (Priya Patel)');
    console.log('  - TEST003 / 9876543212 (Amit Kumar)');
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
