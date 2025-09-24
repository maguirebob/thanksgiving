"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const config_1 = require("../src/lib/config");
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: config_1.config.getDatabaseUrl()
        }
    }
});
async function main() {
    console.log('🚀 Starting Prisma migration...');
    try {
        await prisma.$connect();
        console.log('✅ Database connection established');
        console.log('📦 Generating Prisma client...');
        console.log('📊 Checking existing data...');
        const userCount = await prisma.user.count();
        const eventCount = await prisma.event.count();
        const photoCount = await prisma.photo.count();
        const sessionCount = await prisma.session.count();
        console.log(`👥 Users: ${userCount}`);
        console.log(`📅 Events: ${eventCount}`);
        console.log(`📸 Photos: ${photoCount}`);
        console.log(`🔐 Sessions: ${sessionCount}`);
        if (userCount > 0) {
            console.log('📋 Sample users:');
            const users = await prisma.user.findMany({
                take: 3,
                select: {
                    user_id: true,
                    username: true,
                    email: true,
                    role: true,
                    created_at: true
                }
            });
            users.forEach(user => {
                console.log(`  - ${user.username} (${user.email}) - ${user.role}`);
            });
        }
        if (eventCount > 0) {
            console.log('📋 Sample events:');
            const events = await prisma.event.findMany({
                take: 3,
                select: {
                    event_id: true,
                    event_name: true,
                    event_date: true,
                    menu_title: true
                }
            });
            events.forEach(event => {
                console.log(`  - ${event.event_name} (${event.event_date}) - ${event.menu_title}`);
            });
        }
        console.log('✅ Migration check completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main()
    .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
//# sourceMappingURL=migrate-to-prisma.js.map