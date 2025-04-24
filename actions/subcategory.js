"use server";

import { db } from "@/lib/prisma";
import os from "os";
import fs from "fs/promises";
import path from "path";
import * as ftp from "basic-ftp";

const localTempDir = os.tmpdir();

// Helper function to generate a slug from a title
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")     // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, "") // Remove non-word chars
    .replace(/\-\-+/g, "-")   // Replace multiple hyphens with single hyphen
    .replace(/^-+/, "")       // Trim hyphens from start
    .replace(/-+$/, "");      // Trim hyphens from end
}

// Helper function to ensure slug uniqueness
async function ensureUniqueSlug(slug, existingId = null) {
  // Check if the slug already exists in the database
  const existing = await db.subCategory.findFirst({
    where: {
      slug: slug,
      ...(existingId ? { id: { not: existingId } } : {}),
    },
  });

  if (!existing) return slug;

  // If slug exists, append a timestamp to make it unique
  const timestamp = new Date().getTime().toString().slice(-4);
  return `${slug}-${timestamp}`;
}

// Helper function to get the highest order number
async function getNextOrderNumber(categoryId) {
  const highestOrder = await db.subCategory.findFirst({
    where: {
      cat_id: categoryId,
    },
    orderBy: {
      order_no: 'desc',
    },
    select: {
      order_no: true,
    },
  });

  return highestOrder ? highestOrder.order_no + 1 : 0;
}

export async function createSubcategory(data) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    console.log("Received data:", data);

    // When receiving FormData, we need to use get() to access values
    const cat_id = data.get ? parseInt(data.get('cat_id')) : data.cat_id;
    const title = data.get ? data.get('title') : data.title;
    const description = data.get ? data.get('description') : data.description;
    const orderNo = data.get ? 
      (data.get('order_no') ? parseInt(data.get('order_no')) : null) : 
      (data.order_no ? parseInt(data.order_no) : null);

    if (!cat_id || !title) {
      throw new Error("Category ID and title are required");
    }

    // Generate slug from title
    const baseSlug = generateSlug(title);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);
    
    // Get next order number if not provided
    const order_no = orderNo !== null ? orderNo : await getNextOrderNumber(cat_id);

    // Create the subcategory
    const subcategory = await db.subCategory.create({
      data: {
        cat_id: cat_id,
        subcategory: title.toString().trim(),
        description: description || null,
        slug: uniqueSlug,
        order_no: order_no,
      },
    });

    // Connect to FTP if we have any images to upload
    const image = data.get ? data.get('image') : (data.image && data.image.length > 0 ? data.image[0] : null);
    const banner = data.get ? data.get('banner') : (data.banner && data.banner.length > 0 ? data.banner[0] : null);
    
    if ((image && image instanceof File) || (banner && banner instanceof File)) {
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
    if (image && image instanceof File) {
      // Add current timestamp to the image filename
      const timestamp = Date.now();
      const newImageName = `subcat_${timestamp}_${image.name}`;

      // Temporary save location on the server
      const tempImagePath = path.join(localTempDir, newImageName);

      // Convert ArrayBuffer to Buffer before writing to the file system
      const buffer = Buffer.from(await image.arrayBuffer());

      // Save the uploaded file temporarily
      await fs.writeFile(tempImagePath, buffer);

      console.log("Temporary subcategory image saved at:", tempImagePath);

      // Upload image to FTP server
      const remoteFilePath = `/kauthuk_test/${newImageName}`;
      await ftpClient.uploadFrom(tempImagePath, remoteFilePath);

      console.log("Subcategory image uploaded successfully to:", remoteFilePath);

      // Update subcategory entry with image path
      await db.subCategory.update({
        where: { id: subcategory.id },
        data: { image: newImageName },
      });

      console.log("Subcategory updated with image path");

      // Remove local temporary file
      await fs.unlink(tempImagePath);
    }

    // Handle banner upload if present
    if (banner && banner instanceof File) {
      // Add current timestamp to the banner filename
      const timestamp = Date.now();
      const newBannerName = `subcat_banner_${timestamp}_${banner.name}`;

      // Temporary save location on the server
      const tempBannerPath = path.join(localTempDir, newBannerName);

      // Convert ArrayBuffer to Buffer before writing to the file system
      const buffer = Buffer.from(await banner.arrayBuffer());

      // Save the uploaded file temporarily
      await fs.writeFile(tempBannerPath, buffer);

      console.log("Temporary subcategory banner saved at:", tempBannerPath);

      // Upload banner to FTP server
      const remoteBannerPath = `/kauthuk_test/${newBannerName}`;
      await ftpClient.uploadFrom(tempBannerPath, remoteBannerPath);

      console.log("Subcategory banner uploaded successfully to:", remoteBannerPath);

      // Update subcategory entry with banner path
      await db.subCategory.update({
        where: { id: subcategory.id },
        data: { banner: newBannerName },
      });

      console.log("Subcategory updated with banner path");

      // Remove local temporary file
      await fs.unlink(tempBannerPath);
    }

    return subcategory;
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("subcategory")) {
      throw new Error("Subcategory with this name already exists.");
    }

    console.error("Error creating subcategory:", error);
    throw new Error("Failed to create the subcategory. Please try again.");
  } finally {
    ftpClient.close();
  }
}


