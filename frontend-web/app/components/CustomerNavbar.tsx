'use client';

import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { ShoppingCart, User, Home, Map } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function CustomerNavbar() {
    const { itemCount } = useCart();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ? 'text-amber-500' : 'text-gray-400 hover:text-white';

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#1e293b] border-t border-white/10 p-4 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <Link href="/customer" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                        <span className="font-bold text-white">MW</span>
                    </div>
                    <span className="hidden md:block font-bold text-white text-lg">My World</span>
                </Link>

                <div className="flex items-center gap-8">
                    <Link href="/customer" className={isActive('/customer')}>
                        <Home size={24} />
                    </Link>
                    <Link href="/customer/map" className={isActive('/customer/map')}>
                        <Map size={24} />
                    </Link>
                    <Link href="/customer/cart" className={`relative ${isActive('/customer/cart')}`}>
                        <ShoppingCart size={24} />
                        {itemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                {itemCount}
                            </span>
                        )}
                    </Link>
                    <Link href="/customer/profile" className={isActive('/customer/profile')}>
                        <User size={24} />
                    </Link>
                </div>
            </div>
        </nav>
    );
}
