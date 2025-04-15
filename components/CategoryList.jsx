"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { getCategories3 } from "@/actions/category";

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { categories: fetchedCategories } = await getCategories3();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    document.body.classList.add("has-mega-menu");

    return () => {
      document.body.classList.remove("has-mega-menu");
    };
  }, []);

  

  if (loading) {
    return (
      <div className="flex items-center justify-between py-5 px-4 overflow-x-auto pb-8">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="h-5  w-24 mx-2"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <nav className="">
      {/* Main Categories */}
      <div className="flex items-center gap-10 py-[0.6rem] px-4 max-w-7xl">
        {categories
          .filter((category) => category.showHome === "active")
          .map((category, index) => (
            <div
              key={category.id}
              className="relative mega-menu-item group"
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {/* Add an invisible overlay to prevent hover gaps */}
              <div className="absolute -inset-2 z-0 pointer-events-none group-hover:pointer-events-auto"></div>

              <Link
                href={`/category/${category.id}`}
                className="whitespace-nowrap py-2 text-lg font-bold uppercase text-[#fee3d8] transition-colors relative hover:text-[#8D4425] flex items-center poppins-black"
              >
                <span className="relative  flex-shrink-0">
                  <div className="relative w-[35px] h-[35px] ">
                    <Image
                      src={`https://greenglow.in/kauthuk_test/${category.image}`}
                      fill
                      alt={category.catName}
                      className="object-contain"
                      onError={(e) => {
                        e.target.src = "/assets/images/decor.png"; // Fallback image
                      }}
                    />
                  </div>
                </span>
                {category.catName}
                <span className="category-underline"></span>
              </Link>

              {/* Dropdown menu - visibility now controlled by group hover */}
              {category.SubCategory?.length > 0 && (
                <div
                  className="absolute left-0 top-[58px] bg-[#fee3d8] shadow-md rounded-b-md z-50 w-[250px] py-3 mega-menu-dropdown text-[#6B2F1A] hidden group-hover:block"
                  style={{
                    borderTop: "2px solid #6B2F1A",
                    marginTop: "1px", // Add a tiny margin to ensure there's no gap
                  }}
                >
                  <div className="px-2">
                    <div className="grid grid-cols-1 gap-1">
                      {category.SubCategory.map((subcat) => (
                        <Link
                          key={subcat.id}
                          href={`/subcategory/${subcat.id}`}
                          className="flex items-center justify-between px-4 py-2 text-sm text-black hover:bg-[#F9F4F0] hover:text-[#6B2F1A] rounded-md transition-colors category-heading"
                        >
                          <span>{subcat.subcategory}</span>
                          <ChevronRight className="h-4 w-4 opacity-70" />
                        </Link>
                      ))}
                    </div>

                    <div className="pt-3 mt-3 border-t border-gray-100 px-4">
                      <Link
                        href={`/category/${category.id}`}
                        className="flex items-center text-left w-full text-sm font-medium text-black hover:text-[#5A2814] rounded-md transition-colors playfair-italic"
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </nav>
  );
};

export default CategoryList;