export async function getSubcategories({
  page = 1,
  limit = 15,
  search = "",
  sort = "latest",
}) {
  try {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          subcategory: {
            contains: search, // Case-insensitive by default in MySQL with proper collation
          },
        }
      : {};

    // Define orderBy based on sort parameter
    let orderBy = {};
    
    switch(sort) {
      case "latest":
        orderBy = { id: "desc" };
        break;
      case "oldest":
        orderBy = { id: "asc" };
        break;
      case "name_asc":
        orderBy = { subcategory: "asc" };
        break;
      case "name_desc":
        orderBy = { subcategory: "desc" };
        break;
      case "order_asc":
        orderBy = { order_no: "asc" };
        break;
      case "order_desc":
        orderBy = { order_no: "desc" };
        break;
      default:
        orderBy = { id: "desc" };
    }

    // Fetch subcategories with pagination and search filter
    const subcategories = await db.subCategory.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        Category: {
          select: {
            catName: true,
          },
        },
      },
    });

    // Get total count for pagination calculation
    const totalCount = await db.subCategory.count({ where });

    return {
      subcategories: subcategories || [], // Ensure subcategories is never null
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error fetching subcategories:", error.message);
    throw new Error("Failed to fetch subcategories. Please try again later.");
  }
}

export async function getSubcategories2(cat_id) {
  try {
    // Fetch subcategories for a specific category, ordered by order_no
    const subcategories = await db.subCategory.findMany({
      where: {
        cat_id: cat_id
      },
      orderBy: {
        order_no: 'asc'
      }
    });

    return {
      subcategories: subcategories || [], // Ensure subcategories is never null
    };
  } catch (error) {
    console.error("Error fetching subcategories:", error.message);
    throw new Error("Failed to fetch subcategories. Please try again later.");
  }  
}

