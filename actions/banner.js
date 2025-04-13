"use server";

import { db } from "@/lib/prisma";
import { cache } from "react";
import os from "os";
import fs from "fs/promises";
import path from "path";
import * as ftp from "basic-ftp";

const localTempDir = os.tmpdir();

/**
 * Create a new banner
 * @param {Object} data - Banner data including title, subtitle, button details, image, and page selection
 */
export async function createBanner(data) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    if (!data || !data.title || !data.displayPage) {
      throw new Error("Banner title and display page are required");
    }

    // Create the banner
    const banner = await db.banner.create({
      data: {
        title: data.title.trim(),
        subtitle: data.subtitle || null,
        buttonTitle: data.buttonTitle || null,
        buttonLink: data.buttonLink || null,
        displayPage: data.displayPage,
        priority: data.priority || 0,
      },
    });

    // Connect to FTP server if we have an image to upload
    if (data.image && data.image.length > 0) {
      await ftpClient.access({
        host: "ftp.greenglow.in",
        port: 21,
        user: "u737108297.kauthuktest",
        password: "Test_kauthuk#123",
      });

      console.log("Connected to FTP server");
      
      // Create directory if it doesn't exist
      try {
        await ftpClient.ensureDir("/kauthuk_test");
      } catch (error) {
        console.warn("Directory may already exist:", error.message);
      }
    }

    // Handle image upload if present
    if (data.image && data.image.length > 0) {
      const image = data.image[0];

      // Add current timestamp to the image filename
      const timestamp = Date.now();
      const newImageName = `banner_${timestamp}_${image.name}`;

      // Temporary save location on the server
      const tempImagePath = path.join(localTempDir, newImageName);

      // Convert ArrayBuffer to Buffer before writing to the file system
      const buffer = Buffer.from(await image.arrayBuffer());

      // Save the uploaded file temporarily
      await fs.writeFile(tempImagePath, buffer);

      console.log("Temporary banner image saved at:", tempImagePath);

      // Upload image to FTP server
      const remoteFilePath = `/kauthuk_test/${newImageName}`;
      await ftpClient.uploadFrom(tempImagePath, remoteFilePath);

      console.log("Banner image uploaded successfully to:", remoteFilePath);

      // Update banner entry with image path
      await db.banner.update({
        where: { id: banner.id },
        data: { image: newImageName },
      });

      console.log("Banner updated with image path");

      // Remove local temporary file
      await fs.unlink(tempImagePath);
    }

    return banner;
  } catch (error) {
    console.error("Error creating banner:", error);
    throw new Error("Failed to create the banner. Please try again.");
  } finally {
    ftpClient.close();
  }
}

/**
 * Get all banners with optional filtering
 */
export async function getBanners({
  page = 1,
  limit = 15,
  search = "",
  displayPage = null,
  sort = "priority",
} = {}) {
  try {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = ((isNaN(pageNum) ? 1 : pageNum) - 1) * (isNaN(limitNum) ? 15 : limitNum);

    // Build where clause based on filters
    let where = {};
    
    if (search) {
      where.title = {
        contains: search,
      };
    }
    
    if (displayPage) {
      where.displayPage = displayPage;
    }

    // Fetch banners with pagination and filters
    const banners = await db.banner.findMany({
      where,
      skip,
      take: isNaN(limitNum) ? 15 : limitNum,
      orderBy: sort === "priority" 
        ? { priority: "desc" } 
        : sort === "latest" 
          ? { id: "desc" } 
          : { title: "asc" },
    });

    // Get total count for pagination calculation
    const totalCount = await db.banner.count({ where });

    return {
      banners: banners || [],
      totalPages: Math.ceil(totalCount / (isNaN(limitNum) ? 15 : limitNum)),
    };
  } catch (error) {
    console.error("Error fetching banners:", error.message);
    throw new Error("Failed to fetch banners. Please try again later.");
  }
}

/**
 * Get active banners for a specific page
 * @param {string} displayPage - The page to fetch banners for (home, detail, success)
 */
export const getPageBanners = cache(async (displayPage) => {
  try {
    if (!displayPage) {
      throw new Error("Display page is required");
    }

    const banners = await db.banner.findMany({
      where: {
        displayPage: displayPage,
        status: "active",
      },
      orderBy: {
        priority: "desc",
      },
    });

    return { banners: banners || [] };
  } catch (error) {
    console.error(`Error fetching banners for ${displayPage} page:`, error);
    return { banners: [] };
  }
});

/**
 * Update an existing banner
 */
