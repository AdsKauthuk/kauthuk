"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getBlogs } from "@/actions/blog";
import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const { blogs: fetchedBlogs, totalPages: pages } = await getBlogs({
          page: currentPage,
          limit: 6,
          search: searchQuery,
          sort: "latest",
        });
        setBlogs(fetchedBlogs);
        setTotalPages(pages);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [currentPage, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePagination = (page) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentPage(page);
  };

  return (
    <div className="w-full bg-[#f8f5f0]">
      {/* Hero Section */}
      <div className="relative w-full h-64 md:h-80">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7B3B24]/90 to-[#5A2714]/90">
          <div className="absolute inset-0 bg-[url('/assets/images/pattern.png')] opacity-10 mix-blend-overlay" />
        </div>
        <div className="container mx-auto px-4 h-full flex flex-col justify-center items-center text-center relative z-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 font-playfair">
            Our Blog
          </h1>
          <p className="text-white/90 max-w-2xl text-sm md:text-base font-poppins">
            Discover the stories behind our handcrafted products, sustainable practices, 
            and the artisans who bring our vision to life.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Search and Filters */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
            <Input
              type="text"
              placeholder="Search our blog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-[#7B3B24]/20 focus-visible:ring-[#7B3B24]"
            />
            <Button 
              type="submit" 
              className="bg-[#7B3B24] hover:bg-[#5A2714] text-white"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {loading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div 
                key={item} 
                className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse"
              >
                <div className="h-48 bg-gray-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length > 0 ? (
          /* Blog Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Link 
                href={`/blog/${blog.id}`} 
                key={blog.id}
                className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  {blog.image ? (
                    <Image
                      src={`https://greenglow.in/kauthuk_test/${blog.image}`}
                      alt={blog.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = "/assets/images/blog-placeholder.jpg";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#7B3B24]/10 flex items-center justify-center text-[#7B3B24]">
                      <span className="text-xs">No image available</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center text-xs text-[#7B3B24]/80 mb-2 font-poppins">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(blog.date), "MMMM dd, yyyy")}
                  </div>
                  <h2 className="text-xl font-bold text-[#7B3B24] mb-2 font-playfair line-clamp-2 group-hover:text-[#5A2714] transition-colors duration-300">
                    {blog.title}
                  </h2>
                  <div className="text-sm text-gray-600 line-clamp-3 font-poppins">
                    {/* Strip markdown formatting for preview */}
                    {blog.description.replace(/[#*`_~]/g, "").substring(0, 120)}...
                  </div>
                  <div className="mt-4 text-[#7B3B24] font-medium text-sm font-poppins flex items-center group-hover:text-[#5A2714]">
                    Read more
                    <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="bg-white rounded-lg p-8 max-w-md mx-auto shadow-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#7B3B24]/10 flex items-center justify-center text-[#7B3B24]">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-[#7B3B24] mb-2 font-playfair">No blogs found</h3>
              <p className="text-gray-600 mb-4 font-poppins">
                {searchQuery 
                  ? `No results for "${searchQuery}". Try a different search term.` 
                  : "We haven't published any blog posts yet. Check back soon!"}
              </p>
              {searchQuery && (
                <Button 
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  className="border-[#7B3B24] text-[#7B3B24] hover:bg-[#7B3B24] hover:text-white"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePagination(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-[#7B3B24]/30 text-[#7B3B24] hover:bg-[#7B3B24]/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePagination(i + 1)}
                  className={currentPage === i + 1 
                    ? "bg-[#7B3B24] hover:bg-[#5A2714] text-white" 
                    : "border-[#7B3B24]/30 text-[#7B3B24] hover:bg-[#7B3B24]/10"}
                >
                  {i + 1}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePagination(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-[#7B3B24]/30 text-[#7B3B24] hover:bg-[#7B3B24]/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;