export async function updateSubcategory(data) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;
  
  console.log("data", data);
  
  try {
    // When receiving FormData, we need to use get() to access values
    const id = data.get ? data.get('id') : data.id;
    const title = data.get ? data.get('title') : data.title;
    const cat_id = data.get ? data.get('cat_id') : data.cat_id;
    const description = data.get ? data.get('description') : data.description;
    const orderNo = data.get ? 
      (data.get('order_no') ? parseInt(data.get('order_no')) : null) : 
      (data.order_no ? parseInt(data.order_no) : null);
    
    // Check if we have the required data
    if (!id || !title) {
      throw new Error("Invalid input. 'id' and 'title' are required.");
    }

    const subcategoryId = parseInt(id);
    if (isNaN(subcategoryId)) {
      throw new Error("Invalid subcategory ID format.");
    }

    // Fetch existing subcategory
    const existingSubcategory = await db.subCategory.findUnique({
      where: { id: subcategoryId },
    });

    if (!existingSubcategory) {
      throw new Error("Subcategory not found");
    }

    // Generate new slug if title has changed
    let slug = existingSubcategory.slug;
    if (title.toString().trim() !== existingSubcategory.subcategory) {
      const baseSlug = generateSlug(title);
      slug = await ensureUniqueSlug(baseSlug, subcategoryId);
    }

    // Prepare update data
    const updateData = {
      subcategory: title.toString().trim(),
      cat_id: parseInt(cat_id),
      description: description ? description.toString() : existingSubcategory.description,
      slug: slug,
      order_no: orderNo !== null ? orderNo : existingSubcategory.order_no,
    };

    // Connect to FTP if we have any images to upload
    const image = data.get ? data.get('image') : (data.image && data.image.length > 0 ? data.image[0] : null);
    const banner = data.get ? data.get('banner') : (data.banner && data.banner.length > 0 ? data.banner[0] : null);
    
    if ((image && image instanceof File) || (banner && banner instanceof File)) {
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
      const newImageName = `subcat_${timestamp}_${image.name}`;

      // Temporary save location on the server
      const tempImagePath = path.join(localTempDir, newImageName);

      // Convert ArrayBuffer to Buffer before writing to the file system
      const buffer = Buffer.from(await image.arrayBuffer());

      // Save the uploaded file temporarily
      await fs.writeFile(tempImagePath, buffer);

      console.log("Temporary subcategory image saved at:", tempImagePath);

      // Upload image to FTP server
      const remoteFilePath = `/kauthuk_test/${newImageName}`;
      await ftpClient.uploadFrom(tempImagePath, remoteFilePath);

      console.log("Subcategory image uploaded successfully to:", remoteFilePath);

      // Update image path in update data
      updateData.image = newImageName;

      // Remove local temporary file
      await fs.unlink(tempImagePath);

      // Delete the old image from FTP if it exists
      if (existingSubcategory.image) {
        const oldRemoteFilePath = `/kauthuk_test/${existingSubcategory.image}`;
        try {
          await ftpClient.remove(oldRemoteFilePath);
          console.log("Old subcategory image removed from FTP server:", oldRemoteFilePath);
        } catch (err) {
          console.warn("Failed to remove old subcategory image from FTP server:", err);
        }
      }
    }

    // Handle banner upload if present
    if (banner && banner instanceof File) {
      // Add current timestamp to the banner filename
      const timestamp = Date.now();
      const newBannerName = `subcat_banner_${timestamp}_${banner.name}`;

      // Temporary save location on the server
      const tempBannerPath = path.join(localTempDir, newBannerName);

      // Convert ArrayBuffer to Buffer before writing to the file system
      const buffer = Buffer.from(await banner.arrayBuffer());

      // Save the uploaded file temporarily
      await fs.writeFile(tempBannerPath, buffer);

      console.log("Temporary subcategory banner saved at:", tempBannerPath);

      // Upload banner to FTP server
      const remoteBannerPath = `/kauthuk_test/${newBannerName}`;
      await ftpClient.uploadFrom(tempBannerPath, remoteBannerPath);

      console.log("Subcategory banner uploaded successfully to:", remoteBannerPath);

      // Update banner path in update data
      updateData.banner = newBannerName;

      // Remove local temporary file
      await fs.unlink(tempBannerPath);

      // Delete the old banner from FTP if it exists
      if (existingSubcategory.banner) {
        const oldRemoteBannerPath = `/kauthuk_test/${existingSubcategory.banner}`;
        try {
          await ftpClient.remove(oldRemoteBannerPath);
          console.log("Old subcategory banner removed from FTP server:", oldRemoteBannerPath);
        } catch (err) {
          console.warn("Failed to remove old subcategory banner from FTP server:", err);
        }
      }
    }

    // Update the subcategory
    const updatedSubcategory = await db.subCategory.update({
      where: { id: subcategoryId },
      data: updateData,
    });

    return updatedSubcategory;
  } catch (error) {
    // Handle unique constraint error
    if (error.code === "P2002" && error.meta?.target?.includes("subcategory")) {
      throw new Error("Subcategory with this name already exists.");
    }

    // Handle record not found error
    if (error.code === "P2025") {
      throw new Error("Subcategory not found.");
    }

    console.error("Error updating subcategory:", error);
    throw new Error("Failed to update the subcategory. Please try again.");
  } finally {
    ftpClient.close();
  }
}

