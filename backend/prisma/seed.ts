import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create default categories
    const categories = [
        { name: 'Food & Restaurants', nameAr: 'مطاعم وأكل', nameFr: 'Restauration', icon: '🍔' },
        { name: 'Clothing & Fashion', nameAr: 'ملابس وأزياء', nameFr: 'Mode', icon: '👕' },
        { name: 'Perfumes & Beauty', nameAr: 'عطور وجمال', nameFr: 'Beauté', icon: '🧴' },
        { name: 'Electronics', nameAr: 'إلكترونيات', nameFr: 'Électronique', icon: '📱' },
        { name: 'Sports & Fitness', nameAr: 'رياضة ولياقة', nameFr: 'Sport', icon: '🏋️' },
        { name: 'Home & Garden', nameAr: 'منزل وحديقة', nameFr: 'Maison', icon: '🏠' },
        { name: 'Books & Education', nameAr: 'كتب وتعليم', nameFr: 'Livres', icon: '📚' },
        { name: 'Health & Pharmacy', nameAr: 'صحة وصيدلية', nameFr: 'Santé', icon: '💊' },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: { ...cat, isActive: true },
        });
    }
    console.log('✅ Categories created');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const sellerPassword = await bcrypt.hash('seller123', 10);
    const driverPassword = await bcrypt.hash('driver123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    // Create demo users
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@myworld.dz' },
        update: {},
        create: {
            email: 'admin@myworld.dz',
            password: adminPassword,
            fullName: 'مدير النظام',
            phone: '0550000001',
            role: 'ADMIN',
            isActive: true,
            isVerified: true,
        },
    });

    const sellerUser = await prisma.user.upsert({
        where: { email: 'seller@myworld.dz' },
        update: {},
        create: {
            email: 'seller@myworld.dz',
            password: sellerPassword,
            fullName: 'بائع تجريبي',
            phone: '0550000002',
            role: 'SELLER',
            isActive: true,
            isVerified: true,
        },
    });

    await prisma.user.upsert({
        where: { email: 'driver@myworld.dz' },
        update: {},
        create: {
            email: 'driver@myworld.dz',
            password: driverPassword,
            fullName: 'سائق تجريبي',
            phone: '0550000003',
            role: 'DRIVER',
            isActive: true,
            isVerified: true,
            driverStatus: 'AVAILABLE',
        },
    });

    await prisma.user.upsert({
        where: { email: 'customer@myworld.dz' },
        update: {},
        create: {
            email: 'customer@myworld.dz',
            password: customerPassword,
            fullName: 'عميل تجريبي',
            phone: '0550000004',
            role: 'CUSTOMER',
            isActive: true,
            isVerified: true,
        },
    });
    console.log('✅ Demo users created');

    // Create default commission settings
    const existing = await prisma.commissionSettings.findFirst({ where: { isActive: true } });
    if (!existing) {
        await prisma.commissionSettings.create({
            data: {
                percentage: 10,
                minAmount: 0,
                isActive: true,
            },
        });
        console.log('✅ Commission settings created');
    }

    // Create a demo store for the seller user
    const foodCategory = await prisma.category.findFirst({ where: { name: 'Food & Restaurants' } });
    if (foodCategory) {
        await prisma.store.upsert({
            where: { slug: 'demo-shop-1' },
            update: {},
            create: {
                sellerId: sellerUser.id,
                categoryId: foodCategory.id,
                name: 'Demo Shop',
                nameAr: 'متجر تجريبي',
                slug: 'demo-shop-1',
                description: 'A demo store for testing',
                address: '123 Main St',
                city: 'Algiers',
                wilaya: 'Alger',
                phone: '0550000002',
                isActive: true,
                isVerified: true,
            },
        });
        console.log('✅ Demo store created');
    }

    console.log('🎉 Seeding complete!');
    console.log('');
    console.log('Demo accounts:');
    console.log('  Admin:    admin@myworld.dz / admin123');
    console.log('  Seller:   seller@myworld.dz / seller123');
    console.log('  Driver:   driver@myworld.dz / driver123');
    console.log('  Customer: customer@myworld.dz / customer123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
