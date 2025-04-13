"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getPageBanners } from "@/actions/banner"; // Use your banner actions

const PromotionalBanner = ({ displayPage = "home" }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const result = await getPageBanners(displayPage);
        if (result && result.banners) {
          setBanners(result.banners);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [displayPage]);

  if (loading || banners.length === 0) {
    return null;
  }

  // For this example, we'll just display the first banner
  const banner = banners[0];

  return (
    <div className="w-full my-10 overflow-hidden">
      <div 
        className="relative w-full flex items-center rounded-lg overflow-hidden"
        style={{ backgroundColor: "#F9EBD7" }} // You could add a bgColor field to your Banner model
      >
        {/* Left Content */}
        <div className="w-full md:w-1/2 p-6 md:p-12 z-10">
          <div className="space-y-4">
            <h2 
              className="text-4xl md:text-5xl font-bold text-[#6B2F1A]"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {banner.title}
            </h2>
            {banner.subtitle && (
              <p 
                className="text-2xl md:text-3xl text-gray-800"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {banner.subtitle}
              </p>
            )}
            {banner.buttonTitle && banner.buttonLink && (
              <div className="pt-4">
                <Link href={banner.buttonLink}>
                  <button 
                    className="px-6 py-3 bg-[#6B2F1A] text-white font-medium rounded-md
                             hover:bg-[#5A2814] transition-all duration-300 group flex items-center gap-2"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {banner.buttonTitle}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Image */}
        <div className="hidden md:block w-1/2 h-full absolute right-0 top-0 overflow-hidden">
          {banner.image && (
            <Image
              src={`https://greenglow.in/kauthuk_test/${banner.image}`} // Adjust path based on your setup
              alt={banner.subtitle || banner.title}
              width={600}
              height={400}
              className="w-full h-full object-cover object-center"
            />
          )}
        </div>

        {/* Mobile Background Image (only visible on small screens) */}
        <div className="absolute inset-0 md:hidden opacity-20">
          {banner.image && (
            <Image
              src={`https://greenglow.in/kauthuk_test/${banner.image}`} // Adjust path based on your setup
              alt={banner.subtitle || banner.title}
              fill
              className="object-cover object-center"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionalBanner;