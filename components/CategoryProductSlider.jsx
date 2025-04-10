"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  Star,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// Import styles
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Import the getProducts and getCategory server actions (you'll need to create these)
import { getCategories2 } from "@/actions/category";
import { getProducts } from "@/actions/product";
import { useCart } from "@/providers/CartProvider";

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

const ProductCard = ({ product, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [rating] = useState(Math.floor(Math.random() * 2) + 4); // Random 4-5 star rating
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      id: product.id,
      title: product.title,
      price: parseFloat(product.price_rupees),
      priceDollars: parseFloat(
        product.price_dollars || product.price_rupees / 80
      ), // Assuming a conversion rate
      quantity: 1,
      image:
        ProductImages && ProductImages.length > 0
          ? `https://greenglow.in/kauthuk_test/${ProductImages[0].image_path}`
          : "/assets/images/placeholder.png",
      maxStock: product.stock_count || 10,
    });
  };
  if (!product) return null;

  // Safely extract product properties with fallbacks
  const {
    id = 0,
    title = "Product",
    price_rupees = 0,
    weight = null,
    ProductImages = [],
    hasVariants = false,
    description = "",
  } = product;

  // Choose the first image or use a fallback
  const imageUrl =
    ProductImages && ProductImages.length > 0
      ? `https://greenglow.in/kauthuk_test/${ProductImages[0].image_path}`
      : "/assets/images/placeholder.png";

  // Create color variants for the backgrounds when no images are available
  const colorVariants = [
    "from-rose-400 to-red-500",
    "from-blue-400 to-indigo-500",
    "from-green-400 to-emerald-500",
    "from-amber-400 to-orange-500",
    "from-purple-400 to-violet-500",
    "from-pink-400 to-rose-500",
  ];

  // Select a color variant based on the index
  const colorVariant = colorVariants[index % colorVariants.length];

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div
        className="group h-full rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-500 ease-out transform hover:-translate-y-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-square overflow-hidden">
          {ProductImages && ProductImages.length > 0 ? (
            <Image
              src={imageUrl}
              alt={title || "Product"}
              fill
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(
                shimmer(700, 475)
              )}`}
              className={cn(
                "object-cover transition-all duration-700 ease-in-out",
                isHovered ? "scale-110" : "scale-100"
              )}
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${colorVariant} flex items-center justify-center p-6 text-white`}
            >
              <h3 className="text-xl font-bold text-center">
                {title || "Product"}
              </h3>
            </div>
          )}

          {/* Action buttons overlay */}
          <div
            className={cn(
              "absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center gap-3 transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <Link href={`/product/${id}`}>
              <motion.button
                className="w-10 h-10 rounded-full bg-white text-gray-800 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors shadow-md"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Eye className="w-5 h-5" />
              </motion.button>
            </Link>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">
            {title || "Product"}
          </h3>

          <p className="text-sm text-gray-500 mb-3">
            {weight ? `Weight: ${weight} kg` : "Premium Quality"}
          </p>

          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-indigo-600">
              ₹{parseFloat(price_rupees).toLocaleString() || "0"}
            </p>
          </div>

          <Link href={`/product/${id}`} className="mt-4 block">
            <motion.button
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Details
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const CategoryProductSlider = ({
  categoryId,
  limit = 6,
  title = null, // Will be overridden by category name if not provided
  description = null, // Will be overridden by category description if not provided
  viewAllLink = null, // Will be set to category page if not provided
  showFilters = true,
  swiperEffect = "default", // Options: "default", "cards", "coverflow"
}) => {
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  // Animation states
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  // Fetch category and its products
  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true);

        // Fetch category data
        if (categoryId) {
          const categoryResponse = await getCategories2(categoryId);
          if (categoryResponse && categoryResponse.success) {
            setCategory(categoryResponse.category);

            // If viewAllLink is not set, create it based on category
            if (!viewAllLink && categoryResponse.category) {
              // This assumes you have a URL structure like /category/[slug] or /category/[id]
              // Adjust based on your actual URL structure
              const slug = categoryResponse.category.catName
                .toLowerCase()
                .replace(/\s+/g, "-");
              viewAllLink = `/category/${slug}`;
            }
          }
        }

        // Fetch products for this category
        const productsResponse = await getProducts({
          limit,
          category: categoryId || "",
          sort: "latest",
        });

        if (productsResponse && productsResponse.products) {
          setProducts(productsResponse.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error fetching category or products:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndProducts();

    // Activate header animation after component mounts
    const timer = setTimeout(() => setIsHeaderVisible(true), 100);
    return () => clearTimeout(timer);
  }, [categoryId, limit, viewAllLink]);

  // Get title from category if not provided
  const displayTitle =
    title || (category ? category.catName : "Featured Products");
  const displayDescription =
    description ||
    (category
      ? category.description ||
        "Discover our curated selection of high-quality products."
      : "Discover our curated selection of high-quality products.");
  const displayViewAllLink =
    viewAllLink || (category ? `/category/${category.id}` : "/products");

  // Choose Swiper effect based on prop
  let swiperProps = {};
  let swiperSlideClass = "";

  switch (swiperEffect) {
    case "cards":
      swiperProps = {
        effect: "cards",
        // Additional cards effect props can be added here
      };
      swiperSlideClass = "!w-72";
      break;
    case "coverflow":
      swiperProps = {
        effect: "coverflow",
        coverflowEffect: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        },
      };
      break;
    default:
      swiperProps = {}; // Standard grid/slider
  }

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex flex-col justify-center items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-gray-500 animate-pulse">
          Loading {category ? category.catName : "products"}...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[300px] flex justify-center items-center bg-red-50 rounded-2xl">
        <div className="text-center p-6">
          <p className="text-red-500 font-medium text-lg mb-2">
            Oops! Something went wrong
          </p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full min-h-[300px] flex justify-center items-center bg-gray-50 rounded-2xl">
        <div className="text-center p-6">
          <p className="text-gray-500 font-medium text-lg mb-2">
            No products available
          </p>
          <p className="text-gray-400">
            Check back soon for new arrivals in this category!
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full py-16 px-4 md:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: isHeaderVisible ? 1 : 0,
            y: isHeaderVisible ? 0 : -20,
          }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-3 relative inline-block">
            {displayTitle}
            <span className="absolute bottom-1 left-0 w-full h-3 bg-indigo-100 -z-10 transform -rotate-1"></span>
          </h2>
          <p className="text-gray-600 max-w-2xl">{displayDescription}</p>
        </motion.div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4 w-full justify-between">
            <div className="hidden md:flex gap-2">
              <button
                ref={prevRef}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors"
                aria-label="Previous slide"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                ref={nextRef}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-colors"
                aria-label="Next slide"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <Link
              href={displayViewAllLink}
              className="inline-flex items-center px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full font-medium transition-colors"
            >
              View All
              <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
        </div>

        <Swiper
          modules={[Navigation, Autoplay, Pagination]}
          spaceBetween={24}
          slidesPerView={1}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          loop={products.length > 1}
          {...swiperProps}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            768: {
              slidesPerView: 3,
            },
            1024: {
              slidesPerView: 4,
            },
          }}
          className="pb-14"
          onInit={(swiper) => {
            // Update navigation references after Swiper initialization
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
            swiper.navigation.init();
            swiper.navigation.update();
          }}
        >
          {products.map((product, index) => (
            <SwiperSlide
              key={product?.id || index}
              className={swiperSlideClass}
            >
              <ProductCard product={product} index={index} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default CategoryProductSlider;
