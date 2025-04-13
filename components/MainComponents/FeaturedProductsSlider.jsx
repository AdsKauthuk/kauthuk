"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// Import the getProducts server action
import { getProducts } from "@/actions/product";

// Import the ProductCard component from your existing slider
import ProductCard from "@/components/MainComponents/ProductCard"; // Update path if needed

// Import styles
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";

const FeaturedProductsSlider = ({
  title = "Featured Products",
  viewAllLink = "/products?featured=yes",
  limit = 8,
  displayType = "default",
  showBadge = true,
  badgeText = "Featured",
  bgColor = "#FFFBF9",
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);

        const params = {
          limit,
          featured: "yes", // This is the key difference - we're specifically requesting featured products
        };

        const response = await getProducts(params);

        if (response && response.products) {
          setProducts(response.products);
        }
      } catch (err) {
        console.error("Error fetching featured products:", err);
        setError("Failed to load featured products");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, [limit]);

  // Swiper configuration based on displayType
  let swiperEffect = {};
  let swiperSlideClass = "";

  switch (displayType) {
    case "cards":
      swiperEffect = { effect: "cards" };
      swiperSlideClass = "!w-72";
      break;
    case "coverflow":
      swiperEffect = {
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
      swiperEffect = {}; // Standard grid/slider
  }

  // Loading state
  if (loading) {
    return (
      <section className="w-full py-12" style={{ backgroundColor: bgColor }}>
        <div className="mx-auto px-12">
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-6 w-24 bg-gray-200 rounded-md animate-pulse"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden bg-white shadow-sm animate-pulse"
              >
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded-md w-3/4 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded-md w-1/3 mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="w-full py-12" style={{ backgroundColor: bgColor }}>
        <div className="mx-auto px-12">
          <h2 className="text-2xl md:text-3xl font-playfair font-bold mb-6 text-gray-800 category-heading">
            {title}
          </h2>
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center font-poppins">
            {error}
          </div>
        </div>
      </section>
    );
  }

  // No products state
  if (products.length === 0) {
    return null; // Don't render anything if no featured products exist
  }

  return (
    <section className="w-full py-12" style={{ backgroundColor: bgColor }}>
      <div className="mx-auto px-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-gray-800 category-heading">
              {title}
            </h2>
          </div>

          <Link
            href={viewAllLink}
            className="group flex items-center font-poppins text-[#6B2F1A] font-medium text-sm hover:text-[#8B3F2A] transition-colors"
          >
            View All Featured
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="relative">
          {/* Left arrow */}
          <button
            ref={prevRef}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[#6B2F1A] hover:bg-[#fee3d8] transition-colors transform -translate-x-5"
            aria-label="Previous products"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right arrow */}
          <button
            ref={nextRef}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[#6B2F1A] hover:bg-[#fee3d8] transition-colors transform translate-x-5"
            aria-label="Next products"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div>
            <Swiper
              modules={[Navigation, Autoplay, Pagination]}
              spaceBetween={20}
              slidesPerView={2}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              loop={products.length > 4}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              {...swiperEffect}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 30,
                },
              }}
              onInit={(swiper) => {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
                swiper.navigation.init();
                swiper.navigation.update();
              }}
              className="pb-10 pt-2"
            >
              {products.map((product, index) => (
                <SwiperSlide
                  key={product.id}
                  className={cn("h-full", swiperSlideClass)}
                >
                  <ProductCard
                    id={product.id}
                    title={product.title}
                    price_rupees={product.price_rupees}
                    images={product.ProductImages}
                    index={index}
                    featured={true} // Add a prop to indicate this is a featured product
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductsSlider;