export async function deleteSubcategoryById(id) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    console.log("Deleting subcategory with id:", id);
    if (!id) {
      throw new Error("Subcategory ID is required");
    }

    const subcategoryId = parseInt(id);
    if (isNaN(subcategoryId)) {
      throw new Error("Invalid subcategory ID format");
    }

    // Fetch the subcategory to check if it has an associated image or banner
    const subcategory = await db.subCategory.findUnique({
      where: { id: subcategoryId },
      select: { image: true, banner: true },
    });

    if (!subcategory) {
      throw new Error("Subcategory not found");
    }

    // Delete the image and banner from FTP if they exist
    if (subcategory.image || subcategory.banner) {
      await ftpClient.access({
        host: "ftp.greenglow.in",
        port: 21,
        user: "u737108297.kauthuktest",
        password: "Test_kauthuk#123",
      });

      console.log("Connected to FTP server");

      // Delete the image if it exists
      if (subcategory.image) {
        const remoteFilePath = `/kauthuk_test/${subcategory.image}`;
        try {
          await ftpClient.remove(remoteFilePath);
          console.log("Subcategory image deleted from FTP:", remoteFilePath);
        } catch (ftpError) {
          console.warn(
            "Error deleting subcategory image or file not found:",
            ftpError.message
          );
        }
      }

      // Delete the banner if it exists
      if (subcategory.banner) {
        const remoteBannerPath = `/kauthuk_test/${subcategory.banner}`;
        try {
          await ftpClient.remove(remoteBannerPath);
          console.log("Subcategory banner deleted from FTP:", remoteBannerPath);
        } catch (ftpError) {
          console.warn(
            "Error deleting subcategory banner or file not found:",
            ftpError.message
          );
        }
      }
    }

    // Delete the subcategory from the database
    const deletedSubcategory = await db.subCategory.delete({
      where: { id: subcategoryId },
    });

    return {
      success: true,
      deletedSubcategory,
    };
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Subcategory not found.");
    }
    
    console.error("Error deleting subcategory:", error);
    throw new Error("Failed to delete the subcategory. Please try again.");
  } finally {
    ftpClient.close();
  }
}

export async function getSubcategoriesWithProductCount(categoryId) {
  try {
    if (!categoryId) {
      throw new Error("Category ID is required");
    }

    const catId = parseInt(categoryId);
    if (isNaN(catId)) {
      throw new Error("Invalid category ID format");
    }

    const subcategories = await db.subCategory.findMany({
      where: {
        cat_id: catId
      },
      select: {
        id: true,
        subcategory: true,
        image: true,
        banner: true,
        description: true,
        slug: true,
        order_no: true,
        _count: {
          select: {
            Product: true
          }
        }
      },
      orderBy: {
        order_no: 'asc'
      }
    });

    return { 
      success: true, 
      subcategories: subcategories.map(sc => ({
        ...sc,
        productCount: sc._count.Product
      })) 
    };
  } catch (error) {
    console.error("Error fetching subcategories with product count:", error);
    return { success: false, error: "Failed to fetch subcategories" };
  }
}

/**
 * Fetch a subcategory by its slug
 * @param {string} slug - The subcategory slug to lookup
 * @param {boolean} includeCategory - Whether to include parent category information
 * @param {boolean} includeRelated - Whether to include related subcategories
 * @returns {Promise<Object>} The subcategory with related data
 */
export async function getSubcategoryBySlug(slug, includeCategory = true, includeRelated = false) {
  try {
    if (!slug) {
      throw new Error("Subcategory slug is required");
    }
    
    console.log("subcategory slug", slug);
    
    // Prepare the query
    const query = {
      where: {
        slug: slug,
      },
      select: {
        id: true,
        subcategory: true,
        description: true,
        image: true,
        banner: true,
        slug: true,
        order_no: true,
        cat_id: true,
        createdAt: true,
        updatedAt: true,
      }
    };

    // Optionally include parent category data
    if (includeCategory) {
      query.select.Category = {
        select: {
          id: true,
          catName: true,
          slug: true,
          image: true,
          order_no: true,
        }
      };
    }

    const subcategory = await db.subCategory.findUnique(query);

    if (!subcategory) {
      return { 
        success: false, 
        error: "Subcategory not found" 
      };
    }

    // Get product count
    const productCount = await db.product.count({
      where: {
        subcat_id: subcategory.id,
        status: "active",
      },
    });

    // Get related subcategories if requested
    let relatedSubcategories = [];
    if (includeRelated && subcategory.cat_id) {
      relatedSubcategories = await db.subCategory.findMany({
        where: {
          cat_id: subcategory.cat_id,
          id: {
            not: subcategory.id // Exclude current subcategory
          }
        },
        select: {
          id: true,
          subcategory: true,
          slug: true,
          image: true,
          order_no: true,
          _count: {
            select: {
              Product: true
            }
          }
        },
        orderBy: {
          order_no: 'asc'
        },
        take: 6 // Limit the number of related subcategories
      });
    }

    return {
      success: true,
      subcategory: {
        ...subcategory,
        productCount
      },
      relatedSubcategories: relatedSubcategories || []
    };
  } catch (error) {
    console.error("Error fetching subcategory by slug:", error);
    return {
      success: false,
      error: "Failed to fetch subcategory"
    };
  }
}