"use client";

import ProductListingPage from "@/components/ProductListingPage";

export default function SearchPage({ params, searchParams }) {
  return (
    <main>
      <ProductListingPage />
    </main>
  );
}

/**
 * To access the page with different search parameters, use the following routes:
 * 
 * 1. Basic search:
 *    /search?q=wallet
 * 
 * 2. Category-based search:
 *    /search?category=Electronics
 * 
 * 3. Combined search:
 *    /search?q=leather&category=Accessories
 * 
 * The component automatically reads these parameters and filters the products accordingly.
 * 
 * You can also integrate this component in your app/products/page.jsx file to make it your
 * main product browse page.
 */