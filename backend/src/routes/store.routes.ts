import { Router } from 'express';
import { body, validationResult, query } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// GET ALL STORES (Public - with filters)
// ============================================
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            categoryId,
            city,
            search,
            latitude,
            longitude,
            radius = 10, // km
            page = 1,
            limit = 20,
            sortBy = 'createdAt'
        } = req.query;

        const where: any = {
            isActive: true
        };

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (city) {
            where.city = { contains: city as string, mode: 'insensitive' };
        }

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { nameAr: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [stores, total] = await Promise.all([
            prisma.store.findMany({
                where,
                include: {
                    category: {
                        select: { id: true, name: true, nameAr: true, icon: true }
                    },
                    _count: {
                        select: { products: true }
                    }
                },
                orderBy: sortBy === 'rating' ? { rating: 'desc' } : { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.store.count({ where })
        ]);

        // If coordinates provided, calculate distance and filter
        let storesWithDistance = stores;
        if (latitude && longitude) {
            storesWithDistance = stores.map(store => {
                const distance = calculateDistance(
                    Number(latitude),
                    Number(longitude),
                    store.latitude,
                    store.longitude
                );
                return { ...store, distance };
            }).filter(store => store.distance <= Number(radius))
                .sort((a, b) => a.distance - b.distance);
        }

        res.json({
            success: true,
            data: {
                stores: storesWithDistance,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get stores error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stores',
            messageAr: 'فشل في جلب المتاجر'
        });
    }
});

// ============================================
// GET NEARBY STORES (GPS-based)
// ============================================
router.get('/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radius = 5, categoryId } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required',
                messageAr: 'خط العرض وخط الطول مطلوبان'
            });
        }

        const where: any = { isActive: true };
        if (categoryId) {
            where.categoryId = categoryId;
        }

        const stores = await prisma.store.findMany({
            where,
            include: {
                category: {
                    select: { id: true, name: true, nameAr: true, icon: true }
                }
            }
        });

        // Calculate distance and filter
        const nearbyStores = stores
            .map(store => ({
                ...store,
                distance: calculateDistance(
                    Number(latitude),
                    Number(longitude),
                    store.latitude,
                    store.longitude
                )
            }))
            .filter(store => store.distance <= Number(radius))
            .sort((a, b) => a.distance - b.distance);

        res.json({
            success: true,
            data: nearbyStores
        });
    } catch (error) {
        console.error('Get nearby stores error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch nearby stores',
            messageAr: 'فشل في جلب المتاجر القريبة'
        });
    }
});

// ============================================
// GET SINGLE STORE
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const store = await prisma.store.findUnique({
            where: { id: req.params.id },
            include: {
                category: true,
                seller: {
                    select: { id: true, fullName: true, avatar: true }
                },
                products: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                    take: 20
                },
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Store not found',
                messageAr: 'المتجر غير موجود'
            });
        }

        res.json({
            success: true,
            data: store
        });
    } catch (error) {
        console.error('Get store error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch store',
            messageAr: 'فشل في جلب المتجر'
        });
    }
});

// ============================================
// CREATE STORE (Seller only)
// ============================================
router.post(
    '/',
    authenticate,
    authorize('SELLER', 'ADMIN'),
    [
        body('name').notEmpty().withMessage('Store name is required'),
        body('categoryId').notEmpty().withMessage('Category is required'),
        body('address').notEmpty().withMessage('Address is required'),
        body('city').notEmpty().withMessage('City is required'),
        body('latitude').isFloat().withMessage('Valid latitude is required'),
        body('longitude').isFloat().withMessage('Valid longitude is required')
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
                name,
                nameAr,
                description,
                logo,
                coverImage,
                categoryId,
                address,
                city,
                latitude,
                longitude,
                phone,
                email,
                workingHours
            } = req.body;

            const store = await prisma.store.create({
                data: {
                    sellerId: req.user!.id,
                    name,
                    nameAr,
                    description,
                    logo,
                    coverImage,
                    categoryId,
                    address,
                    city,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    phone,
                    email,
                    workingHours: workingHours ? JSON.stringify(workingHours) : null
                },
                include: {
                    category: true
                }
            });

            res.status(201).json({
                success: true,
                message: 'Store created successfully',
                messageAr: 'تم إنشاء المتجر بنجاح',
                data: store
            });
        } catch (error) {
            console.error('Create store error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create store',
                messageAr: 'فشل في إنشاء المتجر'
            });
        }
    }
);

// ============================================
// UPDATE STORE (Owner or Manager)
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership or manager status
        const store = await prisma.store.findUnique({
            where: { id },
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
        const isManager = store.managers.some(m => m.userId === req.user!.id);
        const isAdmin = req.user!.role === 'ADMIN';

        if (!isOwner && !isManager && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this store',
                messageAr: 'ليس لديك صلاحية لتحديث هذا المتجر'
            });
        }

        const updateData: any = {};
        const allowedFields = [
            'name', 'nameAr', 'description', 'logo', 'coverImage',
            'address', 'city', 'latitude', 'longitude', 'phone',
            'email', 'workingHours', 'isActive'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (updateData.workingHours) {
            updateData.workingHours = JSON.stringify(updateData.workingHours);
        }

        const updatedStore = await prisma.store.update({
            where: { id },
            data: updateData,
            include: { category: true }
        });

        res.json({
            success: true,
            message: 'Store updated successfully',
            messageAr: 'تم تحديث المتجر بنجاح',
            data: updatedStore
        });
    } catch (error) {
        console.error('Update store error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update store',
            messageAr: 'فشل في تحديث المتجر'
        });
    }
});

// ============================================
// GET SELLER'S STORES
// ============================================
router.get('/my/stores', authenticate, authorize('SELLER', 'ADMIN'), async (req, res) => {
    try {
        const stores = await prisma.store.findMany({
            where: { sellerId: req.user!.id },
            include: {
                category: true,
                _count: {
                    select: { products: true, orderItems: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: stores
        });
    } catch (error) {
        console.error('Get my stores error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your stores',
            messageAr: 'فشل في جلب متاجرك'
        });
    }
});

// ============================================
// ADD STORE MANAGER
// ============================================
router.post('/:id/managers', authenticate, authorize('SELLER', 'ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, canEditProducts = true, canManageOrders = true, canViewAnalytics = false } = req.body;

        const store = await prisma.store.findUnique({ where: { id } });

        if (!store || (store.sellerId !== req.user!.id && req.user!.role !== 'ADMIN')) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to add managers',
                messageAr: 'ليس لديك صلاحية لإضافة مديرين'
            });
        }

        const manager = await prisma.storeManager.create({
            data: {
                storeId: id,
                userId,
                canEditProducts,
                canManageOrders,
                canViewAnalytics
            },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: 'Manager added successfully',
            messageAr: 'تمت إضافة المدير بنجاح',
            data: manager
        });
    } catch (error) {
        console.error('Add manager error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add manager',
            messageAr: 'فشل في إضافة المدير'
        });
    }
});

// ============================================
// HELPER: Calculate distance between two points (Haversine formula)
// ============================================
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

export default router;
