
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking database for EOD report...');

    // We look for the metric created today
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const metrics = await prisma.dailyMetric.findMany({
        where: {
            date: {
                gte: startOfDay,
                lte: endOfDay,
            },
            notes: 'Verification Test Note' // Look for the specific note we sent
        },
        include: {
            teamMember: true
        }
    });

    console.log(`Found ${metrics.length} metrics matching criteria.`);

    if (metrics.length > 0) {
        console.log('✅ Verification Successful! Data found:', metrics[0]);
    } else {
        console.log('❌ No matching data found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
