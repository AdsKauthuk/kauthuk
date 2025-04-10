"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { getSliders } from "@/actions/slider";

// Helper function for proper text casing
const formatText = (text, type) => {
  if (!text) return "";
  
  switch (type) {
    case "title":
      // Title case - capitalize first letter of each word
      return text.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    case "subtitle":
      // Uppercase for subtitles
      return text.toUpperCase();
    case "description":
      // Sentence case for descriptions - capitalize first letter only
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    case "button":
      // Title case for buttons
      return text.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    default:
      return text;
  }
};

const Skeleton = () => (
  <div className="relative w-full h-[500px] sm:h-[550px] md:h-[600px] bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
    <div className="text-gray-400 font-medium">Loading slider content...</div>
  </div>
);

const CustomNavButton = ({ direction, onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center 
             bg-black/20 backdrop-blur-sm rounded-full text-white border border-white/30
             hover:bg-black/30 transition-all duration-300 group
             opacity-0 sm:opacity-80 hover:opacity-100"
    style={{ 
      [direction === "prev" ? "left" : "right"]: "clamp(0.5rem, 3vw, 1.5rem)"
    }}
    aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
  >
    {direction === "prev" ? (
      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-0.5 transition-transform" />
    ) : (
      <ChevronRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-0.5 transition-transform" />
    )}
  </button>
);

const ProgressBar = ({ progress }) => (
  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-20">
    <div
      className="h-full bg-white transition-all duration-300 ease-out"
      style={{ width: `${progress}%` }}
    />
  </div>
);

const Hero = () => {
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sliders, setSliders] = useState([]);
  const [error, setError] = useState(null);
  const swiperRef = useRef(null);

  const fetchSliders = async () => {
    setLoading(true);
    try {
      const response = await getSliders({
        page: 1,
      });
      
      if (response && Array.isArray(response.sliders)) {
        setSliders(response.sliders);
      } else {
        setError("Failed to load slider data");
        console.error("Invalid slider data format:", response);
      }
    } catch (error) {
      setError("Failed to fetch sliders");
      console.error("Failed to fetch sliders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  // Fallback content if there are no sliders
  const noSlidersContent = (
    <div className="relative w-full h-[500px] sm:h-[550px] md:h-[600px] bg-[#6B2F1A] flex items-center justify-center">
      <div className="max-w-screen-xl mx-auto w-full px-6 md:px-16 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          Welcome to Kauthuk
        </h1>
        <p className="text-white/80 text-lg mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Discover our collection of beautiful handcrafted products
        </p>
        <Link href="/products">
          <button className="px-8 py-4 bg-[#a99052] text-[#6B2F1A] font-medium rounded-md hover:bg-[#a99052]/90 transition-all duration-300 flex items-center gap-2 mx-auto">
            SHOP NOW
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );

  if (loading) {
    return <Skeleton />;
  }

  if (error || !sliders || sliders.length === 0) {
    return noSlidersContent;
  }

  // Sample data for demonstration, matching your image
  const sampleSlide = {
    title: "THE HANDCRAFTED METAL MIRROR OF ARANMULA, KERALA",
    description: "A unique metal craft, the Aranmula Kannadi (Mirror) is the product of the ancient secret art of creating a mirror out of an alloy of copper and tin which dates back to the 18th century.",
    linkTitle: "SHOP NOW",
    link: "/category/metal-crafts"
  };

  // Add the sample slide if needed
  const enhancedSliders = sliders.length > 0 ? sliders : [sampleSlide];

  return (
    <section className="relative w-full h-[500px] sm:h-[550px] md:h-[600px] overflow-hidden">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        effect="fade"
        speed={1000}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          renderBullet: (index, className) => {
            return `<span class="${className} w-2 h-2 bg-white/50 hover:bg-white transition-all duration-300"></span>`;
          },
        }}
        onSlideChange={(swiper) => {
          setActiveIndex(swiper.realIndex);
          setProgress(0);
        }}
        onAutoplayTimeLeft={(_, time, progress) => {
          setProgress((1 - progress) * 100);
        }}
        modules={[Autoplay, Navigation, EffectFade, Pagination]}
        className="h-full w-full"
      >
        {enhancedSliders.map((slide, index) => (
          <SwiperSlide key={index} className="relative w-full h-full">
            {/* Dark gradient overlay for better text visibility - stronger on the right */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-black/70 z-10" />

            {slide.image ? (
              <Image
                src={`https://greenglow.in/kauthuk_test/${slide.image}`}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center transition-transform duration-[2s]"
                alt={slide.title || "Slide image"}
                onError={(e) => {
                  console.error(`Failed to load image: ${slide.image}`);
                  e.target.src = "/placeholder-image.jpg"; // Fallback image path
                }}
              />
            ) : (
              // Fallback background - use a darker color to match your design
              <div className="absolute inset-0 bg-[#1a1a1a]"></div>
            )}

            <div className="absolute inset-0 z-20 flex flex-col justify-center">
              <div className="container mx-auto px-6 md:px-16 lg:px-24">
                <div className="flex justify-end">
                  <div className="w-full md:w-1/2 lg:w-5/12 space-y-5 md:space-y-6 transform transition-all duration-700">
                    {/* Title with all caps to match design */}
                    <h1 
                      className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      {slide.title || sampleSlide.title}
                    </h1>

                    <div className="h-1 w-16 bg-[#a99052]"></div>

                    {/* Description with more spacing */}
                    <p 
                      className="text-white/90 text-sm md:text-base leading-relaxed"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {slide.description || sampleSlide.description}
                    </p>

                    {/* Button styled to match the golden button in your design */}
                    <div className="pt-4">
                      <Link href={slide.link || sampleSlide.link || "#"}>
                        <button
                          className="px-8 py-3 bg-[#a99052] text-[#6B2F1A] font-bold rounded-none
                                   hover:bg-[#a99052]/90 transition-all duration-300 group"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          {slide.linkTitle || sampleSlide.linkTitle}
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}

        <CustomNavButton
          direction="prev"
          onClick={() => swiperRef.current?.slidePrev()}
        />
        <CustomNavButton
          direction="next"
          onClick={() => swiperRef.current?.slideNext()}
        />

        <ProgressBar progress={progress} />
      </Swiper>
    </section>
  );
};

export default Hero;