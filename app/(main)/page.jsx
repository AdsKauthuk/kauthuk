"use client";

import { getCategoriesAndSubcategories } from '@/actions/product';
import Hero from '@/components/MainComponents/Hero';
import ProductSlider from '@/components/MainComponents/ProductSlider';
import FeaturedProductsSlider from '@/components/MainComponents/FeaturedProductsSlider'; // Import the new component
import QuickContact from '@/components/MainComponents/QuickContact';
import TestimonialSlider from '@/components/MainComponents/TestimonialSlider';
import PromotionalBanner from '@/components/MainComponents/PromotionalBanner';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const MainPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch categories for the product sliders
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await getCategoriesAndSubcategories();
        
        if (categoriesData && categoriesData.length > 0) {
          // Get only active categories with products
          setCategories(categoriesData);
        } else {
          setError("No categories available");
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError("Failed to load product categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // If we're loading, show a loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#6B2F1A] mb-4" />
        <p className="text-gray-500 animate-pulse">Loading amazing products...</p>
      </div>
    );
  }

  // If there was an error, still show the page but without category data
  const featuredCategories = categories.slice(0, 3); // Get first 3 categories for the sliders

  return (
    <div className=''>
      <Hero />
      
      {/* Featured Products Slider - Always show at the top if there are featured products */}
      <FeaturedProductsSlider 
        title="Our Featured Collection"
        viewAllLink="/products?featured=yes"
        limit={8}
        showBadge={true}
        badgeText="Featured"
        bgColor="#FFF5F1"
      />
      
      {/* Featured Categories Sliders - First slider */}
      {featuredCategories.length > 0 ? (
        <>
          {/* First product slider */}
          <ProductSlider 
            key={featuredCategories[0].id}
            category={featuredCategories[0].id} 
            title={`${featuredCategories[0].catName} Collection`} 
            viewAllLink={`/category/${featuredCategories[0].id}`}
            limit={8}
          />
          
          {/* Promotional Banner - after first slider */}
          <PromotionalBanner 
            title="STARTING ₹99" 
            subtitle="Kids collection"
            imagePath="/assets/images/banner.jpg"
            bgColor="#F9EBD7"
            link="/category/kids"
          />
          
          {/* Remaining product sliders */}
          {featuredCategories.slice(1, 3).map((category, index) => {
            // Define different title suffixes based on the index
            const titleSuffixes = ["Products", "Showcase"];
            // Define different display types if needed
            const displayTypes = ["coverflow", "cards"];
            
            return (
              <ProductSlider 
                key={category.id}
                category={category.id} 
                title={`${category.catName} ${titleSuffixes[index] || "Collection"}`} 
                viewAllLink={`/category/${category.id}`}
                // displayType={displayTypes[index] || "default"}
                limit={8}
              />
            );
          })}
          
          {/* Second Promotional Banner - before testimonials */}
          <PromotionalBanner 
            title="HANDCRAFTED" 
            subtitle="Aranmula Kannadi"
            imagePath="/assets/images/banner.jpg"
            bgColor="#E7DFD8"
            link="/product/aranmula-mirror"
          />
        </>
      ) : (
        // Fallback if no categories found
        <>
          <ProductSlider title="Featured Products" viewAllLink="/products" limit={8} />
          
          {/* Promotional Banner - even if no categories */}
          <PromotionalBanner 
            title="STARTING ₹99" 
            subtitle="Kids collection"
            imagePath="/assets/images/banner.jpg"
            bgColor="#F9EBD7"
            link="/category/kids"
          />
          
          <ProductSlider title="New Arrivals" viewAllLink="/products?sort=latest" displayType="coverflow" limit={8} />
          <ProductSlider title="Popular Items" viewAllLink="/products?sort=popular" displayType="cards" limit={8} />
        </>
      )}
      
      {/* Testimonials */}
      <TestimonialSlider />
      
      {/* Quick Contact floating button and form */}
      <QuickContact />
    </div>
  );
};

export default MainPage;