"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Grid3x3,
  Loader2,
  PanelTop,
  Rows3,
  Tag,
  Search,
  ChevronRight,
  Check,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// UI Components
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import server actions
import { getSubcategoryBySlug } from "@/actions/subcategory";
import { getProducts } from "@/actions/product";

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

const SubcategoryPage = () => {
  const params = useParams();
  const router = useRouter();
  const subcategorySlug = params?.id; // This is actually the slug, not the ID

  // State variables
  const [subcategory, setSubcategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [layout, setLayout] = useState("grid");
  const [sortOption, setSortOption] = useState("latest");
  const [productCount, setProductCount] = useState(0);
  const [relatedSubcategories, setRelatedSubcategories] = useState([]);

  // Fetch subcategory and initial products on component mount
  useEffect(() => {
    if (!subcategorySlug) {
      setError("Subcategory slug is required");
      setLoading(false);
      return;
    }

    const fetchSubcategoryData = async () => {
      try {
        setLoading(true);

        // First, fetch the subcategory by slug along with related subcategories
        const subcategoryResponse = await getSubcategoryBySlug(subcategorySlug, true, true);
        
        if (!subcategoryResponse.success || !subcategoryResponse.subcategory) {
          throw new Error(subcategoryResponse.error || "Failed to fetch subcategory");
        }

        // Set subcategory data
        const subcategoryData = subcategoryResponse.subcategory;
        setSubcategory(subcategoryData);
        
        // Set product count
        setProductCount(subcategoryData.productCount || 0);
        
        // Set parent category if available
        if (subcategoryData.Category) {
          setParentCategory(subcategoryData.Category);
        }
        
        // Set related subcategories
        if (subcategoryResponse.relatedSubcategories) {
          setRelatedSubcategories(subcategoryResponse.relatedSubcategories);
        }

        // Now fetch products for this subcategory using the actual ID
        const productsResponse = await getProducts({
          subcategory: subcategoryData.id.toString(),
          limit: 20,
          sort: sortOption,
        });

        if (productsResponse && productsResponse.products) {
          setProducts(productsResponse.products);

          // Set featured products (first 4 products)
          setFeaturedProducts(productsResponse.products.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching subcategory data:", err);
        setError(err.message || "Failed to load subcategory data");
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategoryData();
  }, [subcategorySlug]);

  // Handle sort change
  const handleSortChange = async (option) => {
    if (!subcategory) return;
    
    try {
      setLoading(true);
      setSortOption(option);

      const response = await getProducts({
        subcategory: subcategory.id.toString(),
        limit: 20,
        sort: option,
      });

      if (response && response.products) {
        setProducts(response.products);
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
          Loading subcategory...
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
            Subcategory Not Found
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
  const hasBanner = subcategory?.banner || false;

  return (
    <div className="bg-[#FFFBF9] min-h-screen">
      {/* Subcategory Hero Section - Modified for banner image */}
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
              src={`https://greenglow.in/kauthuk_test/${subcategory.banner}`}
              alt={subcategory?.subcategory || "Subcategory banner"}
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

        <div className="container px-10 py-5 relative z-10">
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
              {parentCategory && (
                <>
                  <BreadcrumbSeparator
                    className={
                      hasBanner ? "text-[#6B2F1A]/60" : "text-white/60"
                    }
                  />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href={`/category/${parentCategory.slug}`}
                      className={`hover:opacity-100 font-poppins text-xs ${
                        hasBanner
                          ? "text-[#6B2F1A]/80 hover:text-[#6B2F1A]"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      {parentCategory.catName}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator
                className={hasBanner ? "text-[#6B2F1A]/60" : "text-white/60"}
              />
              <BreadcrumbItem>
                <BreadcrumbLink
                  className={`font-medium font-poppins text-xs ${
                    hasBanner ? "text-[#6B2F1A]" : "text-white"
                  }`}
                >
                  {subcategory?.subcategory || "Subcategory"}
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
                {subcategory?.subcategory || "Subcategory"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid Section */}
      <section className="py-10 bg-white px-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="playfair-italic text-2xl md:text-3xl font-bold text-[#b38d4a] mb-2">
                All {subcategory?.subcategory || "Products"}
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
              {parentCategory && (
                <Button
                  onClick={() => router.push(`/category/${parentCategory.slug}`)}
                  className="bg-[#6B2F1A] hover:bg-[#5A2814] text-white font-poppins"
                >
                  Back to {parentCategory.catName}
                </Button>
              )}
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

          {products.length > 0 && parentCategory && (
            <div className="mt-16 text-center">
              <Button
                onClick={() => router.push(`/category/${parentCategory.slug}`)}
                variant="outline"
                className="border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#fee3d8] font-poppins group"
              >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to {parentCategory.catName}
              </Button>
            </div>
          )}
        </div>
      </section>
      
      {/* Related Subcategories Section */}
      {relatedSubcategories.length > 0 && (
        <section className="py-10 bg-[#FFFBF9] px-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="playfair-italic text-2xl md:text-3xl font-bold text-[#6B2F1A] mb-2">
                  Related Subcategories
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedSubcategories.map((sub) => (
                <Card
                  key={sub.id}
                  className="cursor-pointer transition-all hover:shadow-md border border-gray-200 hover:border-[#6B2F1A]/30"
                  onClick={() => router.push(`/subcategory/${sub.slug}`)}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-[#fee3d8] text-[#6B2F1A]">
                      {sub.image ? (
                        <div className="relative w-12 h-12">
                          <Image
                            src={`https://greenglow.in/kauthuk_test/${sub.image}`}
                            alt={sub.subcategory}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <Box className="h-12 w-12" />
                      )}
                    </div>
                    <h3 className="font-playfair font-medium text-[#6B2F1A] line-clamp-1 text-lg">
                      {sub.subcategory}
                    </h3>
                    <p className="font-poppins text-sm text-gray-500 mt-1">
                      {sub._count?.Product || 0} items
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SubcategoryPage;