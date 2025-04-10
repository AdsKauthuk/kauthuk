"use client";

import { useEffect, Suspense } from 'react';
import ProductListingPage from "@/components/ProductListingPage";

// Separate component for handling search params
function SearchParamsHandler() {
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  // Set page title based on search query
  useEffect(() => {
    if (query) {
      document.title = `Search: ${query} | Your Store Name`;
    } else {
      document.title = "Search | Your Store Name";
    }
  }, [query]);
  
  return null;
}

export default function SearchPage() {
  return (
    <main>
      {/* Suspense boundary for search params handling */}
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>
      
      {/* The ProductListingPage component handles the search parameter internally */}
      <ProductListingPage />
    </main>
  );
}