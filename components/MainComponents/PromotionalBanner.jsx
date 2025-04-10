"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PromotionalBanner = ({ 
  title = "STARTING ₹99", 
  subtitle = "Kids collection", 
  imagePath = "/assets/images/banner.jpg",
  bgColor = "#F9EBD7",
  link = "/category/kids"
}) => {
  return (
    <div className="w-full my-10 overflow-hidden">
      <div 
        className="relative w-full flex items-center rounded-lg overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Left Content */}
        <div className="w-full md:w-1/2 p-6 md:p-12 z-10">
          <div className="space-y-4">
            <h2 
              className="text-4xl md:text-5xl font-bold text-[#6B2F1A]"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {title}
            </h2>
            <p 
              className="text-2xl md:text-3xl text-gray-800"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {subtitle}
            </p>
            <div className="pt-4">
              <Link href={link}>
                <button 
                  className="px-6 py-3 bg-[#6B2F1A] text-white font-medium rounded-md
                           hover:bg-[#5A2814] transition-all duration-300 group flex items-center gap-2"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Shop Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="hidden md:block w-1/2 h-full absolute right-0 top-0 overflow-hidden">
          <Image
            src={imagePath}
            alt={subtitle}
            width={600}
            height={400}
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Mobile Background Image (only visible on small screens) */}
        <div className="absolute inset-0 md:hidden opacity-20">
          <Image
            src={imagePath}
            alt={subtitle}
            fill
            className="object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
};



export default PromotionalBanner;