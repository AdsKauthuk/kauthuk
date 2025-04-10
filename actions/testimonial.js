"use server";

import { db } from "@/lib/prisma";
import os from "os";
import fs from "fs/promises"; 
import path from "path";
import * as ftp from "basic-ftp";

const localTempDir = os.tmpdir();

export async function createTestimonial(data) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    console.log("Received testimonial data:", data);

    // Store testimonial details in the database first
    const testimonial = await db.testimonial.create({
      data: {
        name: data.name,
        location: data.location,
        description: data.description,
        rating: parseInt(data.rating),
        status: data.status
      },
    });

   

    return testimonial;
  } catch (error) {
    console.error("Error creating testimonial:", error);
    throw new Error("Failed to create the testimonial. Please try again.");
  } finally {
    ftpClient.close();
  }
}

export async function getOneTestimonial(id) {
  try {
    const testimonial = await db.testimonial.findUnique({
      where: {
        id: id,
      },
    });
    console.log("testimonial:", testimonial)

    if (!testimonial) {
      throw new Error("Failed to fetch the testimonial. Please try again.");
    }

    return testimonial;
  } catch (error) {
    throw new Error("Failed to fetch the testimonial. Please try again.");
  }
}

export async function deleteTestimonialById(id) {
  console.log("Deleting testimonial with id:", id);
  if (!id) {
    throw new Error("Testimonial ID is required");
  }

  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    // Fetch the testimonial to check if it has an associated image
    const testimonial = await db.testimonial.findUnique({
      where: { id: id },
    });

    if (!testimonial) {
      throw new Error("Testimonial not found");
    }


    // Delete the testimonial from the database
    const deletedTestimonial = await db.testimonial.delete({
      where: { id: id },
    });

    return {
      success: true,
      deletedTestimonial,
    };
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    throw new Error("Failed to delete the testimonial. Please try again.");
  } finally {
    ftpClient.close();
  }
}

export async function getTestimonials({
  page = 1,
  limit = 9,
  search = "",
  sort = "newest",
  status = "all",
}) {
  try {
    const skip = (page - 1) * limit;

    // Build the where clause based on search and status filters
    let where = {};
    
    // Add search condition if provided
    if (search) {
      where = {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
          { location: { contains: search } }
        ]
      };
    }
    
    // Add status filter if not 'all'
    if (status && status !== 'all') {
      where.status = status;
    }

    // Determine sort order based on the sort parameter
    let orderBy = {};
    switch (sort) {
      case 'newest':
        orderBy = { id: 'desc' };
        break;
      case 'oldest':
        orderBy = { id: 'asc' };
        break;
      case 'rating_high':
        orderBy = { rating: 'desc' };
        break;
      case 'rating_low':
        orderBy = { rating: 'asc' };
        break;
      default:
        orderBy = { id: 'desc' }; // Default to newest
    }

    // Fetch testimonials with pagination, search filter, and sorting
    const testimonials = await db.testimonial.findMany({
      where,
      skip,
      take: limit,
      orderBy
    });

    // Get total count for pagination calculation
    const totalCount = await db.testimonial.count({ where });

    return {
      testimonials: testimonials || [],
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error fetching testimonials:", error.message);
    throw new Error("Failed to fetch testimonials. Please try again later.");
  }
}

export async function updateTestimonial(id, data) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    console.log("Received testimonial update data:", data);

    // Fetch the existing testimonial entry
    const existingTestimonial = await db.testimonial.findUnique({
      where: { id },
    });

    if (!existingTestimonial) {
      throw new Error("Testimonial not found");
    }

    // Prepare the update data
    const updateData = {
      name: data.name,
      location: data.location,
      description: data.description,
      rating: parseInt(data.rating),
      status: data.status
    };

  

    // Update testimonial entry in the database
    const updatedTestimonial = await db.testimonial.update({
      where: { id },
      data: updateData,
    });

    console.log("Testimonial updated successfully:", updatedTestimonial);

    return updatedTestimonial;
  } catch (error) {
    console.error("Error updating testimonial:", error);
    throw new Error("Failed to update the testimonial. Please try again.");
  } finally {
    ftpClient.close();
  }
}

export async function updateTestimonialStatus(id, status) {
  try {
    console.log(`Updating testimonial status: ID ${id} to ${status}`);

    // Fetch the existing testimonial to make sure it exists
    const existingTestimonial = await db.testimonial.findUnique({
      where: { id },
    });

    if (!existingTestimonial) {
      throw new Error("Testimonial not found");
    }

    // Update status
    const updatedTestimonial = await db.testimonial.update({
      where: { id },
      data: { status },
    });

    console.log("Testimonial status updated successfully:", updatedTestimonial);

    return {
      success: true,
      testimonial: updatedTestimonial
    };
  } catch (error) {
    console.error("Error updating testimonial status:", error);
    throw new Error("Failed to update the testimonial status. Please try again.");
  }
}