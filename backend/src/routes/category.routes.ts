import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// GET ALL CATEGORIES
// ============================================
router.get('/', async (req, res) => {
    try {
        const { activeOnly = 'true' } = req.query;

        const where = activeOnly === 'true' ? { isActive: true } : {};

        const categories = await prisma.category.findMany({
            where,
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { stores: true, products: true }
                }
            }
        });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            messageAr: 'فشل في جلب الفئات'
        });
    }
});

// ============================================
// GET SINGLE CATEGORY
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const category = await prisma.category.findUnique({
            where: { id: req.params.id },
            include: {
                stores: {
                    where: { isActive: true },
                    take: 10
                },
                _count: {
                    select: { stores: true, products: true }
                }
            }
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
                messageAr: 'الفئة غير موجودة'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category',
            messageAr: 'فشل في جلب الفئة'
        });
    }
});

// ============================================
// CREATE CATEGORY (Admin only)
// ============================================
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { name, nameAr, nameFr, icon, description, sortOrder = 0 } = req.body;

        if (!name || !nameAr || !nameFr) {
            return res.status(400).json({
                success: false,
                message: 'Name in all languages is required',
                messageAr: 'الاسم بجميع اللغات مطلوب'
            });
        }

        const category = await prisma.category.create({
            data: {
                name,
                nameAr,
                nameFr,
                icon,
                description,
                sortOrder
            }
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            messageAr: 'تم إنشاء الفئة بنجاح',
            data: category
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create category',
            messageAr: 'فشل في إنشاء الفئة'
        });
    }
});

// ============================================
// UPDATE CATEGORY (Admin only)
// ============================================
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, nameAr, nameFr, icon, description, sortOrder, isActive } = req.body;

        const category = await prisma.category.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(nameAr !== undefined && { nameAr }),
                ...(nameFr !== undefined && { nameFr }),
                ...(icon !== undefined && { icon }),
                ...(description !== undefined && { description }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json({
            success: true,
            message: 'Category updated successfully',
            messageAr: 'تم تحديث الفئة بنجاح',
            data: category
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category',
            messageAr: 'فشل في تحديث الفئة'
        });
    }
});

// ============================================
// DELETE CATEGORY (Admin only)
// ============================================
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category has stores or products
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: { select: { stores: true, products: true } }
            }
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
                messageAr: 'الفئة غير موجودة'
            });
        }

        if (category._count.stores > 0 || category._count.products > 0) {
            // Soft delete
            await prisma.category.update({
                where: { id },
                data: { isActive: false }
            });
        } else {
            // Hard delete if no dependencies
            await prisma.category.delete({ where: { id } });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully',
            messageAr: 'تم حذف الفئة بنجاح'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category',
            messageAr: 'فشل في حذف الفئة'
        });
    }
});

export default router;
