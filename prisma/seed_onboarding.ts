import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding onboarding states...');

    // Get all enrollments
    const enrollments = await prisma.enrollment.findMany({
        include: {
            onboarding: true,
        },
    });

    console.log(`Found ${enrollments.length} enrollments.`);

    let createdCount = 0;

    for (const enrollment of enrollments) {
        if (!enrollment.onboarding) {
            await prisma.onboardingState.create({
                data: {
                    enrollmentId: enrollment.id,
                    callCompleted: false,
                    slackJoined: false,
                    courseAccess: false,
                    communityIntro: false,
                    goalsSet: false,
                    referralsAsked: false,
                },
            });
            createdCount++;
        }
    }

    console.log(`Created ${createdCount} missing onboarding states.`);
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
