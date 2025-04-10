"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Eye,
  Star,
  Heart,
  Share2,
  Check,
  Copy,
  Facebook,
  Twitter,
  Linkedin,
  ShoppingBag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Shimmer effect for image loading
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

const ProductCard = ({ product, layout = "grid", onAddToCart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareMenuRef = useRef(null);

  // Safely handle image URLs
  const imageUrl =
    product?.ProductImages && product.ProductImages.length > 0
      ? `https://greenglow.in/kauthuk_test/${product.ProductImages[0].image_path}`
      : "/assets/images/placeholder.png";

  // Calculate discount if applicable
  const hasDiscount = product?.base_price > product?.price_rupees;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.base_price - product.price_rupees) / product.base_price) * 100
      )
    : 0;

  // Determine if product is in stock
  const inStock = product?.stock_status === "yes" && product?.stock_count > 0;

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

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart && inStock) {
      onAddToCart(product);
      toast.success("Added to cart successfully!");
    } else if (!inStock) {
      toast.error("Product Out of Stock");
    }
  };

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success("Added to wishlist!");
  };

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
      `${window.location.origin}/product/${product.id}`
    )}`;
    window.open(url, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  const shareToTwitter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `Check out this product: ${product.title}`
    )}&url=${encodeURIComponent(
      `${window.location.origin}/product/${product.id}`
    )}`;
    window.open(url, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  const shareToLinkedin = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      `${window.location.origin}/product/${product.id}`
    )}`;
    window.open(url, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  const copyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
    setShowShareMenu(false);
  };

  const truncateDescription = (text, maxLength = 80) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const gridCard = (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowShareMenu(false);
      }}
    >
      <div className="group h-full overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col border-y-2 border-x-[0.1px] border-[#5A2814]">
        {/* Product Image Container */}
        <div className="relative aspect-square overflow-hidden">
          <Link
            href={`/product/${product?.id}`}
            className="block w-full h-full"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[85%] h-[85%] relative">
                <Image
                  src={imageUrl}
                  alt={product?.title || "Product Image"}
                  fill
                  placeholder="blur"
                  blurDataURL={`data:image/svg+xml;base64,${toBase64(
                    shimmer(700, 475)
                  )}`}
                  className="object-cover transition-all duration-500 ease-in-out group-hover:scale-105"
                />
              </div>
            </div>
          </Link>

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="px-2 py-1 bg-[#6B2F1A] text-white font-bold shadow-sm font-poppins">
                -{discountPercentage}%
              </Badge>
            </div>
          )}

          {/* Stock status badge */}
          {!inStock && (
            <div className="absolute top-3 right-3 z-10">
              <Badge className="px-2 py-1 font-medium shadow-sm bg-red-100 text-red-700 font-poppins">
                Out of Stock
              </Badge>
            </div>
          )}

          {/* Quick View Overlay - Appears on hover */}
          <div
            className={`absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          >
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white/90 px-4 py-2 rounded-full shadow-md">
              <span className="font-poppins text-sm text-[#6B2F1A] font-medium flex items-center">
                <Eye size={14} className="mr-1" />
                Quick View
              </span>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="mb-2">
            <Link href={`/product/${product?.id}`}>
              <h3 className="playfair-italic text-base font-medium text-[#6B2F1A] line-clamp-2 hover:text-[#6B2F1A] transition-colors">
                {product?.title || "Product Name"}
              </h3>
            </Link>
          </div>

          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-3">
              <p className="font-poppins text-lg font-semibold text-[#6B2F1A]">
                ₹{parseFloat(product?.price_rupees || 0).toLocaleString()}
              </p>
              {hasDiscount && (
                <p className="font-poppins text-sm text-gray-500 line-through">
                  ₹{parseFloat(product?.base_price || 0).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div />

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {/* Wishlist button */}
                <button
                  onClick={handleAddToWishlist}
                  className="w-8 h-8 rounded-full bg-[#FFF5F1] flex items-center justify-center hover:bg-[#fee3d8] transition-colors"
                >
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
    </motion.div>
  );

  const listCard = (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowShareMenu(false);
      }}
    >
      <div className="group h-full rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 p-4 flex flex-col md:flex-row gap-6 border border-gray-200">
        {/* Image Container */}
        <div className="relative w-full md:w-64 aspect-square md:aspect-auto overflow-hidden rounded-lg">
          <Link
            href={`/product/${product?.id}`}
            className="block w-full h-full"
          >
            <Image
              src={imageUrl}
              alt={product?.title || "Product Image"}
              fill
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(
                shimmer(700, 475)
              )}`}
              className="object-cover transition-all duration-500 ease-in-out group-hover:scale-105"
            />
          </Link>

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="px-2 py-1 bg-[#6B2F1A] text-white font-bold shadow-sm font-poppins">
                -{discountPercentage}%
              </Badge>
            </div>
          )}

          {/* Quick View Overlay - Appears on hover */}
          <div
            className={`absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          >
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 bg-white/90 px-4 py-2 rounded-full shadow-md">
              <span className="font-poppins text-sm text-[#6B2F1A] font-medium flex items-center">
                <Eye size={14} className="mr-1" />
                Quick View
              </span>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            {!inStock && (
              <Badge className="px-2 py-1 font-medium shadow-sm bg-red-100 text-red-700 font-poppins">
                Out of Stock
              </Badge>
            )}
            {inStock && (
              <Badge className="px-2 py-1 font-medium shadow-sm bg-[#FFF5F1] text-[#6B2F1A] font-poppins">
                In Stock
              </Badge>
            )}
          </div>

          <div className="mb-auto">
            <Link href={`/product/${product?.id}`}>
              <h3 className="font-playfair text-xl font-medium text-gray-800 mb-2 hover:text-[#6B2F1A] transition-colors">
                {product?.title || "Product Name"}
              </h3>
            </Link>

            {product?.description && (
              <p className="font-poppins text-sm text-gray-600 line-clamp-2 mb-3">
                {truncateDescription(product.description, 150)}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-baseline gap-2">
              <p className="font-poppins text-xl font-semibold text-[#6B2F1A]">
                ₹{parseFloat(product?.price_rupees || 0).toLocaleString()}
              </p>
              {hasDiscount && (
                <p className="font-poppins text-sm text-gray-500 line-through">
                  ₹{parseFloat(product?.base_price || 0).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Action Buttons */}
              <div className="flex space-x-2">
                {/* Wishlist button */}
                <button
                  onClick={handleAddToWishlist}
                  className="w-8 h-8 rounded-full bg-[#FFF5F1] flex items-center justify-center hover:bg-[#fee3d8] transition-colors"
                >
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

              <Link href={`/product/${product?.id}`}>
                <button
                  type="button"
                  className="py-2 px-4 bg-[#6B2F1A] hover:bg-[#5A2814] text-white rounded-md transition-colors font-poppins text-sm flex items-center"
                >
                  <ShoppingBag size={16} className="mr-2" />
                  View Details
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return layout === "grid" ? gridCard : listCard;
};

export default ProductCard;
