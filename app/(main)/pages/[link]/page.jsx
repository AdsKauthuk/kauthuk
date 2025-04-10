"use client";

import { getSiteContentByPage } from "@/actions/site-content";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  CalendarCheck,
  ChevronRight,
  Clock,
  HomeIcon,
  LinkIcon,
  Share2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { format } from "date-fns";
import { useParams } from "next/navigation";

const SiteContentPage = () => {
  const searchParams = useParams();
  const pageId = searchParams.link;
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In your frontend component, update the fetchContent function:
    const fetchContent = async () => {
      if (!pageId) {
        setError("Page identifier is missing");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getSiteContentByPage(pageId);
        if (!data) {
          setError("Content not found");
        } else if (data.error) {
          setError(data.error);
        } else {
          setContent(data);
          setError(null);

          // Set page title
          if (data.title) {
            document.title = `${data.title} | Kauthuk`;
          }
        }
      } catch (err) {
        console.error("Error fetching content:", err);
        setError("Failed to load content");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [pageId]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: content?.title || "Shared content",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <Skeleton className="h-8 w-3/4 bg-[#fee3d8] rounded-lg" />
          <Skeleton className="h-4 w-1/2 bg-[#fee3d8] rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full bg-[#fee3d8] rounded-lg" />
            <Skeleton className="h-4 w-full bg-[#fee3d8] rounded-lg" />
            <Skeleton className="h-4 w-11/12 bg-[#fee3d8] rounded-lg" />
            <Skeleton className="h-4 w-3/4 bg-[#fee3d8] rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full bg-[#fee3d8] rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full bg-[#fee3d8] rounded-lg" />
            <Skeleton className="h-4 w-full bg-[#fee3d8] rounded-lg" />
            <Skeleton className="h-4 w-11/12 bg-[#fee3d8] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Card className="border-[#6B2F1A]/20 overflow-hidden">
          <CardHeader className="bg-[#fee3d8]/50 border-b border-[#6B2F1A]/20">
            <CardTitle className="text-[#6B2F1A]" style={{ fontFamily: "Playfair Display, serif" }}>
              Content Not Found
            </CardTitle>
            <CardDescription style={{ fontFamily: "Poppins, sans-serif" }}>
              We couldn't find the content you're looking for.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-[#fee3d8]/50 text-[#6B2F1A] mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              {error === "Page identifier is missing"
                ? "No page identifier was provided in the URL. Please specify a valid page."
                : "The requested content could not be found or may have been removed."}
            </p>
            <Link href="/">
              <Button className="bg-[#6B2F1A] hover:bg-[#5A2814] text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
                <HomeIcon size={16} className="mr-2" />
                Return to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-[#F9F4F0] pt-8 pb-16">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-8 text-sm text-gray-500">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/"
                className="flex items-center gap-1 text-[#6B2F1A] hover:text-[#5A2814]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <HomeIcon size={14} />
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight size={12} />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-gray-700" style={{ fontFamily: "Poppins, sans-serif" }}>
                {content?.title || pageId}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Content Card */}
        <Card className="border-[#6B2F1A]/10 shadow-md overflow-hidden">
          <CardHeader className="bg-white p-8 border-b border-[#6B2F1A]/10">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold text-[#6B2F1A] mb-3" style={{ fontFamily: "Playfair Display, serif" }}>
                  {content?.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm text-gray-500" style={{ fontFamily: "Poppins, sans-serif" }}>
                  <Clock size={14} />
                  <span>
                    Last updated:{" "}
                    {format(new Date(content?.updatedAt), "MMMM dd, yyyy")}
                  </span>
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#fee3d8]/50"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <Share2 size={16} className="mr-1" />
                Share
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <div 
              className="prose max-w-none prose-img:rounded-xl prose-headings:text-[#6B2F1A] prose-p:text-gray-700"
              style={{ 
                fontFamily: "Poppins, sans-serif",
                "--tw-prose-headings": "#6B2F1A",
                "--tw-prose-links": "#6B2F1A"
              }}
            >
              <ReactMarkdown 
                components={{
                  h1: ({node, ...props}) => <h1 style={{ fontFamily: "Playfair Display, serif" }} {...props} />,
                  h2: ({node, ...props}) => <h2 style={{ fontFamily: "Playfair Display, serif" }} {...props} />,
                  h3: ({node, ...props}) => <h3 style={{ fontFamily: "Playfair Display, serif" }} {...props} />,
                  h4: ({node, ...props}) => <h4 style={{ fontFamily: "Playfair Display, serif" }} {...props} />,
                  h5: ({node, ...props}) => <h5 style={{ fontFamily: "Playfair Display, serif" }} {...props} />,
                  h6: ({node, ...props}) => <h6 style={{ fontFamily: "Playfair Display, serif" }} {...props} />,
                  p: ({node, ...props}) => <p style={{ fontFamily: "Poppins, sans-serif" }} {...props} />,
                  a: ({node, ...props}) => <a className="text-[#6B2F1A] hover:text-[#5A2814]" {...props} />,
                }}
              >
                {content?.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button
              variant="outline"
              className="border-[#6B2F1A]/20 text-[#6B2F1A] hover:bg-[#fee3d8]/50"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SiteContentPage;