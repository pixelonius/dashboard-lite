
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting CSM data cleanup...');

    try {
        // 1. Remove 'CSM' users
        // We use 'as any' because the generated client might not have 'CSM' in UserRole enum anymore
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                role: 'CSM' as any
            }
        });
        console.log(`Deleted ${deletedUsers.count} users with role CSM`);

    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
