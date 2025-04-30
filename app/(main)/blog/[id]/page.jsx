"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getOneBlog, getBlogs } from "@/actions/blog";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Share2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import rehypeRaw from 'rehype-raw';
import { FaFacebook, FaTwitter, FaPinterest, FaWhatsapp } from 'react-icons/fa';

// Estimated reading time calculation
const calculateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime < 1 ? 1 : readingTime;
};

const BlogDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readingTime, setReadingTime] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogData = async () => {
      setLoading(true);
      try {
        const blogId = parseInt(id);
        if (isNaN(blogId)) {
          throw new Error("Invalid blog ID");
        }

        const blogData = await getOneBlog(blogId);
        setBlog(blogData);
        
        // Calculate reading time
        setReadingTime(calculateReadingTime(blogData.description));
        
        // Fetch related blogs (latest blogs excluding current one)
        const { blogs: allBlogs } = await getBlogs({ limit: 4, sort: "latest" });
        setRelatedBlogs(allBlogs.filter(b => b.id !== blogId).slice(0, 3));
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError("This blog post doesn't exist or has been removed.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBlogData();
    }
  }, [id]);

  // Share functionality
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = blog?.title || 'Blog post from Kauthuk';

  const shareLinks = [
    {
      name: 'Facebook',
      icon: <FaFacebook className="h-4 w-4" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Twitter',
      icon: <FaTwitter className="h-4 w-4" />,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'Pinterest',
      icon: <FaPinterest className="h-4 w-4" />,
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'WhatsApp',
      icon: <FaWhatsapp className="h-4 w-4" />,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`
    }
  ];

  if (loading) {
    return (
      <div className="w-full bg-[#f8f5f0] min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className=" mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="flex space-x-4 mb-6">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-[#f8f5f0] min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md text-center">
            <h1 className="text-2xl font-bold text-[#7B3B24] mb-4 font-playfair">Blog Not Found</h1>
            <p className="text-gray-600 mb-6 font-poppins">{error}</p>
            <Button 
              onClick={() => router.push('/blog')}
              className="bg-[#7B3B24] hover:bg-[#5A2714] text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f8f5f0]">
      {blog && (
        <>
          {/* Back Navigation */}
          <div className="container mx-auto px-4 py-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/blog')}
              className="text-[#7B3B24] hover:bg-[#7B3B24]/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </div>

          {/* Blog Header */}
          <div className="container mx-auto px-4 pb-8">
            <div className=" mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-[#7B3B24] mb-4 font-playfair">
                {blog.title}
              </h1>
              
              <div className="flex flex-wrap items-center text-sm text-gray-600 mb-6 font-poppins gap-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-[#7B3B24]" />
                  {format(new Date(blog.date), "MMMM dd, yyyy")}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-[#7B3B24]" />
                  {readingTime} min read
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {blog.image && (
            <div className="container mx-auto px-4 pb-8">
              <div className=" mx-auto">
                <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={`https://greenglow.in/kauthuk_test/${blog.image}`}
                    alt={blog.title}
                    fill
                    className="object-cover"
                    priority
                    onError={(e) => {
                      e.target.src = "/assets/images/blog-placeholder.jpg";
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Blog Content */}
          <div className="container mx-auto px-4 py-8">
            <div className=" mx-auto">
              <div className="bg-white rounded-lg shadow-md p-6 md:p-8 mb-8">
                <div className="prose prose-stone max-w-none font-poppins">
                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {blog.description}
                  </ReactMarkdown>
                </div>

                {/* Share Section */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-medium text-[#7B3B24] font-playfair flex items-center">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share This Article
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {shareLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#7B3B24]/10 hover:bg-[#7B3B24] hover:text-white text-[#7B3B24] transition-colors"
                          aria-label={`Share on ${link.name}`}
                        >
                          {link.icon}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Posts */}
          {relatedBlogs.length > 0 && (
            <div className="bg-[#7B3B24]/5 py-12">
              <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold text-[#7B3B24] mb-8 text-center font-playfair">
                  Related Articles
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-auto">
                  {relatedBlogs.map((relatedBlog) => (
                    <Link
                      href={`/blog/${relatedBlog.id}`}
                      key={relatedBlog.id}
                      className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <div className="relative h-48 overflow-hidden">
                        {relatedBlog.image ? (
                          <Image
                            src={`https://greenglow.in/kauthuk_test/${relatedBlog.image}`}
                            alt={relatedBlog.title}
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
                          {format(new Date(relatedBlog.date), "MMMM dd, yyyy")}
                        </div>
                        <h3 className="text-lg font-bold text-[#7B3B24] mb-2 font-playfair line-clamp-2 group-hover:text-[#5A2714] transition-colors duration-300">
                          {relatedBlog.title}
                        </h3>
                        <div className="mt-2 text-[#7B3B24] font-medium text-sm font-poppins flex items-center group-hover:text-[#5A2714]">
                          Read more
                          <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                <div className="text-center mt-8">
                  <Link href="/blog">
                    <Button 
                      className="bg-[#7B3B24] hover:bg-[#5A2714] text-white"
                    >
                      View All Articles
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlogDetailPage;