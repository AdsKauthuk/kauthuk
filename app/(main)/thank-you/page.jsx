"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import PromotionalBanner from "@/components/MainComponents/PromotionalBanner";

// Separate component to handle search params
function OrderDetailsFromParams({ setOrderDetails }) {
  const { useSearchParams } = require("next/navigation");
  const searchParams = useSearchParams();

  useEffect(() => {
    setOrderDetails({
      id:
        searchParams.get("orderId") ||
        `ORD-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      total: searchParams.get("total") || "0.00",
      currency: searchParams.get("currency") || "INR",
      items: parseInt(searchParams.get("items") || "0"),
    });
  }, [searchParams, setOrderDetails]);

  return null;
}

const ThankYouPage = () => {
  const [orderDetails, setOrderDetails] = useState({
    id: `ORD-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`,
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    total: "0.00",
    currency: "INR",
    items: 0,
  });

  useEffect(() => {
    // Trigger confetti animation on page load
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min, max) => {
      return Math.random() * (max - min) + min;
    };

    const confettiInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(confettiInterval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Launch confetti from the sides
      confetti({
        particleCount: Math.floor(randomInRange(10, 30)),
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: randomInRange(0.1, 0.3), y: 0.5 },
        colors: ["#b38d4a", "#6B2F1A", "#5A2814", "#FFD700"],
      });

      confetti({
        particleCount: Math.floor(randomInRange(10, 30)),
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: randomInRange(0.7, 0.9), y: 0.5 },
        colors: ["#b38d4a", "#6B2F1A", "#5A2814", "#FFD700"],
      });
    }, 250);

    return () => clearInterval(confettiInterval);
  }, []);

  const formatCurrency = (amount, currency) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (currency === "INR") {
      return `₹${numAmount.toFixed(2)}`;
    }
    return `$${numAmount.toFixed(2)}`;
  };

  return (
    <div className="bg-[#F9F7F4]">
      <div className="min-h-[80vh] flex items-center justify-center ">
        {/* Suspense boundary for the search params handling */}
        <Suspense fallback={null}>
          <OrderDetailsFromParams setOrderDetails={setOrderDetails} />
        </Suspense>

        <div className="w-full max-w-3xl p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Top section with success icon */}
            <div className="bg-gradient-to-r from-[#6B2F1A] to-[#8B4A2A] p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.3,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 200,
                }}
                className="mx-auto bg-white rounded-full w-20 h-20 flex items-center justify-center mb-6"
              >
                <Check className="h-10 w-10 text-[#6B2F1A]" />
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">Thank You!</h1>
              <p className="text-white/80 text-lg">
                Your order was completed successfully
              </p>
            </div>

            {/* Order details */}
            <div className="p-8">
              {/* Kauthuk logo and message */}
              <div className="text-center mb-8">
                <div className="relative h-16 w-36 mx-auto mb-4">
                  <Image
                    src="/assets/images/logo.png"
                    fill
                    alt="Kauthuk Logo"
                    className="object-contain"
                  />
                </div>
                <p className="text-gray-600 mb-4">
                  We've sent an order confirmation email with details and
                  tracking info.
                </p>

                {/* Order information */}
                <div className="bg-[#f9f7f4] rounded-lg p-6 my-6 text-left">
                  <h2 className="text-xl font-semibold text-[#6B2F1A] mb-4">
                    Order Details
                  </h2>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="font-medium">Order Number:</span>
                      <span>{orderDetails.id}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                      <span className="font-medium">Order Date:</span>
                      <span>{orderDetails.date}</span>
                    </div>

                    {orderDetails.items > 0 && (
                      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                        <span className="font-medium">Items:</span>
                        <span>{orderDetails.items}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold text-lg">
                        Order Total:
                      </span>
                      <span className="font-semibold text-lg text-[#6B2F1A]">
                        {formatCurrency(
                          orderDetails.total,
                          orderDetails.currency
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                  <Link href="/my-account">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-[#6B2F1A] text-[#6B2F1A] hover:bg-[#FFF5F1]"
                    >
                      View My Orders
                    </Button>
                  </Link>

                  <Link href="/">
                    <Button className="bg-[#6B2F1A] hover:bg-[#5A2814] w-full sm:w-auto group">
                      Continue Shopping
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              
            </div>
          </motion.div>
        </div>
      </div>
      <PromotionalBanner displayPage="success" />
    </div>
  );
};

export default ThankYouPage;
