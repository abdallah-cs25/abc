import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// GET SALES ANALYTICS (Admin)
// ============================================
router.get('/sales', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { range = '30days' } = req.query; // 7days, 30days, year

        let startDate = new Date();
        if (range === '7days') startDate.setDate(startDate.getDate() - 7);
        else if (range === '30days') startDate.setDate(startDate.getDate() - 30);
        else if (range === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                status: { not: 'CANCELLED' }
            },
            select: {
                createdAt: true,
                total: true
            },
            orderBy: { createdAt: 'asc' }
        });

        // Group by date
        const salesByDate: Record<string, number> = {};
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            salesByDate[date] = (salesByDate[date] || 0) + order.total;
        });

        const chartData = Object.keys(salesByDate).map(date => ({
            date,
            sales: salesByDate[date]
        }));

        res.json({
            success: true,
            data: chartData
        });
    } catch (error) {
        console.error('Get sales analytics error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
});

// ============================================
// GET TOP PRODUCTS (Admin)
// ============================================
router.get('/top-products', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const topProducts = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true, totalPrice: true },
            orderBy: { _sum: { totalPrice: 'desc' } },
            take: 5
        });

        const productDetails = await prisma.product.findMany({
            where: { id: { in: topProducts.map(p => p.productId) } },
            select: { id: true, name: true, nameAr: true }
        });

        const data = topProducts.map(item => {
            const product = productDetails.find(p => p.id === item.productId);
            return {
                name: product?.nameAr || product?.name || 'Unknown',
                sales: item._sum.totalPrice || 0,
                quantity: item._sum.quantity || 0
            };
        });

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get top products error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch top products' });
    }
});

// ============================================
// GET TOP STORES (Admin)
// ============================================
router.get('/top-stores', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const topStores = await prisma.orderItem.groupBy({
            by: ['storeId'],
            _sum: { totalPrice: true },
            orderBy: { _sum: { totalPrice: 'desc' } },
            take: 5
        });

        const storeDetails = await prisma.store.findMany({
            where: { id: { in: topStores.map(s => s.storeId) } },
            select: { id: true, name: true, nameAr: true }
        });

        const data = topStores.map(item => {
            const store = storeDetails.find(s => s.id === item.storeId);
            return {
                name: store?.nameAr || store?.name || 'Unknown',
                revenue: item._sum.totalPrice || 0
            };
        });

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get top stores error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch top stores' });
    }
});

export default router;
