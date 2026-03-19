import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Get all subscriptions (for seller's gym)
router.get('/', authenticate, async (req: any, res) => {
    try {
        const subscriptions = await prisma.subscription.findMany({
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true,
                        phone: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: subscriptions,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Create subscription
router.post('/', authenticate, async (req: any, res) => {
    try {
        const { userId, name, price, duration, type = 'GYM' } = req.body;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);

        // Generate QR code (simple unique ID for now)
        const qrCode = `GYM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const subscription = await prisma.subscription.create({
            data: {
                userId,
                name,
                price,
                duration,
                type,
                startDate,
                endDate,
                qrCode,
                status: 'ACTIVE',
            },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true,
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: subscription,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get subscription by QR code (for gym entry verification)
router.get('/verify/:qrCode', async (req, res) => {
    try {
        const { qrCode } = req.params;

        const subscription = await prisma.subscription.findFirst({
            where: { qrCode },
            include: {
                user: {
                    select: {
                        fullName: true,
                        avatar: true,
                    }
                }
            }
        });

        if (!subscription) {
            return res.status(404).json({ success: false, error: 'Subscription not found' });
        }

        // Check if expired
        const now = new Date();
        const isExpired = new Date(subscription.endDate) < now;

        if (isExpired && subscription.status === 'ACTIVE') {
            // Auto-update status
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: 'EXPIRED' }
            });
            subscription.status = 'EXPIRED';
        }

        res.json({
            success: true,
            data: {
                ...subscription,
                isValid: subscription.status === 'ACTIVE' && !isExpired,
                daysRemaining: Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Renew subscription
router.post('/:id/renew', authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { duration } = req.body;

        const subscription = await prisma.subscription.findUnique({
            where: { id }
        });

        if (!subscription) {
            return res.status(404).json({ success: false, error: 'Subscription not found' });
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (duration || subscription.duration));

        const renewed = await prisma.subscription.update({
            where: { id },
            data: {
                startDate,
                endDate,
                status: 'ACTIVE',
            }
        });

        res.json({
            success: true,
            data: renewed,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

export default router;
