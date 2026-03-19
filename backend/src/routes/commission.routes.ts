import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// GET COMMISSION SETTINGS (Admin)
// ============================================
router.get('/settings', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const settings = await prisma.commissionSettings.findFirst({
            where: { isActive: true }
        });

        res.json({
            success: true,
            data: settings || { percentage: 10, minAmount: 0, maxAmount: null }
        });
    } catch (error) {
        console.error('Get commission settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings',
            messageAr: 'فشل في جلب الإعدادات'
        });
    }
});

// ============================================
// UPDATE COMMISSION SETTINGS (Admin)
// ============================================
router.put('/settings', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { percentage, minAmount, maxAmount } = req.body;

        if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Percentage must be between 0 and 100',
                messageAr: 'يجب أن تكون النسبة بين 0 و 100'
            });
        }

        // Deactivate current settings
        await prisma.commissionSettings.updateMany({
            where: { isActive: true },
            data: { isActive: false }
        });

        // Create new settings
        const settings = await prisma.commissionSettings.create({
            data: {
                percentage: percentage ?? 10,
                minAmount: minAmount ?? 0,
                maxAmount: maxAmount ?? null,
                isActive: true
            }
        });

        res.json({
            success: true,
            message: 'Commission settings updated',
            messageAr: 'تم تحديث إعدادات العمولة',
            data: settings
        });
    } catch (error) {
        console.error('Update commission settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            messageAr: 'فشل في تحديث الإعدادات'
        });
    }
});

// ============================================
// GET COMMISSION REPORT (Admin)
// ============================================
router.get('/report', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { startDate, endDate, isPaid } = req.query;

        const where: any = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        if (isPaid !== undefined) {
            where.isPaid = isPaid === 'true';
        }

        const commissions = await prisma.commission.findMany({
            where,
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        createdAt: true,
                        customer: { select: { id: true, fullName: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate totals
        const totalOrderAmount = commissions.reduce((sum, c) => sum + c.orderTotal, 0);
        const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        const totalSellerPayout = commissions.reduce((sum, c) => sum + c.sellerPayout, 0);
        const paidCommission = commissions.filter(c => c.isPaid).reduce((sum, c) => sum + c.commissionAmount, 0);
        const unpaidCommission = totalCommission - paidCommission;

        res.json({
            success: true,
            data: {
                summary: {
                    totalOrders: commissions.length,
                    totalOrderAmount,
                    totalCommission,
                    totalSellerPayout,
                    paidCommission,
                    unpaidCommission
                },
                commissions
            }
        });
    } catch (error) {
        console.error('Get commission report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report',
            messageAr: 'فشل في إنشاء التقرير'
        });
    }
});

// ============================================
// GET DASHBOARD STATISTICS (Admin)
// ============================================
router.get('/dashboard', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        // Get various counts and sums
        const [
            totalUsers,
            totalStores,
            totalProducts,
            totalOrders,
            todayOrders,
            monthlyRevenue,
            monthlyCommission,
            pendingOrders,
            activeDrivers
        ] = await Promise.all([
            prisma.user.count({ where: { isActive: true } }),
            prisma.store.count({ where: { isActive: true } }),
            prisma.product.count({ where: { isActive: true } }),
            prisma.order.count(),
            prisma.order.count({ where: { createdAt: { gte: today } } }),
            prisma.order.aggregate({
                where: { createdAt: { gte: thisMonth }, status: 'DELIVERED' },
                _sum: { total: true }
            }),
            prisma.commission.aggregate({
                where: { createdAt: { gte: thisMonth } },
                _sum: { commissionAmount: true }
            }),
            prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } } }),
            prisma.user.count({ where: { role: 'DRIVER', driverStatus: 'AVAILABLE' } })
        ]);

        // Get recent orders
        const recentOrders = await prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { fullName: true } },
                _count: { select: { items: true } }
            }
        });

        // Orders by status
        const ordersByStatus = await prisma.order.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        res.json({
            success: true,
            data: {
                counts: {
                    users: totalUsers,
                    stores: totalStores,
                    products: totalProducts,
                    orders: totalOrders,
                    todayOrders,
                    pendingOrders,
                    activeDrivers
                },
                revenue: {
                    monthly: monthlyRevenue._sum.total || 0,
                    monthlyCommission: monthlyCommission._sum.commissionAmount || 0
                },
                ordersByStatus: ordersByStatus.map(s => ({
                    status: s.status,
                    count: s._count.id
                })),
                recentOrders
            }
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            messageAr: 'فشل في جلب بيانات لوحة التحكم'
        });
    }
});

// ============================================
// GET SELLER COMMISSION REPORT
// ============================================
router.get('/seller/:sellerId', authenticate, async (req, res) => {
    try {
        const { sellerId } = req.params;

        // Verify access (seller themselves or admin)
        if (req.user!.id !== sellerId && req.user!.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
                messageAr: 'تم رفض الوصول'
            });
        }

        // Get seller's stores
        const stores = await prisma.store.findMany({
            where: { sellerId },
            select: { id: true }
        });

        const storeIds = stores.map(s => s.id);

        // Get orders for seller's stores
        const orders = await prisma.order.findMany({
            where: {
                items: { some: { storeId: { in: storeIds } } },
                status: 'DELIVERED'
            },
            include: {
                items: {
                    where: { storeId: { in: storeIds } }
                },
                commission: true
            }
        });

        // Calculate seller-specific amounts
        let totalSales = 0;
        let totalCommissionPaid = 0;
        let totalPayout = 0;

        orders.forEach(order => {
            const sellerItems = order.items;
            const sellerOrderTotal = sellerItems.reduce((sum, item) => sum + item.totalPrice, 0);
            totalSales += sellerOrderTotal;

            if (order.commission) {
                // Proportional commission for this seller
                const proportion = sellerOrderTotal / order.commission.orderTotal;
                const sellerCommission = order.commission.commissionAmount * proportion;
                totalCommissionPaid += sellerCommission;
                totalPayout += sellerOrderTotal - sellerCommission;
            }
        });

        res.json({
            success: true,
            data: {
                totalOrders: orders.length,
                totalSales,
                totalCommissionPaid,
                totalPayout,
                orders
            }
        });
    } catch (error) {
        console.error('Get seller commission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch commission data',
            messageAr: 'فشل في جلب بيانات العمولة'
        });
    }
});


// ============================================
// MARK COMMISSION AS PAID (Admin)
// ============================================
router.patch('/:id/pay', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        const commission = await prisma.commission.update({
            where: { id },
            data: {
                isPaid: true,
                paidAt: new Date()
            },
            include: {
                order: {
                    select: { orderNumber: true }
                }
            }
        });

        res.json({
            success: true,
            message: 'Commission marked as paid',
            messageAr: 'تم تحديد العمولة كمدفوعة',
            data: commission
        });
    } catch (error) {
        console.error('Mark commission paid error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update commission',
            messageAr: 'فشل في تحديث العمولة'
        });
    }
});

export default router;
