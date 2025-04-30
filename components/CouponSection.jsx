"use client";

import React, { useState, useEffect } from "react";
import { validateCoupon, getAvailableCoupons } from "@/actions/coupon";
import { toast } from "sonner";

// UI Components
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

// Icons
import {
  AlertCircle,
  Check,
  ChevronDown,
  Gift,
  Info,
  Loader2,
  Tag,
  X,
} from "lucide-react";

const CouponSection = ({ 
  cartTotal,
  userId = 0, 
  isFirstOrder = false, 
  cartItems,
  currency,
  onCouponApplied,
  formatPrice
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [error, setError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);

  // Fetch available coupons for first-time users or logged-in users
  useEffect(() => {
    if (isFirstOrder || userId > 0) {
      fetchAvailableCoupons();
    }
  }, [isFirstOrder, userId]);

  const fetchAvailableCoupons = async () => {
    try {
      const result = await getAvailableCoupons(userId, isFirstOrder);
      
      if (result.success && result.coupons.length > 0) {
        setAvailableCoupons(result.coupons);
        setShowAvailableCoupons(true);
      }
    } catch (error) {
      console.error("Error fetching available coupons:", error);
    }
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await validateCoupon(
        couponCode,
        cartTotal,
        userId,
        cartItems
      );

      if (result.success) {
        setAppliedCoupon(result.coupon);
        toast.success("Coupon applied successfully!");
        
        // Call the parent callback with the discount information
        if (onCouponApplied) {
          onCouponApplied(result.coupon);
        }
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (error) {
      setError("Failed to apply coupon. Please try again.");
      toast.error("Failed to apply coupon");
    } finally {
      setIsLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setError("");
    
    // Call the parent callback to remove the discount
    if (onCouponApplied) {
      onCouponApplied(null);
    }
    
    toast.info("Coupon removed");
  };

  const applyCouponFromList = (code) => {
    setCouponCode(code);
    setTimeout(() => {
      handleCouponSubmit({ preventDefault: () => {} });
    }, 100);
  };

  return (
    <div className="mb-6">
      {appliedCoupon ? (
        <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="text-sm font-medium text-green-800">
                  Coupon Applied: {appliedCoupon.code}
                </h4>
                <p className="text-xs text-green-600 mt-0.5">
                  You saved {formatPrice(appliedCoupon.discount_amount)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-gray-500 hover:text-red-500"
              onClick={removeCoupon}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <form onSubmit={handleCouponSubmit} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full"
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={isLoading}
                className="border-[#6B2F1A] text-[#6B2F1A] hover:bg-[#FFF5F1] hover:text-[#6B2F1A]"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </form>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 py-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-sm font-medium">
                  {error}
                </AlertTitle>
              </div>
            </Alert>
          )}

          {/* Available Coupons Section */}
          {showAvailableCoupons && availableCoupons.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="available-coupons" className="border-b-0">
                <AccordionTrigger className="py-2 text-sm font-medium text-[#6B2F1A]">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>Available Coupons ({availableCoupons.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 mt-2">
                    {availableCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="bg-[#FFF5F1] border border-[#6B2F1A]/20 rounded-md p-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <Gift className="h-4 w-4 text-[#6B2F1A]" />
                              <span className="font-semibold text-[#6B2F1A]">
                                {coupon.code}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {coupon.description || 
                                `${coupon.discount_type === "percentage" 
                                  ? `${coupon.discount_value}% off` 
                                  : `${currency === "INR" ? "₹" : "$"}${coupon.discount_value} off`}`}
                            </p>
                            {coupon.min_order_value && (
                              <p className="text-xs text-gray-500 mt-1">
                                Min. order: {currency === "INR" ? "₹" : "$"}
                                {coupon.min_order_value}
                              </p>
                            )}
                            {coupon.max_discount && coupon.discount_type === "percentage" && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Max discount: {currency === "INR" ? "₹" : "$"}
                                {coupon.max_discount}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-[#6B2F1A] text-[#6B2F1A] hover:bg-[#6B2F1A] hover:text-white"
                            onClick={() => applyCouponFromList(coupon.code)}
                          >
                            Apply
                          </Button>
                        </div>
                        {coupon.expires !== "Never" && (
                          <p className="text-xs text-gray-500 mt-2">
                            Expires: {coupon.expires}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {isFirstOrder && !availableCoupons.length && (
            <Alert className="bg-blue-50 border-blue-100 text-blue-800 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-sm">First order discount</AlertTitle>
              <AlertDescription className="text-xs text-blue-700">
                Use code WELCOME10 for 10% off your first order!
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
};

export default CouponSection;