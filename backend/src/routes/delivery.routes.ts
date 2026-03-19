import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// GET PENDING DELIVERIES (For available drivers)
// ============================================
router.get('/pending', authenticate, authorize('DRIVER'), async (req, res) => {
    try {
        const { latitude, longitude, radius = 10 } = req.query;

        const deliveries = await prisma.delivery.findMany({
            where: {
                status: 'PENDING',
                driverId: null
            },
            include: {
                order: {
                    include: {
                        items: {
                            include: {
                                store: {
                                    select: { id: true, name: true, nameAr: true, address: true, latitude: true, longitude: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // If driver location provided, calculate distances and filter
        let result = deliveries;
        if (latitude && longitude) {
            result = deliveries.map(delivery => {
                // Get first store location for distance calculation
                const firstStore = delivery.order.items[0]?.store;
                const distance = firstStore ? calculateDistance(
                    Number(latitude),
                    Number(longitude),
                    firstStore.latitude,
                    firstStore.longitude
                ) : Infinity;
                return { ...delivery, distance };
            }).filter(d => d.distance <= Number(radius))
                .sort((a, b) => a.distance - b.distance);
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get pending deliveries error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch deliveries',
            messageAr: 'فشل في جلب التوصيلات'
        });
    }
});

// ============================================
// ACCEPT DELIVERY (Driver)
// ============================================
router.post('/:id/accept', authenticate, authorize('DRIVER'), async (req, res) => {
    try {
        const { id } = req.params;

        const delivery = await prisma.delivery.findUnique({
            where: { id }
        });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found',
                messageAr: 'التوصيل غير موجود'
            });
        }

        if (delivery.driverId) {
            return res.status(400).json({
                success: false,
                message: 'Delivery already assigned to another driver',
                messageAr: 'التوصيل مخصص بالفعل لسائق آخر'
            });
        }

        // Assign driver
        const updatedDelivery = await prisma.delivery.update({
            where: { id },
            data: {
                driverId: req.user!.id,
                status: 'ASSIGNED'
            },
            include: {
                order: {
                    include: {
                        customer: { select: { id: true, fullName: true, phone: true } },
                        items: {
                            include: {
                                product: true,
                                store: { select: { id: true, name: true, address: true, phone: true, latitude: true, longitude: true } }
                            }
                        }
                    }
                }
            }
        });

        // Update driver status
        await prisma.user.update({
            where: { id: req.user!.id },
            data: { driverStatus: 'BUSY' }
        });

        res.json({
            success: true,
            message: 'Delivery accepted',
            messageAr: 'تم قبول التوصيل',
            data: updatedDelivery
        });
    } catch (error) {
        console.error('Accept delivery error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept delivery',
            messageAr: 'فشل في قبول التوصيل'
        });
    }
});

// ============================================
// UPDATE DELIVERY STATUS (Driver)
// ============================================
router.patch('/:id/status', authenticate, authorize('DRIVER', 'ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, currentLatitude, currentLongitude } = req.body;

        const validStatuses = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
                messageAr: 'حالة غير صالحة'
            });
        }

        const delivery = await prisma.delivery.findUnique({
            where: { id }
        });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found',
                messageAr: 'التوصيل غير موجود'
            });
        }

        // Only assigned driver or admin can update
        if (delivery.driverId !== req.user!.id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
                messageAr: 'تم رفض الوصول'
            });
        }

        const updateData: any = { status };

        if (status === 'PICKED_UP') {
            updateData.pickupTime = new Date();
        }

        if (status === 'DELIVERED') {
            updateData.deliveryTime = new Date();
        }

        if (currentLatitude !== undefined && currentLongitude !== undefined) {
            updateData.currentLatitude = currentLatitude;
            updateData.currentLongitude = currentLongitude;
        }

        const updatedDelivery = await prisma.delivery.update({
            where: { id },
            data: updateData,
            include: { order: true }
        });

        // Update order status based on delivery status
        let orderStatus;
        if (status === 'PICKED_UP') orderStatus = 'PICKED_UP';
        if (status === 'DELIVERED') orderStatus = 'DELIVERED';

        if (orderStatus) {
            await prisma.order.update({
                where: { id: delivery.orderId },
                data: { status: orderStatus }
            });
        }

        // Free up driver when delivered
        if (status === 'DELIVERED' || status === 'FAILED') {
            await prisma.user.update({
                where: { id: req.user!.id },
                data: { driverStatus: 'AVAILABLE' }
            });
        }

        res.json({
            success: true,
            message: 'Delivery status updated',
            messageAr: 'تم تحديث حالة التوصيل',
            data: updatedDelivery
        });
    } catch (error) {
        console.error('Update delivery status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update delivery status',
            messageAr: 'فشل في تحديث حالة التوصيل'
        });
    }
});

