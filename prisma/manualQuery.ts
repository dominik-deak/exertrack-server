import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Manually execute Prisma queries here.
 *
 * To run file: `npx ts-node prisma/manualQuery.ts`
 */
async function main() {}

main()
	.catch(async e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
