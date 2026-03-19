import React, { createContext, useState, useContext } from 'react';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    storeId: string;
    storeName: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: any, store: any) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    total: number;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);

    const addToCart = (product: any, store: any) => {
        setItems(current => {
            const existing = current.find(item => item.id === product.id);
            if (existing) {
                return current.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...current, {
                id: product.id,
                name: product.nameAr || product.name,
                price: product.salePrice || product.price,
                quantity: 1,
                storeId: store.id,
                storeName: store.nameAr || store.name,
            }];
        });
    };

    const removeFromCart = (productId: string) => {
        setItems(current => current.filter(item => item.id !== productId));
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
