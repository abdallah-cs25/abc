'use client';

import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import '../i18n'; // Import to initialize

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const languages = [
        { code: 'ar', label: '🇸🇦 العربية' },
        { code: 'en', label: '🇺🇸 English' },
        { code: 'fr', label: '🇫🇷 Français' },
    ];

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;
    };

    return (
        <div className="flex gap-2">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`px-3 py-1 rounded-lg text-sm transition ${i18n.language === lang.code
                            ? 'bg-amber-500 text-white font-bold'
                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
}
