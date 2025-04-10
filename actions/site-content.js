"use server";

import { db } from "@/lib/prisma";

/**
 * Create a new site content entry
 * @param {Object} data - The site content data
 * @returns {Promise<Object>} The created site content
 */
export async function createSiteContent(data) {
  try {
    console.log("Received data:", data);

    // Store site content details in the database
    const siteContent = await db.siteContent.create({
      data: {
        page: data.page,
        title: data.title,
        content: data.content,
        link: data.link || '',
      },
    });

    return siteContent;
  } catch (error) {
    if (error.code === "P2002") {
      return { success: false, error: "This page name already exists." };
    }
    console.error("Error creating site content:", error);
    throw new Error("Failed to create the site content. Please try again.");
  }
}

/**
 * Get a single site content by its ID
 * @param {number} id - The site content ID
 * @returns {Promise<Object>} The site content
 */
export async function getOneSiteContent(id) {
  try {
    const siteContent = await db.siteContent.findUnique({
      where: {
        id: id,
      },
    });
    
    if (!siteContent) {
      throw new Error("Site content not found.");
    }

    return siteContent;
  } catch (error) {
    console.error("Error fetching site content:", error);
    throw new Error("Failed to fetch the site content. Please try again.");
  }
}

export async function getSiteContentByPage(page) {
  console.log("page", page);
  try {
    const siteContent = await db.siteContent.findUnique({
      where: {
        link: page,
      },
    });
    
    if (!siteContent) {
      return null; // Return null instead of throwing an error for easier handling on the client
    }
    
    return siteContent;
  } catch (error) {
    // Use a simpler error logging approach to avoid the payload issue
    console.log("Error fetching site content by page:", error.message);
    // Return an object with an error property instead of throwing
    return { error: "Failed to fetch the site content. Please try again." };
  }
}

/**
 * Delete a site content by ID
 * @param {number} id - The site content ID
 * @returns {Promise<Object>} Result of the delete operation
 */
export async function deleteSiteContentById(id) {
  console.log("Deleting site content with id:", id);
  if (!id) {
    throw new Error("Site content ID is required");
  }

  try {
    // Delete the site content from the database
    const deletedSiteContent = await db.siteContent.delete({
      where: { id: id },
    });

    return {
      success: true,
      deletedSiteContent,
    };
  } catch (error) {
    console.error("Error deleting site content:", error);
    throw new Error("Failed to delete the site content. Please try again.");
  }
}

/**
 * Get all site content with pagination, searching, and sorting
 * @param {Object} options - Pagination, search, and sort options
 * @returns {Promise<Object>} The site content list and pagination info
 */
export async function getSiteContents({
  page = 1,
  limit = 15,
  search = "",
  sort = "latest",
}) {
  try {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            {
              page: {
                contains: search,
              },
            },
            {
              title: {
                contains: search,
              },
            },
          ],
        }
      : {};

    // Fetch site contents with pagination and search filter
    const siteContents = await db.siteContent.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        id: sort === "latest" ? "desc" : "asc",
      },
    });

    // Get total count for pagination calculation
    const totalCount = await db.siteContent.count({ where });

    return {
      siteContents: siteContents || [],
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error fetching site contents:", error.message);
    throw new Error("Failed to fetch site contents. Please try again later.");
  }
}

/**
 * Update a site content
 * @param {number} id - The site content ID
 * @param {Object} data - The updated site content data
 * @returns {Promise<Object>} The updated site content
 */
export async function updateSiteContent(id, data) {
  try {
    console.log("Received update data:", data);

    // Fetch the existing site content entry
    const existingSiteContent = await db.siteContent.findUnique({
      where: { id },
    });

    if (!existingSiteContent) {
      throw new Error("Site content not found");
    }

    // Prepare the update data
    const updateData = {
      page: data.page || existingSiteContent.page,
      title: data.title || existingSiteContent.title,
      content: data.content || existingSiteContent.content,
      link: data.link || existingSiteContent.link,
    };

    // Update site content entry in the database
    const updatedSiteContent = await db.siteContent.update({
      where: { id },
      data: updateData,
    });

    console.log("Site content updated successfully:", updatedSiteContent);

    return updatedSiteContent;
  } catch (error) {
    if (error.code === "P2002") {
      return { success: false, error: "This page name already exists." };
    }
    console.error("Error updating site content:", error);
    throw new Error("Failed to update the site content. Please try again.");
  }
}