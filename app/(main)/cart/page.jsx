"use client"
import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/providers/CartProvider';
import { toast } from 'sonner';

// UI Components
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  CreditCard, 
  Lock, 
  Info,
  DollarSign,
  IndianRupee,
  Shield,
  Truck,
  ShoppingCart,
  ChevronLeft,
  Layers,
  AlertCircle,
  Scale
} from 'lucide-react';

// Calculate shipping cost based on total weight (in grams)
// For first 500g: ₹50
// For each additional 500g: ₹40
const calculateShippingCost = (cart, currency) => {
  console.log("cart",cart)
  // If currency is not INR, return free shipping
  if (currency !== 'INR') {
    return 0;
  }
  
  // Check if any products have weight information
  const hasWeightInfo = cart.some(item => item.weight || (item.variant && item.variant.weight));
  
  // If no weight information is available, return free shipping
  if (!hasWeightInfo) {
    return 0;
  }
  
  // Calculate total weight
  let totalWeightInGrams = 0;
  
  cart.forEach(item => {
    const quantity = item.quantity || 1;
    let itemWeight = 0;
    
    // Get weight from item or its variant
    if (item.weight) {
      itemWeight = parseFloat(item.weight);
    } else if (item.variant && item.variant.weight) {
      itemWeight = parseFloat(item.variant.weight);
    }
    
    // Add to total weight (weight * quantity)
    totalWeightInGrams += itemWeight * quantity;
  });
  
  // If total weight is 0, return free shipping
  if (totalWeightInGrams <= 0) {
    return 0;
  }
  
  // Calculate shipping cost based on weight
  // First 500g: ₹50
  let shippingCost = 50;
  
  // If weight is more than 500g, add ₹40 for each additional 500g
  if (totalWeightInGrams > 500) {
    // Calculate how many additional 500g blocks (rounded up)
    const additionalBlocks = Math.ceil((totalWeightInGrams - 500) / 500);
    shippingCost += additionalBlocks * 40;
  }
  
  return shippingCost;
};

