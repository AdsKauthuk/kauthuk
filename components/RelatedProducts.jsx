"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, ChevronRight, Eye, Loader2, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/providers/CartProvider";
import { getProducts } from "@/actions/product";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { toast } from "sonner";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const RelatedProducts = ({ subcategoryId, productId, limit = 8 }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice, currency } = useCart();

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);

        // Fetch products from the same subcategory
        const response = await getProducts({
          subcategory: subcategoryId,
          limit: limit + 1, // +1 to account for excluding current product
        });

        if (response && response.products) {
          // Filter out the current product
          const filteredProducts = response.products
            .filter((product) => product.id !== parseInt(productId))
            .slice(0, limit);

          setProducts(filteredProducts);
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (subcategoryId) {
      fetchRelatedProducts();
    }
  }, [subcategoryId, productId, limit]);

  if (loading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#6B2F1A]" style={{ fontFamily: "Playfair Display, serif" }}>
              Related Products
            </h2>
            <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="aspect-square bg-gray-100 animate-pulse"></div>
                <div className="p-4 space-y-2">
                  <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded"></div>
                  <div className="animate-pulse bg-gray-200 h-6 w-1/2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null; // Don't show the section if no related products
  }

  return (
    <div className="py-12 bg-[#F9F4F0]">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#6B2F1A]" style={{ fontFamily: "Playfair Display, serif" }}>
            More Products You May Like
          </h2>
          {subcategoryId && (
            <Link
              href={`/subcategory/${subcategoryId}`}
              className="flex items-center text-sm font-medium text-[#6B2F1A] hover:text-[#5A2814]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <RelatedProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Mobile and tablet slider view */}
        <div className="lg:hidden -mx-4 px-4">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={16}
            slidesPerView={1.2}
            centeredSlides={false}
            loop={false}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            breakpoints={{
              400: {
                slidesPerView: 1.5,
              },
              640: {
                slidesPerView: 2.2,
              },
              768: {
                slidesPerView: 2.8,
              },
            }}
            className="pb-12 kauthuk-swiper"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <RelatedProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom styles for Swiper pagination */}
          <style jsx global>{`
            .kauthuk-swiper .swiper-pagination-bullet {
              background: #6B2F1A;
              opacity: 0.3;
            }
            .kauthuk-swiper .swiper-pagination-bullet-active {
              opacity: 1;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

const RelatedProductCard = ({ product }) => {
  const { addToCart, formatPrice, currency } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (inStock) {
      const thumbnail =
        product.ProductImages && product.ProductImages.length > 0
          ? product.ProductImages[0].image_path
          : null;

      const cartItem = {
        id: product.id,
        title: product.title,
        price: product.price_rupees,
        priceDollars: product.price_dollars,
        image: thumbnail,
        quantity: 1,
      };

      addToCart(cartItem);
      toast.success("Added to cart");
    } else {
      toast.error("Product Out of Stock");
    }
  };

  // Handle sharing function
  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Check out this product: ${product.title}`,
        url: `${window.location.origin}/product/${product.id}`,
      }).catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback - copy link to clipboard
      const url = `${window.location.origin}/product/${product.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateDescription = (text, maxLength = 80) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

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

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div
        className="group h-full rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-500 ease-out transform hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={imageUrl}
            alt={product?.title || "Product Image"}
            fill
            placeholder="blur"
            blurDataURL={`data:image/svg+xml;base64,${toBase64(
              shimmer(700, 475)
            )}`}
            className={`object-cover transition-all duration-700 ease-in-out ${
              isHovered ? "scale-110" : "scale-100"
            }`}
          />

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="px-2 py-1 bg-[#6B2F1A] text-white font-bold shadow-sm">
                -{discountPercentage}%
              </Badge>
            </div>
          )}

          {/* Stock status badge */}
          <div className="absolute top-3 right-3 z-10">
            <Badge
              className={`px-2 py-1 font-medium shadow-sm ${
                inStock
                  ? "bg-[#fee3d8] text-[#6B2F1A]"
                  : "bg-red-100 text-red-800"
              }`}
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {inStock ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>

          {/* Action buttons at bottom */}
          <div className="absolute bottom-2 right-2 z-10 flex items-center space-x-2">
            {/* Wishlist button */}
            <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-[#fee3d8] transition-colors">
              <Heart className="w-4 h-4 text-[#6B2F1A]" />
            </button>
            
            {/* Share button */}
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-[#fee3d8] transition-colors"
            >
              <Share2 className="w-4 h-4 text-[#6B2F1A]" />
            </button>
          </div>

          {/* Action buttons overlay */}
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center gap-3 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <Link href={`/product/${product?.id}`}>
              <button className="w-10 h-10 rounded-full bg-white text-[#6B2F1A] flex items-center justify-center hover:bg-[#6B2F1A] hover:text-white transition-colors shadow-md">
                <Eye className="w-5 h-5" />
              </button>
            </Link>
            
            {inStock && (
              <button 
                onClick={handleAddToCart}
                className="w-10 h-10 rounded-full bg-white text-[#6B2F1A] flex items-center justify-center hover:bg-[#6B2F1A] hover:text-white transition-colors shadow-md"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-5">
          <h3 
            className="text-lg font-medium text-gray-900 line-clamp-1 mb-1 group-hover:text-[#6B2F1A] transition-colors"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {product?.title || "Product Name"}
          </h3>

          <div className="flex items-baseline gap-2">
            <p 
              className="text-xl font-bold text-[#6B2F1A]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              ₹{parseFloat(product?.price_rupees || 0).toLocaleString()}
            </p>
            {hasDiscount && (
              <p 
                className="text-sm text-gray-500 line-through"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                ₹{parseFloat(product?.base_price || 0).toLocaleString()}
              </p>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Link href={`/product/${product?.id}`} className="flex-1">
              <button
                type="button"
                className="w-full py-2.5 px-4 bg-[#6B2F1A] hover:bg-[#5A2814] text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                View Details
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RelatedProducts;