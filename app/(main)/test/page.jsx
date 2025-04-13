"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";

const RazorpayTestPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [testLogs, setTestLogs] = useState([]);

  // Function to add logs for debugging
  const addLog = (message) => {
    setTestLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Check if Razorpay is already available
    if (typeof window !== "undefined" && window.Razorpay) {
      setRazorpayLoaded(true);
      addLog("Razorpay script already loaded");
    }
  }, []);

  const handlePayNow = async () => {
    try {
      setIsLoading(true);
      addLog("PayNow button clicked");

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        addLog("ERROR: Razorpay is not loaded yet!");
        toast.error("Razorpay is not loaded. Please wait or refresh the page.");
        setIsLoading(false);
        return;
      }

      // Create a mock order (in a real app, this would come from your backend)
      // In a production app, this would be a call to your API
      const mockOrderId = "order_" + Date.now();
      addLog(`Created mock order ID: ${mockOrderId}`);

      // Test amount - 100 INR (in paise)
      const amount = 10000; // 100 INR in paise
      
      // Create Razorpay options
      const options = {
        key: "rzp_test_jG2ZIwR6d1w09S", // Replace with your test key
        amount: amount,
        currency: "INR",
        name: "Razorpay Test",
        description: "Test Transaction",
        order_id: mockOrderId, // Note: In a real app, this should come from your server
        handler: function (response) {
          addLog("Payment successful!");
          addLog(`Payment ID: ${response.razorpay_payment_id}`);
          setPaymentSuccess(true);
          toast.success("Payment successful!");
          setIsLoading(false);
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999",
        },
        notes: {
          address: "Test Address",
          testMode: "true",
        },
        theme: {
          color: "#6B2F1A",
        },
        modal: {
          ondismiss: function () {
            addLog("Payment modal dismissed");
            setIsLoading(false);
            toast.info("Payment cancelled");
          },
        },
      };

      addLog("Initializing Razorpay with options:");
      addLog(JSON.stringify({
        key: options.key,
        amount: options.amount,
        currency: options.currency,
        name: options.name
      }));

      // Initialize Razorpay
      const paymentObject = new window.Razorpay(options);

      // Add event listeners
      paymentObject.on("payment.failed", function (response) {
        const error = response.error || {};
        addLog(`Payment failed: ${error.code} - ${error.description}`);
        setPaymentError(`${error.code}: ${error.description}`);
        toast.error(`Payment failed: ${error.description}`);
        setIsLoading(false);
      });

      // Open Razorpay payment form
      addLog("Opening Razorpay payment form");
      paymentObject.open();
    } catch (error) {
      addLog(`Error: ${error.message}`);
      setPaymentError(error.message);
      toast.error(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-center mb-6">Razorpay Test Page</h1>
            
            <div className="text-center mb-8">
              <p className="text-gray-700 mb-2">
                Razorpay Script Status: 
                <span className={`ml-2 font-medium ${razorpayLoaded ? 'text-green-600' : 'text-red-600'}`}>
                  {razorpayLoaded ? 'Loaded ✓' : 'Not Loaded ✗'}
                </span>
              </p>
              
              <div className="mt-6">
                <Button
                  onClick={handlePayNow}
                  disabled={isLoading || !razorpayLoaded}
                  className="bg-[#6B2F1A] hover:bg-[#5A2814] text-white py-3 px-6 rounded-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Pay Now (₹100)'
                  )}
                </Button>
              </div>
            </div>
            
            {paymentSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <p className="font-medium">Payment Successful! ✓</p>
              </div>
            )}
            
            {paymentError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <p className="font-medium">Payment Error: {paymentError}</p>
              </div>
            )}
            
            <div className="mt-8">
              <h2 className="text-lg font-medium mb-2">Debug Logs:</h2>
              <div className="bg-gray-100 p-4 rounded-lg h-64 overflow-y-auto text-sm font-mono">
                {testLogs.length > 0 ? (
                  testLogs.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))
                ) : (
                  <p className="text-gray-500">No logs yet. Click "Pay Now" to test Razorpay.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Razorpay Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => {
          setRazorpayLoaded(true);
          addLog("Razorpay script loaded successfully");
        }}
        onError={() => {
          addLog("Failed to load Razorpay script");
        }}
      />
    </div>
  );
};

export default RazorpayTestPage;