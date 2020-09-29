import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      await AsyncStorage.clear();
      const productsStorage = await AsyncStorage.getItem('@GoMarket:products');

      if (productsStorage) setProducts([...JSON.parse(productsStorage)]);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const quantity = 1;
      const { id, title, image_url, price } = product;

      const productIndex = products.findIndex(prod => prod.id === id);

      if (productIndex >= 0) {
        const newQtd = products[productIndex].quantity + 1;
        const newProducts = products;
        newProducts.splice(productIndex, 1);
        setProducts([
          ...newProducts,
          { id, title, image_url, price, quantity: newQtd },
        ]);

        await AsyncStorage.setItem(
          '@GoMarket:products',
          JSON.stringify(products),
        );

        return;
      }

      setProducts(prod => [...prod, { id, title, image_url, price, quantity }]);

      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(prod => prod.id === id);
      if (productIndex >= 0) {
        const newQtd = products[productIndex].quantity + 1;
        const newProducts = products;
        newProducts[productIndex].quantity = newQtd;
        setProducts([...newProducts]);

        await AsyncStorage.setItem(
          '@GoMarket:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(prod => prod.id === id);
      if (productIndex >= 0) {
        const newQtd = products[productIndex].quantity - 1;
        const newProducts = products;
        newProducts[productIndex].quantity = newQtd;
        setProducts([...newProducts]);

        await AsyncStorage.setItem(
          '@GoMarket:products',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
