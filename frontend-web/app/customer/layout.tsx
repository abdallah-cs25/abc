'use client';

import { CartProvider } from '../context/CartContext';
import CustomerNavbar from '../components/CustomerNavbar';

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CartProvider>
            <div className="min-h-screen bg-[#0f172a] pb-20 md:pb-0 md:pt-20">
                <CustomerNavbar />
                {children}
            </div>
        </CartProvider>
    );
}