// ============================================
// CONFIRM CASH COLLECTION (Driver)
// ============================================
router.post('/:id/collect-cash', authenticate, authorize('DRIVER'), async (req, res) => {
    try {
        const { id } = req.params;
        const { cashCollected, cashPaidToSeller } = req.body;

        if (cashCollected === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Cash collected amount is required',
                messageAr: 'مبلغ النقد المستلم مطلوب'
            });
        }

        const delivery = await prisma.delivery.findUnique({
            where: { id },
            include: { order: { include: { commission: true } } }
        });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found',
                messageAr: 'التوصيل غير موجود'
            });
        }

        if (delivery.driverId !== req.user!.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
                messageAr: 'تم رفض الوصول'
            });
        }

        // Calculate expected amounts
        const expectedTotal = delivery.order.total;
        const commission = delivery.order.commission;
        const sellerPayout = commission?.sellerPayout || expectedTotal;

        const updatedDelivery = await prisma.delivery.update({
            where: { id },
            data: {
                cashCollected: parseFloat(cashCollected),
                cashPaidToSeller: cashPaidToSeller ? parseFloat(cashPaidToSeller) : sellerPayout
            }
        });

        // Mark commission as collected
        if (commission) {
            await prisma.commission.update({
                where: { id: commission.id },
                data: {
                    isPaid: true,
                    paidAt: new Date()
                }
            });
        }

        res.json({
            success: true,
            message: 'Cash collection recorded',
            messageAr: 'تم تسجيل استلام النقد',
            data: {
                delivery: updatedDelivery,
                expectedTotal,
                commissionAmount: commission?.commissionAmount,
                sellerPayout
            }
        });
    } catch (error) {
        console.error('Collect cash error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record cash collection',
            messageAr: 'فشل في تسجيل استلام النقد'
        });
    }
});

// ============================================
// GET DRIVER'S DELIVERIES
// ============================================
router.get('/my', authenticate, authorize('DRIVER'), async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const where: any = { driverId: req.user!.id };
        if (status) where.status = status;

        const skip = (Number(page) - 1) * Number(limit);

        const [deliveries, total] = await Promise.all([
            prisma.delivery.findMany({
                where,
                include: {
                    order: {
                        include: {
                            customer: { select: { id: true, fullName: true, phone: true } },
                            items: {
                                include: {
                                    product: { select: { id: true, name: true, nameAr: true } },
                                    store: { select: { id: true, name: true, nameAr: true, address: true } }
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.delivery.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                deliveries,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get my deliveries error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch deliveries',
            messageAr: 'فشل في جلب التوصيلات'
        });
    }
});

// ============================================
// UPDATE DRIVER LOCATION
// ============================================
router.post('/location', authenticate, authorize('DRIVER'), async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required',
                messageAr: 'خط العرض وخط الطول مطلوبان'
            });
        }

        await prisma.user.update({
            where: { id: req.user!.id },
            data: {
                latitude,
                longitude
            }
        });

        // Update active delivery if any
        const activeDelivery = await prisma.delivery.findFirst({
            where: {
                driverId: req.user!.id,
                status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] }
            }
        });

        if (activeDelivery) {
            await prisma.delivery.update({
                where: { id: activeDelivery.id },
                data: {
                    currentLatitude: latitude,
                    currentLongitude: longitude
                }
            });
        }

        res.json({
            success: true,
            message: 'Location updated',
            messageAr: 'تم تحديث الموقع'
        });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update location',
            messageAr: 'فشل في تحديث الموقع'
        });
    }
});

// ============================================
// UPDATE DRIVER STATUS (Available/Busy/Offline)
// ============================================
router.patch('/status', authenticate, authorize('DRIVER'), async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['AVAILABLE', 'BUSY', 'OFFLINE'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
                messageAr: 'حالة غير صالحة'
            });
        }

        await prisma.user.update({
            where: { id: req.user!.id },
            data: { driverStatus: status }
        });

        res.json({
            success: true,
            message: 'Status updated',
            messageAr: 'تم تحديث الحالة',
            data: { status }
        });
    } catch (error) {
        console.error('Update driver status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            messageAr: 'فشل في تحديث الحالة'
        });
    }
});

// ============================================
// GET DRIVER EARNINGS
// ============================================
router.get('/earnings', authenticate, authorize('DRIVER'), async (req, res) => {
    try {
        const { period = 'today' } = req.query;

        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        }

        const deliveries = await prisma.delivery.findMany({
            where: {
                driverId: req.user!.id,
                status: 'DELIVERED',
                deliveryTime: { gte: startDate }
            },
            include: {
                order: { select: { total: true, deliveryFee: true } }
            }
        });

        const totalDeliveries = deliveries.length;
        const totalEarnings = deliveries.reduce((sum, d) => sum + (d.order.deliveryFee || 0), 0);
        const totalCashCollected = deliveries.reduce((sum, d) => sum + (d.cashCollected || 0), 0);

        res.json({
            success: true,
            data: {
                period,
                totalDeliveries,
                totalEarnings,
                totalCashCollected,
                deliveries
            }
        });
    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch earnings',
            messageAr: 'فشل في جلب الارباح'
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