export async function updateBanner(data) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;
  
  try {
    // When receiving FormData, we need to use get() to access values
    const id = data.get ? data.get('id') : data.id;
    const title = data.get ? data.get('title') : data.title;
    const subtitle = data.get ? data.get('subtitle') : data.subtitle;
    const buttonTitle = data.get ? data.get('buttonTitle') : data.buttonTitle;
    const buttonLink = data.get ? data.get('buttonLink') : data.buttonLink;
    const displayPage = data.get ? data.get('displayPage') : data.displayPage;
    const priority = data.get ? data.get('priority') : data.priority;
    
    // Check if we have the required data
    if (!id || !title || !displayPage) {
      throw new Error("Invalid input. 'id', 'title', and 'displayPage' are required.");
    }

    const bannerId = parseInt(id);
    if (isNaN(bannerId)) {
      throw new Error("Invalid banner ID format.");
    }

    // Fetch existing banner
    const existingBanner = await db.banner.findUnique({
      where: { id: bannerId },
    });

    if (!existingBanner) {
      throw new Error("Banner not found");
    }

    // Prepare update data
    const updateData = {
      title: title.toString().trim(),
      subtitle: subtitle || null,
      buttonTitle: buttonTitle || null,
      buttonLink: buttonLink || null,
      displayPage: displayPage,
      priority: priority !== undefined ? parseInt(priority) : existingBanner.priority,
    };

    // Connect to FTP if we have an image to upload
    const image = data.get ? data.get('image') : (data.image && data.image.length > 0 ? data.image[0] : null);
    
    if (image && image instanceof File) {
      await ftpClient.access({
        host: "ftp.greenglow.in", 
        port: 21,
        user: "u737108297.kauthuktest",
        password: "Test_kauthuk#123",
      });

      console.log("Connected to FTP server");

      // Ensure directory exists
      try {
        await ftpClient.ensureDir("/kauthuk_test");
      } catch (error) {
        console.warn("Directory may already exist:", error.message);
      }
    }

    // Handle image upload if present
    if (image && image instanceof File) {
      // Add current timestamp to the image filename
      const timestamp = Date.now();
      const newImageName = `banner_${timestamp}_${image.name}`;

      // Temporary save location on the server
      const tempImagePath = path.join(localTempDir, newImageName);

      // Convert ArrayBuffer to Buffer before writing to the file system
      const buffer = Buffer.from(await image.arrayBuffer());

      // Save the uploaded file temporarily
      await fs.writeFile(tempImagePath, buffer);

      console.log("Temporary banner image saved at:", tempImagePath);

      // Upload image to FTP server
      const remoteFilePath = `/kauthuk_test/${newImageName}`;
      await ftpClient.uploadFrom(tempImagePath, remoteFilePath);

      console.log("Banner image uploaded successfully to:", remoteFilePath);

      // Update image path in update data
      updateData.image = newImageName;

      // Remove local temporary file
      await fs.unlink(tempImagePath);

      // Delete the old image from FTP if it exists
      if (existingBanner.image) {
        const oldRemoteFilePath = `/kauthuk_test/${existingBanner.image}`;
        try {
          await ftpClient.remove(oldRemoteFilePath);
          console.log("Old banner image removed from FTP server:", oldRemoteFilePath);
        } catch (err) {
          console.warn("Failed to remove old banner image from FTP server:", err);
        }
      }
    }

    // Update the banner
    const updatedBanner = await db.banner.update({
      where: { id: bannerId },
      data: updateData,
    });

    return updatedBanner;
  } catch (error) {
    // Handle record not found error
    if (error.code === "P2025") {
      throw new Error("Banner not found.");
    }

    console.error("Error updating banner:", error);
    throw new Error("Failed to update the banner. Please try again.");
  } finally {
    ftpClient.close();
  }
}

/**
 * Toggle banner active status
 */
export async function toggleBanner(id) {
  try {
    if (!id) {
      throw new Error("Banner ID is required");
    }

    const bannerId = parseInt(id);
    if (isNaN(bannerId)) {
      throw new Error("Invalid banner ID format");
    }

    const banner = await db.banner.findUnique({
      where: {
        id: bannerId,
      },
    });

    if (!banner) {
      throw new Error("Banner not found");
    }

    // Update the banner status
    const toggledBanner = await db.banner.update({
      where: { id: bannerId },
      data: {
        status: banner.status === "active" ? "inactive" : "active",
      },
    });

    return toggledBanner;
  } catch (error) {
    // Handle record not found error
    if (error.code === "P2025") {
      throw new Error("Banner not found.");
    }

    console.error("Error updating banner:", error);
    throw new Error("Failed to update the banner. Please try again.");
  }
}

/**
 * Delete a banner by ID
 */
export async function deleteBannerById(id) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    if (!id) {
      throw new Error("Banner ID is required");
    }

    const bannerId = parseInt(id);
    if (isNaN(bannerId)) {
      throw new Error("Invalid banner ID format");
    }

    // Fetch the banner to check if it has an associated image
    const banner = await db.banner.findUnique({
      where: { id: bannerId },
      select: { image: true },
    });

    if (!banner) {
      throw new Error("Banner not found");
    }

    // Delete the image from FTP if it exists
    if (banner.image) {
      await ftpClient.access({
        host: "ftp.greenglow.in",
        port: 21,
        user: "u737108297.kauthuktest",
        password: "Test_kauthuk#123",
      });

      console.log("Connected to FTP server");

      // Delete the image
      const remoteFilePath = `/kauthuk_test/${banner.image}`;
      try {
        await ftpClient.remove(remoteFilePath);
        console.log("Banner image deleted from FTP:", remoteFilePath);
      } catch (ftpError) {
        console.warn(
          "Error deleting banner image or file not found:",
          ftpError.message
        );
      }
    }

    // Delete the banner from the database
    const deletedBanner = await db.banner.delete({
      where: {
        id: bannerId,
      },
    });

    return {
      success: true,
      deletedBanner,
    };
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Banner not found.");
    }
    
    console.error("Error deleting banner:", error);
    throw new Error("Failed to delete the banner. Please try again.");
  } finally {
    ftpClient.close();
  }
}