const ProductCart = () => {
  const { 
    cart, 
    itemCount,
    totals, 
    currency, 
    formatPrice, 
    toggleCurrency, 
    removeFromCart, 
    updateQuantity, 
    clearCart 
  } = useCart();
  
  // Calculate subtotal
  const subtotal = totals[currency];
  
  // Calculate shipping cost based on weight for INR
  const shippingCost = useMemo(() => {
    return calculateShippingCost(cart, currency);
  }, [cart, currency]);
  
  // Calculate tax (assumed 10%)
  const taxRate = 0.10;
  const tax = subtotal * taxRate;
  
  // Calculate total including shipping
  const total = subtotal + tax + shippingCost;

  // Calculate total weight for display
  const totalWeight = useMemo(() => {
    let weight = 0;
    cart.forEach(item => {
      const quantity = item.quantity || 1;
      if (item.weight) {
        weight += parseFloat(item.weight) * quantity;
      } else if (item.variant && item.variant.weight) {
        weight += parseFloat(item.variant.weight) * quantity;
      }
    });
    return weight;
  }, [cart]);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F4F0] py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-white rounded-full shadow-sm">
                <ShoppingCart className="h-12 w-12 text-[#6B2F1A]" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "Playfair Display, serif" }}>Your cart is empty</h1>
            <p className="text-gray-600 mb-8" style={{ fontFamily: "Poppins, sans-serif" }}>
              Looks like you haven't added any products to your cart yet.
            </p>
            <Link href="/products">
              <Button className="px-8 py-6 text-lg bg-[#6B2F1A] hover:bg-[#5A2814]" style={{ fontFamily: "Poppins, sans-serif" }}>
                <ChevronLeft className="h-5 w-5 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F4F0]">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-[#6B2F1A]" style={{ fontFamily: "Playfair Display, serif" }}>Shopping Cart</h1>
          <div className="flex justify-between items-center">
            <p className="text-gray-600" style={{ fontFamily: "Poppins, sans-serif" }}>Review and modify your items before checkout</p>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                className="text-[#6B2F1A] border-[#6B2F1A]/20 hover:bg-[#fee3d8]"
                onClick={toggleCurrency}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {currency === 'INR' ? (
                  <><IndianRupee className="h-4 w-4 mr-1" /> INR</>
                ) : (
                  <><DollarSign className="h-4 w-4 mr-1" /> USD</>
                )}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear Cart
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle style={{ fontFamily: "Playfair Display, serif" }}>Clear your shopping cart?</AlertDialogTitle>
                    <AlertDialogDescription style={{ fontFamily: "Poppins, sans-serif" }}>
                      This will remove all items from your cart. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel style={{ fontFamily: "Poppins, sans-serif" }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={clearCart}
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Clear Cart
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products List */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-[#6B2F1A]/10">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="relative group">
                      {item.image ? (
                        <div className="relative w-40 h-40">
                          <Image
                            src={`https://greenglow.in/kauthuk_test/${item.image}`}
                            alt={item.title}
                            fill
                            className="rounded-xl object-cover transform group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-40 h-40 bg-[#fee3d8] rounded-xl flex items-center justify-center">
                          <ShoppingBag className="h-10 w-10 text-[#6B2F1A]" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="text-xl font-semibold text-[#6B2F1A]" style={{ fontFamily: "Playfair Display, serif" }}>{item.title}</h3>
                        
                        {/* Show variant info if available */}
                        {item.variant && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge variant="outline" className="flex items-center gap-1 bg-[#fee3d8] text-[#6B2F1A] border-[#6B2F1A]/20">
                              <Layers className="h-3 w-3" />
                              Variant
                            </Badge>
                            {item.variant.attributes && item.variant.attributes.map((attr, i) => (
                              <Badge key={i} variant="outline" className="bg-gray-50">
                                {attr.name}: {attr.value}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* SKU if available */}
                        {item.variant?.sku && (
                          <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                            SKU: {item.variant.sku}
                          </p>
                        )}

                        {/* Weight if available */}
                        {currency === 'INR' && (item.weight || (item.variant && item.variant.weight)) && (
                          <p className="text-gray-500 text-xs mt-1 flex items-center" style={{ fontFamily: "Poppins, sans-serif" }}>
                            <Scale className="h-3 w-3 mr-1"/>
                            Weight: {item.weight || item.variant?.weight || 0}g
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center bg-[#fee3d8]/50 rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-white rounded-md transition-colors text-[#6B2F1A]"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium" style={{ fontFamily: "Poppins, sans-serif" }}>{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-white rounded-md transition-colors text-[#6B2F1A]"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            disabled={item.maxStock && item.quantity >= item.maxStock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => removeFromCart(index)}
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                      
                      {item.maxStock && item.quantity >= item.maxStock && (
                        <div className="flex items-start gap-1 text-amber-600 text-xs" style={{ fontFamily: "Poppins, sans-serif" }}>
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>Maximum available quantity reached</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-[#6B2F1A]" style={{ fontFamily: "Playfair Display, serif" }}>
                        {currency === 'INR' ? (
                          <>{formatPrice(item.price * item.quantity)}</>
                        ) : (
                          <>{formatPrice(item.priceDollars * item.quantity)}</>
                        )}
                      </p>
                      <p className="text-sm text-gray-500" style={{ fontFamily: "Poppins, sans-serif" }}>
                        {currency === 'INR' ? (
                          <>{formatPrice(item.price)} each</>
                        ) : (
                          <>{formatPrice(item.priceDollars)} each</>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Continue Shopping Button */}
            <div className="flex justify-start">
              <Link href="/products">
                <Button 
                  variant="outline" 
                  className="gap-2 border-[#6B2F1A] text-[#6B2F1A] hover:bg-[#fee3d8] hover:text-[#5A2814]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 border-[#6B2F1A]/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-[#6B2F1A]" style={{ fontFamily: "Playfair Display, serif" }}>
                  <ShoppingBag className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Breakdown */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
                    <span className="text-gray-600">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  
                  {/* Display shipping as cost based on weight or free */}
                  <div className="flex justify-between text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
                    <span className="text-gray-600">Shipping</span>
                    {currency === 'INR' && shippingCost > 0 ? (
                      <span>{formatPrice(shippingCost)}</span>
                    ) : (
                      <span className="text-green-600">Free</span>
                    )}
                  </div>

                  {/* Display weight if applicable */}
                  {currency === 'INR' && totalWeight > 0 && (
                    <div className="flex justify-between text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center text-gray-600">
                            Total Weight
                            <Info className="h-3.5 w-3.5 ml-1 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Weight-based shipping: ₹50 for first 500g, ₹40 for each additional 500g</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span>{totalWeight}g</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center text-gray-600">
                          Tax
                          <Info className="h-3.5 w-3.5 ml-1 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>10% tax applied to the subtotal</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  
                  <Separator className="my-4 bg-[#6B2F1A]/10" />
                  
                  <div className="flex justify-between text-lg font-semibold text-[#6B2F1A]" style={{ fontFamily: "Playfair Display, serif" }}>
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Shipping info with weight-based shipping explanation */}
                {currency === 'INR' && totalWeight > 0 && shippingCost > 0 && (
                  <div className="bg-[#FFF5F1] rounded-lg p-3 text-xs text-[#6B2F1A]/80" style={{ fontFamily: "Poppins, sans-serif" }}>
                    <div className="flex items-center gap-1 font-medium mb-1">
                      <Truck className="h-3.5 w-3.5" />
                      <span>Weight-based shipping:</span>
                    </div>
                    <p>First 500g: ₹50</p>
                    {totalWeight > 500 && (
                      <p>Additional {Math.ceil((totalWeight - 500) / 500)} x 500g: ₹{Math.ceil((totalWeight - 500) / 500) * 40}</p>
                    )}
                  </div>
                )}

                {/* Shipping & Payment info */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="shipping">
                    <AccordionTrigger className="text-sm py-2 text-[#6B2F1A]" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Shipping Information
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm space-y-2 text-gray-600" style={{ fontFamily: "Poppins, sans-serif" }}>
                        <p className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-[#6B2F1A]" />
                          {currency === 'INR' && shippingCost > 0 ? (
                            <>Standard shipping (5-7 business days)</>
                          ) : (
                            <>Free standard shipping (5-7 business days)</>
                          )}
                        </p>
                        {currency === 'INR' && totalWeight > 0 && (
                          <p className="flex items-center gap-2">
                            <Scale className="h-4 w-4 text-[#6B2F1A]" />
                            Weight-based shipping rates apply
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-[#6B2F1A]" />
                          All items are securely packed and insured
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="payment">
                    <AccordionTrigger className="text-sm py-2 text-[#6B2F1A]" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Payment Methods
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm space-y-2 text-gray-600" style={{ fontFamily: "Poppins, sans-serif" }}>
                        <p className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-[#6B2F1A]" />
                          Credit/Debit Cards
                        </p>
                        <p className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-[#6B2F1A]" />
                          UPI/Net Banking
                        </p>
                        {cart.some(item => item.codAvailable) && (
                          <p className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-[#6B2F1A]" />
                            Cash on Delivery
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div className="bg-[#fee3d8] p-4 rounded-lg text-sm text-[#6B2F1A] flex items-start gap-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                  <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    Your transaction is secured with 256-bit SSL encryption
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  className="w-full h-12 text-lg font-medium bg-[#6B2F1A] hover:bg-[#5A2814] gap-2" 
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  <Link href="/checkout" className="flex items-center gap-2 w-full justify-center">
                    Proceed to Checkout
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-xs text-center text-gray-500" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Secure checkout powered by RazorPay
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCart;