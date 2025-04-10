"use server";

import { db } from "@/lib/prisma";
import { EnquirySchema } from "@/lib/validators";
import { z } from "zod";

const EnquiryWithCaptchaSchema = EnquirySchema.extend({
  captcha: z.string().min(1, "Please complete the captcha")
});

export async function submitEnquiry(data) {
  try {
    // Validate the data
    const validatedData = EnquiryWithCaptchaSchema.parse(data);
    
    // Verify captcha (In production, you'd have a proper verification logic)
    // Example: call an API to verify the captcha
    const captchaIsValid = validatedData.captcha === data.expectedCaptcha;
    
    if (!captchaIsValid) {
      return { 
        success: false, 
        error: "Invalid captcha. Please try again."
      };
    }
    
    // Remove captcha and expectedCaptcha from data before saving to database
    const { captcha, expectedCaptcha, ...enquiryData } = validatedData;
    
    // Save enquiry to database
    const enquiry = await db.enquiry.create({
      data: enquiryData
    });
    
    // Optional: Send notification email to admin
    // await sendAdminNotification(enquiry);
    
    return { 
      success: true, 
      message: "Your enquiry has been submitted successfully. We'll get back to you within 24 hours."
    };
  } catch (error) {
    console.error("Error submitting enquiry:", error);
    
    if (error instanceof z.ZodError) {
      // Return validation errors
      const errorMessages = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      return { 
        success: false, 
        error: "Validation failed", 
        validationErrors: errorMessages 
      };
    }
    
    return { 
      success: false, 
      error: "Failed to submit your enquiry. Please try again."
    };
  }
}

export async function generateCaptcha() {
  // Generate a simple captcha (for production, use a more robust solution)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return captcha;
}

export async function getEnquiries({ 
    page = 1, 
    limit = 10, 
    search = "", 
    sort = "latest" 
  }) {
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause for search
      const where = search ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ]
      } : {};
      
      // Determine sort order
      const orderBy = sort === "latest" 
        ? { createdAt: 'desc' } 
        : { createdAt: 'asc' };
      
      // Get enquiries with pagination
      const enquiries = await db.enquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      });
      
      // Get total count for pagination
      const totalCount = await db.enquiry.count({ where });
      
      return {
        enquiries,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      };
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      throw new Error("Failed to fetch enquiries");
    }
  }
  
  /**
   * Get a single enquiry by ID
   */
  export async function getEnquiryById(id) {
    try {
      const enquiry = await db.enquiry.findUnique({
        where: { id: Number(id) },
      });
      
      if (!enquiry) {
        return { success: false, error: "Enquiry not found" };
      }
      
      return { success: true, data: enquiry };
    } catch (error) {
      console.error("Error fetching enquiry:", error);
      return { success: false, error: "Failed to fetch enquiry" };
    }
  }
  
  /**
   * Delete an enquiry by ID
   */
  export async function deleteEnquiryById(id) {
    try {
      // Check if the enquiry exists
      const enquiry = await db.enquiry.findUnique({
        where: { id: Number(id) },
      });
      
      if (!enquiry) {
        return { success: false, error: "Enquiry not found" };
      }
      
      // Delete the enquiry
      await db.enquiry.delete({
        where: { id: Number(id) },
      });
      
      return { 
        success: true, 
        message: "Enquiry deleted successfully" 
      };
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      return { 
        success: false, 
        error: "Failed to delete enquiry" 
      };
    }
  }