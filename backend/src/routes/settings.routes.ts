import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

const DEFAULT_SETTINGS = {
    siteName: 'My World',
    maintenanceMode: false,
    globalCommission: 10,
    enableRegistration: true,
    supportEmail: 'support@myworld.dz',
};

// ============================================
// GET SETTINGS (Public for read, Admin for full)
// ============================================
router.get('/', async (req, res) => {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'site_config' }
        });

        if (!setting) {
            // Return defaults if no settings exist
            return res.json({
                success: true,
                data: DEFAULT_SETTINGS
            });
        }

        const config = JSON.parse(setting.value);
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings'
        });
    }
});

// ============================================
// UPDATE SETTINGS (Admin only)
// ============================================
router.put(
    '/',
    authenticate,
    authorize('ADMIN'),
    async (req, res) => {
        try {
            const { siteName, maintenanceMode, globalCommission, enableRegistration, supportEmail } = req.body;

            const newSettings = {
                siteName: siteName ?? DEFAULT_SETTINGS.siteName,
                maintenanceMode: maintenanceMode ?? DEFAULT_SETTINGS.maintenanceMode,
                globalCommission: globalCommission ?? DEFAULT_SETTINGS.globalCommission,
                enableRegistration: enableRegistration ?? DEFAULT_SETTINGS.enableRegistration,
                supportEmail: supportEmail ?? DEFAULT_SETTINGS.supportEmail,
            };

            const setting = await prisma.systemSetting.upsert({
                where: { key: 'site_config' },
                update: {
                    value: JSON.stringify(newSettings),
                    updatedBy: (req as any).user?.id
                },
                create: {
                    key: 'site_config',
                    value: JSON.stringify(newSettings),
                    updatedBy: (req as any).user?.id
                }
            });

            res.json({
                success: true,
                message: 'تم حفظ الإعدادات بنجاح',
                data: JSON.parse(setting.value)
            });
        } catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update settings'
            });
        }
    }
);

export default router;
