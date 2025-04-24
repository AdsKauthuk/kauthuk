"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  ChevronRight,
  Grid3x3,
  Rows3,
  ArrowRight,
  Tag,
  Filter,
  Box,
  LayoutGrid,
  Check,
  PanelTop,
  Search,
} from "lucide-react";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Import server actions
import { getProducts } from "@/actions/product";
import { getSubcategories, getCategoryBySlug } from "@/actions/category";

// Import ProductCard from your existing component
import ProductCard from "@/components/ProductCard";

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

const CategoryPage = () => {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params?.id; // This is the slug, not the ID

  // State variables
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [layout, setLayout] = useState("grid");
  const [currentSubcategory, setCurrentSubcategory] = useState("all");
  const [sortOption, setSortOption] = useState("latest");
  const [productCount, setProductCount] = useState(0);

  // Fetch category by slug, then subcategories and initial products
  useEffect(() => {
    if (!categorySlug) {
      setError("Category slug is required");
      setLoading(false);
      return;
    }

    const fetchCategoryData = async () => {
      try {
        setLoading(true);

        // First, fetch the category by slug
        const categoryResponse = await getCategoryBySlug(categorySlug, true);
        
        if (!categoryResponse.success || !categoryResponse.category) {
          throw new Error(
            categoryResponse.error || "Failed to fetch category"
          );
        }

        // Set category data
        const categoryData = categoryResponse.category;
        setCategory(categoryData);
        
        // Set subcategories from the response
        if (categoryData.SubCategory) {
          setSubcategories(categoryData.SubCategory);
          
          // Get product count from subcategories
          const totalProducts = categoryData.SubCategory.reduce(
            (total, sub) => total + (sub.productCount || 0),
            0
          );
          setProductCount(totalProducts);
        }

        // Fetch products for this category
        const productsResponse = await getProducts({
          category: categoryData.id.toString(),
          limit: 12,
          sort: sortOption,
        });

        if (productsResponse && productsResponse.products) {
          setProducts(productsResponse.products);

          // Set featured products (first 4 products)
          setFeaturedProducts(productsResponse.products.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching category data:", err);
        setError(err.message || "Failed to load category data");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [categorySlug]);

  // Handle subcategory change
  const handleSubcategoryChange = async (subcategoryId) => {
    try {
      setLoading(true);

      // If "all" is selected, fetch all products from the category
      if (subcategoryId === "all") {
        const response = await getProducts({
          category: category.id.toString(),
          limit: 12,
          sort: sortOption,
        });

        if (response && response.products) {
          setProducts(response.products);
          setCurrentSubcategory("all");
        }
      } else {
        // Fetch products for the selected subcategory
        const response = await getProducts({
          subcategory: subcategoryId,
          limit: 12,
          sort: sortOption,
        });

        if (response && response.products) {
          setProducts(response.products);
          setCurrentSubcategory(subcategoryId);
        }
      }
    } catch (err) {
      console.error("Error fetching subcategory products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle sort change
  const handleSortChange = async (option) => {
    try {
      setLoading(true);
      setSortOption(option);

      // If a subcategory is selected, fetch products for that subcategory with the new sort option
      if (currentSubcategory !== "all") {
        const response = await getProducts({
          subcategory: currentSubcategory,
          limit: 12,
          sort: option,
        });

        if (response && response.products) {
          setProducts(response.products);
        }
      } else {
        // Fetch all products for the category with the new sort option
        const response = await getProducts({
          category: category.id.toString(),
          limit: 12,
          sort: option,
        });

        if (response && response.products) {
          setProducts(response.products);
        }
      }
    } catch (err) {
      console.error("Error fetching sorted products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && !products.length) {
    return (
      <div className="min-h-screen bg-[#FFFBF9] flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#6B2F1A] mb-4" />
        <p className="font-poppins text-gray-600 animate-pulse text-lg">
          Loading category...
        </p>
      </div>
    );
  }

  // Error state
  if (error && !products.length) {
    return (
      <div className="min-h-screen bg-[#FFFBF9] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="bg-[#fee3d8] p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Tag className="h-8 w-8 text-[#6B2F1A]" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-[#6B2F1A] mb-2">
            Category Not Found
          </h2>
          <p className="font-poppins text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => router.push("/products")}
            className="bg-[#6B2F1A] hover:bg-[#5A2814] text-white font-poppins"
          >
            Browse All Products
          </Button>
        </div>
      </div>
    );
  }

  // Check if banner image exists
  const hasBanner = category?.banner || false;

  return (
    <div className="bg-[#FFFBF9] min-h-screen">
      {/* Category Hero Section - Modified for banner image */}
      <div
        className={`relative overflow-hidden ${
          hasBanner ? "text-[#6B2F1A]" : "bg-[#b38d4a] text-white"
        }`}
        style={{
          minHeight: "200px",
        }}
      >
        {/* Banner image if it exists */}
        {hasBanner && (
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={`https://greenglow.in/kauthuk_test/${category.banner}`}
              alt={category?.catName || "Category banner"}
              fill
              priority
              className="object-cover"
              sizes="100vw"
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(
                shimmer(700, 475)
              )}`}
            />
            {/* Semi-transparent overlay for better text visibility */}
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        )}

        {/* Decorative Elements - only show if no banner image */}
        {!hasBanner && (
          <>
            <div className="absolute -right-24 top-0 w-64 h-64 rounded-full bg-white/5 opacity-50"></div>
            <div className="absolute -left-16 bottom-0 w-48 h-48 rounded-full bg-white/5 opacity-50"></div>
          </>
        )}

        <div className="container  px-10 py-5 relative z-10">
          <Breadcrumb className="mb-8 text-xs">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/"
                  className={`hover:opacity-100 font-poppins text-xs ${
                    hasBanner
                      ? "text-[#6B2F1A]/80 hover:text-[#6B2F1A]"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator
                className={hasBanner ? "text-[#6B2F1A]/60" : "text-white/60"}
              />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/products"
                  className={`hover:opacity-100 font-poppins text-xs ${
                    hasBanner
                      ? "text-[#6B2F1A]/80 hover:text-[#6B2F1A]"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  Products
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator
                className={hasBanner ? "text-[#6B2F1A]/60" : "text-white/60"}
              />
              <BreadcrumbItem>
                <BreadcrumbLink
                  className={`font-medium font-poppins text-xs ${
                    hasBanner ? "text-[#6B2F1A]" : "text-white"
                  }`}
                >
                  {category?.catName || "Category"}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1
                className={`playfair-italic text-4xl md:text-5xl font-bold mb-4 ${
                  hasBanner ? "text-[#6B2F1A]" : "text-white"
                }`}
              >
                {category?.catName || "Category"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories Section */}
      {/* 
  Dynamic centered cards solution
  This uses a JavaScript approach to calculate positioning and insert appropriate spacers
*/}

<section className="py-10 bg-[#FFFBF9] px-10">
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="playfair-italic text-2xl md:text-3xl font-bold text-[#6B2F1A] mb-2">
          Browse by Subcategory
        </h2>
      </div>
    </div>

    {/* Dynamic card rendering with JavaScript for perfect centering */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {(() => {
        // Combine "All" card with subcategories for processing
        const allItems = [
          { 
            id: 'all', 
            type: 'all',
            subcategory: 'All',
            _count: { Product: productCount }
          },
          ...subcategories
        ];
        
        // Calculate items per row based on screen size (simplified approach)
        const itemsPerRow = 6; // For desktop view (lg)
        
        // Calculate total rows needed
        const totalRows = Math.ceil(allItems.length / itemsPerRow);
        
        // Process each row
        const rows = [];
        for (let i = 0; i < totalRows; i++) {
          const startIdx = i * itemsPerRow;
          const endIdx = Math.min(startIdx + itemsPerRow, allItems.length);
          const rowItems = allItems.slice(startIdx, endIdx);
          
          // Calculate how many empty slots needed on each side for centering
          const emptySlots = itemsPerRow - rowItems.length;
          const leftPadding = Math.floor(emptySlots / 2);
          
          // Add left padding spacers if needed
          for (let j = 0; j < leftPadding; j++) {
            rows.push(
              <div key={`spacer-${i}-left-${j}`} className="hidden lg:block"></div>
            );
          }
          
          // Add the actual items
          rowItems.forEach((item) => {
            if (item.type === 'all') {
              // Render the "All" card
              rows.push(
                <Card
                  key="all"
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    currentSubcategory === "all"
                      ? "border-[#6B2F1A] ring-2 ring-[#6B2F1A] ring-opacity-20 shadow-md"
                      : "hover:border-[#6B2F1A]/30 border border-gray-200"
                  }`}
                  onClick={() => handleSubcategoryChange("all")}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        currentSubcategory === "all"
                          ? "bg-[#fee3d8] text-[#6B2F1A]"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <LayoutGrid className="h-6 w-6" />
                    </div>
                    <h3 className="font-playfair font-medium text-[#6B2F1A] text-center w-full">
                      All
                    </h3>
                    <p className="font-poppins text-xs text-gray-500 mt-1 text-center w-full">
                      {productCount} items
                    </p>
                    {currentSubcategory === "all" && (
                      <Badge className="mt-2 bg-[#fee3d8] text-[#6B2F1A] border-none font-poppins">
                        <Check className="mr-1 h-3 w-3" />
                        Selected
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            } else {
              // Render subcategory cards
              rows.push(
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    currentSubcategory === item.id
                      ? "border-[#6B2F1A] ring-2 ring-[#6B2F1A] ring-opacity-20 shadow-md"
                      : "hover:border-[#6B2F1A]/30 border border-gray-200"
                  }`}
                  onClick={() => handleSubcategoryChange(item.id)}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                        currentSubcategory === item.id
                          ? "bg-[#fee3d8] text-[#6B2F1A]"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.image ? (
                        <div className="relative w-12 h-12">
                          <Image
                            src={`https://greenglow.in/kauthuk_test/${item.image}`}
                            alt={item.subcategory}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <Box className="h-12 w-12" />
                      )}
                    </div>
                    <h3 className="font-playfair font-medium text-[#6B2F1A] text-center w-full mx-auto">
                      {item.subcategory}
                    </h3>
                    <p className="font-poppins text-sm text-gray-500 mt-1 text-center w-full mx-auto">
                      {item.productCount || 0} items
                    </p>
                    {currentSubcategory === item.id && (
                      <Badge className="mt-2 bg-[#fee3d8] text-[#6B2F1A] border-none font-poppins">
                        <Check className="mr-1 h-3 w-3" />
                        Selected
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            }
          });
          
          // Add right padding spacers if needed
          const rightPadding = emptySlots - leftPadding;
          for (let j = 0; j < rightPadding; j++) {
            rows.push(
              <div key={`spacer-${i}-right-${j}`} className="hidden lg:block"></div>
            );
          }
        }
        
        return rows;
      })()}
    </div>
  </div>
</section>

      {/* Products Grid Section */}
      <section className="py-10 bg-white px-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="playfair-italic text-2xl md:text-3xl font-bold text-[#b38d4a] mb-2">
                {currentSubcategory === "all"
                  ? `All ${category?.catName + " Products" || "Products"}`
                  : subcategories.find((s) => s.id === currentSubcategory)
                      ?.subcategory || "Products"}
              </h2>
              <p className="font-poppins text-gray-500 text-sm">
                {products.length} products found
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-[#F9F4F0] p-1 rounded-md">
                <button
                  type="button"
                  className={`p-2 rounded-md transition-colors ${
                    layout === "grid"
                      ? "bg-white text-[#6B2F1A] shadow-sm"
                      : "bg-transparent text-gray-600"
                  }`}
                  onClick={() => setLayout("grid")}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className={`p-2 rounded-md transition-colors ${
                    layout === "list"
                      ? "bg-white text-[#6B2F1A] shadow-sm"
                      : "bg-transparent text-gray-600"
                  }`}
                  onClick={() => setLayout("list")}
                  aria-label="List view"
                >
                  <Rows3 className="h-5 w-5" />
                </button>
              </div>

              <Tabs
                defaultValue={sortOption}
                onValueChange={handleSortChange}
                className="w-full md:w-auto"
              >
                <TabsList className="bg-[#F9F4F0] w-full md:w-auto">
                  <TabsTrigger
                    value="latest"
                    className="font-poppins data-[state=active]:bg-white data-[state=active]:text-[#6B2F1A] text-sm flex-1 md:flex-none"
                  >
                    Latest
                  </TabsTrigger>
                  <TabsTrigger
                    value="price_low"
                    className="font-poppins data-[state=active]:bg-white data-[state=active]:text-[#6B2F1A] text-sm flex-1 md:flex-none"
                  >
                    Price: Low to High
                  </TabsTrigger>
                  <TabsTrigger
                    value="price_high"
                    className="font-poppins data-[state=active]:bg-white data-[state=active]:text-[#6B2F1A] text-sm flex-1 md:flex-none"
                  >
                    Price: High to Low
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {loading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-[#6B2F1A] mb-4" />
              <p className="font-poppins text-gray-500 animate-pulse">
                Loading products...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-[#FFFBF9] rounded-xl p-12 text-center">
              <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-sm">
                <Search className="h-8 w-8 text-[#6B2F1A]/50" />
              </div>
              <h3 className="font-playfair text-xl font-medium text-[#6B2F1A] mb-2">
                No Products Found
              </h3>
              <p className="font-poppins text-gray-500 max-w-md mx-auto mb-6">
                We couldn't find any products in this subcategory. Please try
                another subcategory or check back later.
              </p>
              <Button
                onClick={() => handleSubcategoryChange("all")}
                className="bg-[#6B2F1A] hover:bg-[#5A2814] text-white font-poppins"
              >
                View All Products
              </Button>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                layout === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ProductCard product={product} layout={layout} />
                </motion.div>
              ))}
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-16 text-center">
              <Button
                onClick={() => router.push(`/products?category=${category.id}`)}
                variant="outline"
                className="border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#fee3d8] font-poppins group"
              >
                View All {category?.catName || "Products"}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;