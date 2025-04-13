"use client"
import Head from 'next/head';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handlePayment = () => {
    const options = {
      key: 'rzp_test_jG2ZIwR6d1w09S', // Replace with your Razorpay Test Key
      amount: 50000, // Amount in paise = INR 500
      currency: 'INR',
      name: 'Test Company',
      description: 'Test Transaction',
    //   image: 'https://your-logo-url.com/logo.png', // Optional logo
      handler: function (response) {
        alert(`Payment successful! ID: ${response.razorpay_payment_id}`);
      },
      prefill: {
        name: 'Alan',
        email: 'alan@gmail.com',
        contact: '9879879870',
      },
      notes: {
        address: 'Test Corporate Office',
      },
      theme: {
        color: '#6366f1',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <>
      <Head>
        <title>Razorpay Test</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <button
          onClick={handlePayment}
          className="px-6 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-xl shadow hover:bg-indigo-700 transition"
        >
          Pay Now
        </button>
      </div>
    </>
  );
}
