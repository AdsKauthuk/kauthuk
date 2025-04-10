"use client";

import React from "react";

const Skeleton = () => {
  return (
    <section className="relative w-full h-[65vh] md:h-[75vh] overflow-hidden animate-pulse">
      {/* Background Skeleton */}
      <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30 z-10" />
      
      {/* Content Skeleton */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 lg:px-24">
        <div className="max-w-screen-xl mx-auto w-full">
          <div className="max-w-2xl space-y-6">
            <div className="h-5 w-32 bg-gray-400 dark:bg-gray-600 rounded" />
            <div className="h-12 md:h-16 lg:h-20 w-3/4 bg-gray-400 dark:bg-gray-600 rounded" />
            <div className="h-4 w-1/2 bg-gray-400 dark:bg-gray-600 rounded" />
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="h-12 w-40 bg-gray-400 dark:bg-gray-600 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Skeleton */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 w-12 h-12 bg-gray-400 dark:bg-gray-600 rounded-full hidden md:flex" />
      <div className="absolute top-1/2 right-8 -translate-y-1/2 w-12 h-12 bg-gray-400 dark:bg-gray-600 rounded-full hidden md:flex" />
    </section>
  );
};

export default Skeleton;
