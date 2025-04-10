"use client";
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [isClient, setIsClient] = useState(false);
  const [cart, setCart] = useState([]);
  const [currency, setCurrency] = useState('INR');

  // Initialize from localStorage after component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
    
    // Initialize cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error('Error parsing cart from localStorage:', err);
        localStorage.removeItem('cart');
      }
    }
    
    // Initialize currency preference
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Store cart in localStorage whenever it changes
  useEffect(() => {
    if (isClient && cart.length >= 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isClient]);

  // Store currency preference
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('preferredCurrency', currency);
    }
  }, [currency, isClient]);

  // Calculate total items
  const itemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [cart]);

  // Calculate total price using useMemo for both currencies
  const totals = useMemo(() => {
    const rupees = cart.reduce((acc, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = item.quantity || 1;
      return acc + (price * quantity);
    }, 0);
    
    const dollars = cart.reduce((acc, item) => {
      const price = parseFloat(item.priceDollars) || 0;
      const quantity = item.quantity || 1;
      return acc + (price * quantity);
    }, 0);
    
    return {
      INR: rupees,
      USD: dollars,
      current: currency === 'INR' ? rupees : dollars
    };
  }, [cart, currency]);

  // Format price based on currency
  const formatPrice = useCallback((price, currencyType = currency) => {
    if (!price) return currencyType === 'INR' ? '₹0.00' : '$0.00';
    
    if (currencyType === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(price);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2
      }).format(price);
    }
  }, [currency]);

  // Toggle currency
  const toggleCurrency = useCallback(() => {
    setCurrency(prev => prev === 'INR' ? 'USD' : 'INR');
  }, []);

  // Check if item exists in cart (handles variants)
  const itemExists = useCallback((newItem) => {
    return cart.findIndex(item => {
      // If both have variants, check if variants match
      if (newItem.variant && item.variant) {
        return item.id === newItem.id && item.variant.id === newItem.variant.id;
      }
      // If neither has variants, compare product IDs
      if (!newItem.variant && !item.variant) {
        return item.id === newItem.id;
      }
      // One has variant, other doesn't - they're different
      return false;
    });
  }, [cart]);

  // Add item to cart
  const addToCart = useCallback((product) => {
    // Ensure product has all required fields
    const validatedProduct = {
      ...product,
      id: product.id,
      title: product.title || 'Product',
      price: parseFloat(product.price) || 0,
      priceDollars: parseFloat(product.priceDollars) || 0,
      quantity: product.quantity || 1,
      // Handle any missing fields with defaults
    };

    setCart(prevCart => {
      const existingItemIndex = itemExists(validatedProduct);

      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        const newCart = [...prevCart];
        const item = newCart[existingItemIndex];
        
        // Check if adding would exceed available stock
        const newQuantity = (item.quantity || 1) + (validatedProduct.quantity || 1);
        if (validatedProduct.maxStock && newQuantity > validatedProduct.maxStock) {
          toast.error(`Cannot add more than ${validatedProduct.maxStock} units of this item`);
          return prevCart;
        }
        
        newCart[existingItemIndex] = {
          ...item,
          quantity: newQuantity
        };
        
        toast.success("Cart updated successfully");
        return newCart;
      } else {
        // New item, add to cart
        toast.success(`${validatedProduct.title} added to cart`);
        return [...prevCart, validatedProduct];
      }
    });
  }, [itemExists]);

  // Remove item from cart
  const removeFromCart = useCallback((index) => {
    if (index < 0 || index >= cart.length) {
      console.error('Invalid index for removeFromCart:', index);
      return;
    }
    
    setCart(prevCart => {
      const newCart = [...prevCart];
      const removedItem = newCart[index];
      
      newCart.splice(index, 1);
      toast.info(`${removedItem.title || 'Item'} removed from cart`);
      
      return newCart;
    });
  }, [cart]);

  // Update item quantity
  const updateQuantity = useCallback((index, newQuantity) => {
    if (index < 0 || index >= cart.length) {
      console.error('Invalid index for updateQuantity:', index);
      return;
    }
    
    if (newQuantity < 1) {
      toast.info("Quantity must be at least 1");
      return;
    }

    setCart(prevCart => {
      const newCart = [...prevCart];
      const item = newCart[index];
      
      // Check if new quantity exceeds available stock
      if (item.maxStock && newQuantity > item.maxStock) {
        toast.error(`Cannot add more than ${item.maxStock} units of this item`);
        return prevCart;
      }
      
      newCart[index] = {
        ...item,
        quantity: newQuantity
      };
      
      return newCart;
    });
  }, [cart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
    if (isClient) {
      localStorage.removeItem('cart');
    }
    toast.info("Cart has been cleared");
  }, [isClient]);

  // Create a value object only once, until the dependencies change
  const cartContext = useMemo(() => ({
    cart,
    itemCount,
    totals,
    currency,
    formatPrice,
    toggleCurrency,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }), [
    cart, 
    itemCount, 
    totals, 
    currency, 
    formatPrice, 
    toggleCurrency, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart
  ]);

  return <CartContext.Provider value={cartContext}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}