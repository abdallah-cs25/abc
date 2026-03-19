import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// CREATE ORDER (Customer - Guest or Registered)
// ============================================
router.post(
    '/',
    optionalAuth,
    [
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('deliveryAddress').notEmpty().withMessage('Delivery address is required'),
        body('deliveryLatitude').isFloat().withMessage('Valid latitude is required'),
        body('deliveryLongitude').isFloat().withMessage('Valid longitude is required')
    ],
    async (req: any, res: any) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const {
                items,
                deliveryAddress,
                deliveryLatitude,
                deliveryLongitude,
                guestName,
                guestPhone,
                guestEmail,
                notes,
                deliveryFee = 0
            } = req.body;

            // If not authenticated, guest info is required
            if (!req.user && (!guestName || !guestPhone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Guest name and phone are required for guest checkout',
                    messageAr: 'اسم الضيف ورقم الهاتف مطلوبان للشراء كضيف'
                });
            }

            // Validate and get product details
            const productIds = items.map((item: any) => item.productId);
            const products = await prisma.product.findMany({
                where: { id: { in: productIds }, isActive: true },
                include: { store: true }
            });

            if (products.length !== productIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Some products are not available',
                    messageAr: 'بعض المنتجات غير متاحة'
                });
            }

            // Verify stock for all items first
            for (const item of items) {
                const product = products.find(p => p.id === item.productId);
                if (!product) continue;
                if (product.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for product: ${product.name}`,
                        messageAr: `المخزون غير كافٍ للمنتج: ${product.nameAr || product.name}`
                    });
                }
            }

            // Calculate order total
            let subtotal = 0;
            const orderItems = items.map((item: any) => {
                const product = products.find(p => p.id === item.productId)!;
                const unitPrice = product.salePrice || product.price;
                const totalPrice = unitPrice * item.quantity;
                subtotal += totalPrice;

                return {
                    productId: item.productId,
                    storeId: product.storeId,
                    quantity: item.quantity,
                    unitPrice,
                    totalPrice
                };
            });

            const total = subtotal + parseFloat(deliveryFee.toString());

            // TRANSACTION: Create Order & Deduct Stock
            const order = await prisma.$transaction(async (tx) => {
                // 1. Create Order
                const newOrder = await tx.order.create({
                    data: {
                        customerId: req.user?.id || null,
                        guestName: req.user ? null : guestName,
                        guestPhone: req.user ? null : guestPhone,
                        guestEmail: req.user ? null : guestEmail,
                        deliveryAddress,
                        deliveryLatitude: parseFloat(deliveryLatitude),
                        deliveryLongitude: parseFloat(deliveryLongitude),
                        subtotal,
                        deliveryFee: parseFloat(deliveryFee.toString()),
                        total,
                        notes,
                        items: {
                            create: orderItems
                        }
                    },
                    include: {
                        items: {
                            include: {
                                product: true,
                                store: { select: { id: true, name: true, nameAr: true } }
                            }
                        }
                    }
                });

                // 2. Deduct Stock
                for (const item of items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }

                return newOrder;
            });

            // Create delivery record
            await prisma.delivery.create({
                data: {
                    orderId: order.id
                }
            });

            // Calculate and create commission record
            const commissionSettings = await prisma.commissionSettings.findFirst({
                where: { isActive: true }
            });

            const commissionRate = commissionSettings?.percentage || 10;
            const commissionAmount = (subtotal * commissionRate) / 100;
            const sellerPayout = subtotal - commissionAmount;

            await prisma.commission.create({
                data: {
                    orderId: order.id,
                    orderTotal: subtotal,
                    commissionRate,
                    commissionAmount,
                    sellerPayout
                }
            });

            // Add loyalty points for registered users
            if (req.user) {
                const pointsEarned = Math.floor(total / 100); // 1 point per 100 DA
                if (pointsEarned > 0) {
                    await prisma.loyaltyPoint.create({
                        data: {
                            userId: req.user.id,
                            points: pointsEarned,
                            source: 'order',
                            orderId: order.id
                        }
                    });
                }
            }

            res.status(201).json({
                success: true,
                message: 'Order placed successfully',
                messageAr: 'تم تقديم الطلب بنجاح',
                data: {
                    order,
                    commission: {
                        rate: commissionRate,
                        amount: commissionAmount,
                        sellerPayout
                    }
                }
            });
        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create order',
                messageAr: 'فشل في إنشاء الطلب'
            });
        }
    }
);

// ============================================
// GET CUSTOMER'S ORDERS
// ============================================
router.get('/my', authenticate, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const where: any = { customerId: req.user!.id };
        if (status) where.status = status;

        const skip = (Number(page) - 1) * Number(limit);

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: {
                        include: {
                            product: { select: { id: true, name: true, nameAr: true, images: true } },
                            store: { select: { id: true, name: true, nameAr: true } }
                        }
                    },
                    delivery: {
                        include: {
                            driver: { select: { id: true, fullName: true, phone: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.order.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            messageAr: 'فشل في جلب الطلبات'
        });
    }
});

// ============================================
// GET STORE'S ORDERS (For managers/sellers)
// ============================================
router.get('/store/:storeId', authenticate, async (req, res) => {
    try {
        const { storeId } = req.params;
        const { status, page = 1, limit = 20 } = req.query;

        // Check permission
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            include: { managers: true }
        });

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found',
                messageAr: 'المتجر غير موجود'
            });
        }

        const isOwner = store.sellerId === req.user!.id;
        const isManager = store.managers.some(m => m.userId === req.user!.id && m.canManageOrders);
        const isAdmin = req.user!.role === 'ADMIN';

        if (!isOwner && !isManager && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
                messageAr: 'تم رفض الوصول'
            });
        }

        const where: any = {
            items: { some: { storeId } }
        };
        if (status) {
            where.items = { some: { storeId, status } };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const orders = await prisma.order.findMany({
            where,
            include: {
                customer: { select: { id: true, fullName: true, phone: true } },
                items: {
                    where: { storeId },
                    include: { product: true }
                },
                delivery: true
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit)
        });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get store orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            messageAr: 'فشل في جلب الطلبات'
        });
    }
});

// ============================================
// GET SINGLE ORDER
// ============================================
router.get('/:id', authenticate, async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                customer: { select: { id: true, fullName: true, phone: true, email: true } },
                items: {
                    include: {
                        product: true,
                        store: { select: { id: true, name: true, nameAr: true, phone: true, address: true } }
                    }
                },
                delivery: {
                    include: {
                        driver: { select: { id: true, fullName: true, phone: true } }
                    }
                },
                commission: true
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                messageAr: 'الطلب غير موجود'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order',
            messageAr: 'فشل في جلب الطلب'
        });
    }
});

// ============================================
// UPDATE ORDER STATUS
// ============================================
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
                messageAr: 'حالة غير صالحة'
            });
        }

        const order = await prisma.order.update({
            where: { id },
            data: { status },
            include: {
                items: true,
                delivery: true
            }
        });

        // Update all order items status too
        await prisma.orderItem.updateMany({
            where: { orderId: id },
            data: { status }
        });

        res.json({
            success: true,
            message: 'Order status updated',
            messageAr: 'تم تحديث حالة الطلب',
            data: order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
            messageAr: 'فشل في تحديث حالة الطلب'
        });
    }
});

// ============================================
// CANCEL ORDER
// ============================================
router.post('/:id/cancel', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await prisma.order.findUnique({
            where: { id },
            include: { delivery: true }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
                messageAr: 'الطلب غير موجود'
            });
        }

        // Only allow cancellation for pending/confirmed orders
        if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage',
                messageAr: 'لا يمكن إلغاء الطلب في هذه المرحلة'
            });
        }

        await prisma.order.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                notes: reason ? `${order.notes || ''}\nCancellation reason: ${reason}` : order.notes
            }
        });

        await prisma.orderItem.updateMany({
            where: { orderId: id },
            data: { status: 'CANCELLED' }
        });

        if (order.delivery) {
            await prisma.delivery.update({
                where: { orderId: id },
                data: { status: 'FAILED' }
            });
        }

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            messageAr: 'تم إلغاء الطلب بنجاح'
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order',
            messageAr: 'فشل في إلغاء الطلب'
        });
    }
});

// ============================================
// GET ALL ORDERS (Admin only)
// ============================================
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    customer: { select: { id: true, fullName: true, phone: true } },
                    items: { include: { store: { select: { id: true, name: true } } } },
                    delivery: { include: { driver: { select: { id: true, fullName: true } } } },
                    commission: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.order.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            messageAr: 'فشل في جلب الطلبات'
        });
    }
});

export default router;
