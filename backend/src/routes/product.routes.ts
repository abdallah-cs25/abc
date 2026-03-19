import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// GET PRODUCTS (Public - with filters)
// ============================================
router.get('/', async (req, res) => {
    try {
        const {
            storeId,
            categoryId,
            search,
            minPrice,
            maxPrice,
            inStock,
            featured,
            page = 1,
            limit = 20,
            sortBy = 'createdAt'
        } = req.query;

        const where: any = { isActive: true };

        if (storeId) where.storeId = storeId;
        if (categoryId) where.categoryId = categoryId;
        if (featured === 'true') where.isFeatured = true;
        if (inStock === 'true') where.stock = { gt: 0 };

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { nameAr: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice as string);
            if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
        }

        const skip = (Number(page) - 1) * Number(limit);

        let orderBy: any = { createdAt: 'desc' };
        if (sortBy === 'price_asc') orderBy = { price: 'asc' };
        if (sortBy === 'price_desc') orderBy = { price: 'desc' };
        if (sortBy === 'name') orderBy = { name: 'asc' };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    store: {
                        select: { id: true, name: true, nameAr: true, logo: true }
                    },
                    category: {
                        select: { id: true, name: true, nameAr: true }
                    }
                },
                orderBy,
                skip,
                take: Number(limit)
            }),
            prisma.product.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            messageAr: 'فشل في جلب المنتجات'
        });
    }
});

// ============================================
// GET SINGLE PRODUCT
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                        logo: true,
                        address: true,
                        phone: true
                    }
                },
                category: true
            }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                messageAr: 'المنتج غير موجود'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
            messageAr: 'فشل في جلب المنتج'
        });
    }
});

// ============================================
// CREATE PRODUCT (Store Owner/Manager)
// ============================================
router.post(
    '/',
    authenticate,
    [
        body('storeId').notEmpty().withMessage('Store ID is required'),
        body('name').notEmpty().withMessage('Product name is required'),
        body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
        body('categoryId').notEmpty().withMessage('Category is required')
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
                storeId,
                categoryId,
                name,
                nameAr,
                description,
                price,
                salePrice,
                stock = 0,
                sku,
                images = [],
                attributes,
                isFeatured = false
            } = req.body;

            // Check store ownership/management
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
            const isManager = store.managers.some(m => m.userId === req.user!.id && m.canEditProducts);
            const isAdmin = req.user!.role === 'ADMIN';

            if (!isOwner && !isManager && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to add products to this store',
                    messageAr: 'ليس لديك صلاحية لإضافة منتجات لهذا المتجر'
                });
            }

            const product = await prisma.product.create({
                data: {
                    storeId,
                    categoryId,
                    name,
                    nameAr,
                    description,
                    price: parseFloat(price),
                    salePrice: salePrice ? parseFloat(salePrice) : null,
                    stock: parseInt(stock),
                    sku,
                    images,
                    attributes: attributes ? JSON.stringify(attributes) : null,
                    isFeatured
                },
                include: {
                    store: { select: { id: true, name: true } },
                    category: { select: { id: true, name: true } }
                }
            });

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                messageAr: 'تم إنشاء المنتج بنجاح',
                data: product
            });
        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create product',
                messageAr: 'فشل في إنشاء المنتج'
            });
        }
    }
);

// ============================================
// UPDATE PRODUCT
// ============================================
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                store: {
                    include: { managers: true }
                }
            }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                messageAr: 'المنتج غير موجود'
            });
        }

        const isOwner = product.store.sellerId === req.user!.id;
        const isManager = product.store.managers.some(m => m.userId === req.user!.id && m.canEditProducts);
        const isAdmin = req.user!.role === 'ADMIN';

        if (!isOwner && !isManager && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this product',
                messageAr: 'ليس لديك صلاحية لتحديث هذا المنتج'
            });
        }

        const updateData: any = {};
        const allowedFields = [
            'name', 'nameAr', 'description', 'price', 'salePrice',
            'stock', 'sku', 'images', 'attributes', 'isFeatured', 'isActive', 'categoryId'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'price' || field === 'salePrice') {
                    updateData[field] = parseFloat(req.body[field]);
                } else if (field === 'stock') {
                    updateData[field] = parseInt(req.body[field]);
                } else if (field === 'attributes') {
                    updateData[field] = JSON.stringify(req.body[field]);
                } else {
                    updateData[field] = req.body[field];
                }
            }
        });

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                store: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } }
            }
        });

        res.json({
            success: true,
            message: 'Product updated successfully',
            messageAr: 'تم تحديث المنتج بنجاح',
            data: updatedProduct
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product',
            messageAr: 'فشل في تحديث المنتج'
        });
    }
});

// ============================================
// DELETE PRODUCT (Soft delete)
// ============================================
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                store: {
                    include: { managers: true }
                }
            }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                messageAr: 'المنتج غير موجود'
            });
        }

        const isOwner = product.store.sellerId === req.user!.id;
        const isManager = product.store.managers.some(m => m.userId === req.user!.id && m.canEditProducts);
        const isAdmin = req.user!.role === 'ADMIN';

        if (!isOwner && !isManager && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this product',
                messageAr: 'ليس لديك صلاحية لحذف هذا المنتج'
            });
        }

        // Soft delete
        await prisma.product.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({
            success: true,
            message: 'Product deleted successfully',
            messageAr: 'تم حذف المنتج بنجاح'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
            messageAr: 'فشل في حذف المنتج'
        });
    }
});

// ============================================
// UPDATE STOCK
// ============================================
router.patch('/:id/stock', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { stock, operation = 'set' } = req.body;

        if (stock === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Stock value is required',
                messageAr: 'قيمة المخزون مطلوبة'
            });
        }

        const product = await prisma.product.findUnique({
            where: { id },
            include: { store: { include: { managers: true } } }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                messageAr: 'المنتج غير موجود'
            });
        }

        const isOwner = product.store.sellerId === req.user!.id;
        const isManager = product.store.managers.some(m => m.userId === req.user!.id);
        const isAdmin = req.user!.role === 'ADMIN';

        if (!isOwner && !isManager && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission',
                messageAr: 'ليس لديك صلاحية'
            });
        }

        let newStock: number;
        if (operation === 'add') {
            newStock = product.stock + parseInt(stock);
        } else if (operation === 'subtract') {
            newStock = Math.max(0, product.stock - parseInt(stock));
        } else {
            newStock = parseInt(stock);
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { stock: newStock }
        });

        res.json({
            success: true,
            message: 'Stock updated successfully',
            messageAr: 'تم تحديث المخزون بنجاح',
            data: { stock: updatedProduct.stock }
        });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update stock',
            messageAr: 'فشل في تحديث المخزون'
        });
    }
});

export default router;
