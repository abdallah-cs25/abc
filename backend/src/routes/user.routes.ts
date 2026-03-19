import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// GET ALL USERS (Admin only)
// ============================================
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { role, search, isActive, page = 1, limit = 50 } = req.query;

        const where: any = {};

        if (role) where.role = role;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        if (search) {
            where.OR = [
                { fullName: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
                { phone: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    fullName: true,
                    role: true,
                    avatar: true,
                    isActive: true,
                    isVerified: true,
                    createdAt: true,
                    driverStatus: true,
                    _count: {
                        select: { stores: true, orders: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            messageAr: 'فشل في جلب المستخدمين'
        });
    }
});

// ============================================
// GET SINGLE USER (Admin or self)
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Only admin or the user themselves can view
        if (req.user!.id !== id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
                messageAr: 'تم رفض الوصول'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                phone: true,
                fullName: true,
                role: true,
                avatar: true,
                language: true,
                latitude: true,
                longitude: true,
                address: true,
                isActive: true,
                isVerified: true,
                driverStatus: true,
                createdAt: true,
                stores: {
                    select: { id: true, name: true, logo: true }
                },
                _count: {
                    select: { orders: true, deliveries: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                messageAr: 'المستخدم غير موجود'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            messageAr: 'فشل في جلب المستخدم'
        });
    }
});

// ============================================
// UPDATE USER (Admin)
// ============================================
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { role, isActive, isVerified } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(role !== undefined && { role }),
                ...(isActive !== undefined && { isActive }),
                ...(isVerified !== undefined && { isVerified })
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                isVerified: true
            }
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            messageAr: 'تم تحديث المستخدم بنجاح',
            data: user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            messageAr: 'فشل في تحديث المستخدم'
        });
    }
});

// ============================================
// DELETE USER (Admin - soft delete)
// ============================================
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.user.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({
            success: true,
            message: 'User deleted successfully',
            messageAr: 'تم حذف المستخدم بنجاح'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            messageAr: 'فشل في حذف المستخدم'
        });
    }
});

// ============================================
// GET USER LOYALTY POINTS
// ============================================
router.get('/:id/loyalty', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user!.id !== id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
                messageAr: 'تم رفض الوصول'
            });
        }

        const points = await prisma.loyaltyPoint.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' }
        });

        const totalPoints = points.reduce((sum, p) => sum + p.points, 0);

        res.json({
            success: true,
            data: {
                totalPoints,
                history: points
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

// ============================================
// GET AVAILABLE DRIVERS (Admin/Store)
// ============================================
router.get('/drivers/available', authenticate, async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        const drivers = await prisma.user.findMany({
            where: {
                role: 'DRIVER',
                driverStatus: 'AVAILABLE',
                isActive: true
            },
            select: {
                id: true,
                fullName: true,
                phone: true,
                avatar: true,
                latitude: true,
                longitude: true,
                vehicleType: true
            }
        });

        // Calculate distance if coordinates provided
        let result = drivers;
        if (latitude && longitude) {
            result = drivers.map(driver => {
                if (driver.latitude && driver.longitude) {
                    const distance = calculateDistance(
                        Number(latitude),
                        Number(longitude),
                        driver.latitude,
                        driver.longitude
                    );
                    return { ...driver, distance };
                }
                return { ...driver, distance: Infinity };
            }).sort((a, b) => a.distance - b.distance);
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get available drivers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch drivers',
            messageAr: 'فشل في جلب السائقين'
        });
    }
});

// Helper function
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}

export default router;
