"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Check,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const shimmer = (w, h) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="0%" />
      <stop stop-color="#edeef1" offset="20%" />
      <stop stop-color="#f6f7f8" offset="40%" />
      <stop stop-color="#f6f7f8" offset="100%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

const ProductCard = ({
  id,
  title,
  price_rupees,
  images,
  index,
  featured = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareMenuRef = useRef(null);

  // Choose the first image or use a fallback
  const imageUrl =
    images && images.length > 0
      ? `https://greenglow.in/kauthuk_test/${images[0].image_path}`
      : "/assets/images/placeholder.png";

  // Format price to show with rupee symbol
  const formatPrice = (price) => {
    const formattedPrice = parseFloat(price || 0).toLocaleString("en-IN");
    return `₹${formattedPrice}`;
  };

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(event.target)
      ) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle sharing to various platforms
  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const shareToFacebook = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      `${window.location.origin}/product/${id}`
    )}`;
    window.open(url, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  const shareToTwitter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `Check out this product: ${title}`
    )}&url=${encodeURIComponent(`${window.location.origin}/product/${id}`)}`;
    window.open(url, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  const shareToLinkedin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      `${window.location.origin}/product/${id}`
    )}`;
    window.open(url, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  const copyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/product/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowShareMenu(false);
  };

  return (
    <div
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowShareMenu(false);
      }}
    >
      <div className="relative h-full flex flex-col overflow-hidden group bg-white shadow-sm hover:shadow-md transition-all duration-300 border-y-2 border-x-[0.1px] border-[#5A2814]">
        {/* Product Tags */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {/* New Tag */}
          {/* {index < 2 && (
            <div className="bg-[#6B2F1A] text-white text-xs font-poppins px-2 py-1 rounded">
              New
            </div>
          )} */}

          {/* Featured Tag */}
          {/* {featured && (
            <div className="bg-[#F0B775] text-[#6B2F1A] text-xs font-poppins px-2 py-1 rounded font-medium">
              Featured
            </div>
          )} */}
        </div>

        {/* Image Container */}
        <Link
          href={`/product/${id}`}
          className="block relative aspect-square overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[85%] h-[85%] relative">
              <Image
                src={imageUrl}
                alt={title || "Product"}
                fill
                placeholder="blur"
                blurDataURL={`data:image/svg+xml;base64,${toBase64(
                  shimmer(700, 475)
                )}`}
                className="object-cover transition-all duration-500 ease-in-out group-hover:scale-105"
              />
            </div>
          </div>

          {/* Quick Shop Overlay - Appears on hover */}
          <div
            className={`absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          >
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white/90 px-4 py-2 rounded-full shadow-md">
              <span className="font-poppins text-sm text-[#6B2F1A] font-medium flex items-center">
                <ShoppingBag size={14} className="mr-1" />
                Quick View
              </span>
            </div>
          </div>
        </Link>

        {/* Content Container */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="mb-2">
            <Link href={`/product/${id}`}>
              <h3 className="playfair-italic text-base font-medium text-[#6B2F1A] line-clamp-2 hover:text-[#6B2F1A] transition-colors">
                {title || "Product"}
              </h3>
            </Link>
          </div>

          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <p className="font-poppins text-lg font-semibold text-[#6B2F1A]">
                {formatPrice(price_rupees)}
              </p>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {/* Wishlist button */}
                <button className="w-8 h-8 rounded-full bg-[#FFF5F1] flex items-center justify-center hover:bg-[#fee3d8] transition-colors">
                  <Heart className="w-4 h-4 text-[#6B2F1A]" />
                </button>

                {/* Share button */}
                <div className="relative" ref={shareMenuRef}>
                  <button
                    onClick={handleShare}
                    className="w-8 h-8 rounded-full bg-[#FFF5F1] flex items-center justify-center hover:bg-[#fee3d8] transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-[#6B2F1A]" />
                  </button>

                  {/* Share dropdown menu */}
                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100 w-48 z-50"
                      >
                        <div className="p-2">
                          <div className="px-2 py-1 text-xs font-medium text-gray-500 font-poppins">
                            Share this product
                          </div>

                          <button
                            onClick={shareToFacebook}
                            className="flex items-center w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-[#fee3d8] rounded-md font-poppins"
                          >
                            <Facebook
                              size={15}
                              className="mr-2 text-blue-600"
                            />
                            Facebook
                          </button>

                          <button
                            onClick={shareToTwitter}
                            className="flex items-center w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-[#fee3d8] rounded-md font-poppins"
                          >
                            <Twitter size={15} className="mr-2 text-blue-400" />
                            Twitter
                          </button>

                          <button
                            onClick={shareToLinkedin}
                            className="flex items-center w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-[#fee3d8] rounded-md font-poppins"
                          >
                            <Linkedin
                              size={15}
                              className="mr-2 text-blue-700"
                            />
                            LinkedIn
                          </button>

                          <button
                            onClick={copyLink}
                            className="flex items-center w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-[#fee3d8] rounded-md font-poppins"
                          >
                            {copied ? (
                              <Check
                                size={15}
                                className="mr-2 text-green-500"
                              />
                            ) : (
                              <Copy size={15} className="mr-2 text-gray-500" />
                            )}
                            {copied ? "Copied!" : "Copy Link"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
