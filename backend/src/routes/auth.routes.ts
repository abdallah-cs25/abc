import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ============================================
// REGISTER
// ============================================
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('fullName').notEmpty().withMessage('Full name is required'),
        body('phone').optional().isMobilePhone('any'),
        body('role').optional().isIn(['CUSTOMER', 'DRIVER', 'SELLER']).withMessage('Invalid role')
    ],
    async (req: any, res: any) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { email, password, fullName, phone, role = 'CUSTOMER', language = 'ar' } = req.body;

            // Check if user exists
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email },
                        ...(phone ? [{ phone }] : [])
                    ]
                }
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email or phone already exists',
                    messageAr: 'يوجد مستخدم بهذا البريد الإلكتروني أو رقم الهاتف'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    fullName,
                    phone,
                    role,
                    language
                },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    phone: true,
                    role: true,
                    language: true,
                    createdAt: true
                }
            });

            // Generate JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'default-secret',
                { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
            );

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                messageAr: 'تم التسجيل بنجاح',
                data: {
                    user,
                    token
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Registration failed',
                messageAr: 'فشل التسجيل'
            });
        }
    }
);

// ============================================
// LOGIN
// ============================================
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').notEmpty().withMessage('Password is required')
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

            const { email, password } = req.body;

            // Find user
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                    messageAr: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Your account has been deactivated',
                    messageAr: 'تم إلغاء تنشيط حسابك'
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                    messageAr: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
                });
            }

            // Generate JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'default-secret',
                { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
            );

            // Return user without password
            const { password: _, ...userWithoutPassword } = user;

            res.json({
                success: true,
                message: 'Login successful',
                messageAr: 'تم تسجيل الدخول بنجاح',
                data: {
                    user: userWithoutPassword,
                    token
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed',
                messageAr: 'فشل تسجيل الدخول'
            });
        }
    }
);

// ============================================
// GET CURRENT USER PROFILE
// ============================================
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
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
                driverStatus: true,
                isVerified: true,
                createdAt: true,
                _count: {
                    select: {
                        orders: true,
                        stores: true
                    }
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
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            messageAr: 'فشل في جلب الملف الشخصي'
        });
    }
});

// ============================================
// UPDATE PROFILE
// ============================================
router.put('/me', authenticate, async (req, res) => {
    try {
        const { fullName, phone, language, address, latitude, longitude, avatar } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: req.user!.id },
            data: {
                ...(fullName && { fullName }),
                ...(phone && { phone }),
                ...(language && { language }),
                ...(address && { address }),
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
                ...(avatar && { avatar })
            },
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
                address: true
            }
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            messageAr: 'تم تحديث الملف الشخصي بنجاح',
            data: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            messageAr: 'فشل في تحديث الملف الشخصي'
        });
    }
});

// ============================================
// CHANGE PASSWORD
// ============================================
router.post('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current and new password are required',
                messageAr: 'كلمة المرور الحالية والجديدة مطلوبتان'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters',
                messageAr: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user!.id }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                messageAr: 'المستخدم غير موجود'
            });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
                messageAr: 'كلمة المرور الحالية غير صحيحة'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: req.user!.id },
            data: { password: hashedPassword }
        });

        res.json({
            success: true,
            message: 'Password changed successfully',
            messageAr: 'تم تغيير كلمة المرور بنجاح'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            messageAr: 'فشل في تغيير كلمة المرور'
        });
    }
});

export default router;
