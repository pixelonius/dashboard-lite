import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const metrics = await prisma.dailyMetric.findMany({
        take: 5,
        include: { teamMember: true }
    });

    console.log('Sample Metrics:', JSON.stringify(metrics, null, 2));

    const count = await prisma.dailyMetric.count();
    console.log('Total Metrics:', count);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
