import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// GET MY LOYALTY POINTS
// ============================================
router.get('/my', authenticate, async (req: any, res: any) => {
    try {
        const userId = req.user!.id;

        // Get all point transactions
        const pointsHistory = await prisma.loyaltyPoint.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                // order: {
                //     select: { orderNumber: true, total: true }
                // }
            }
        });

        // Calculate balance
        const totalPoints = pointsHistory.reduce((sum, p) => sum + p.points, 0);

        // Determine tier based on total points earned (lifetime)
        // You could also base it on current balance
        const lifetimePoints = pointsHistory
            .filter(p => p.points > 0)
            .reduce((sum, p) => sum + p.points, 0);

        let tier = 'Bronze';
        if (lifetimePoints >= 1000) tier = 'Silver';
        if (lifetimePoints >= 5000) tier = 'Gold';
        if (lifetimePoints >= 10000) tier = 'Platinum';

        res.json({
            success: true,
            data: {
                balance: totalPoints,
                tier,
                history: pointsHistory
            }
        });
    } catch (error) {
        console.error('Get loyalty points error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loyalty points',
            messageAr: 'فشل في جلب نقاط الولاء'
        });
    }
});

export default router;
