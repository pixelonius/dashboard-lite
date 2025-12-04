import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);

        const teamMemberCount = await prisma.teamMember.count();
        console.log(`TeamMember count: ${teamMemberCount}`);

        const studentCount = await prisma.student.count();
        console.log(`Student count: ${studentCount}`);
    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
