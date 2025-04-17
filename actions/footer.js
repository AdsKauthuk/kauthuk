"use server";

import { db } from "@/lib/prisma";
import { z } from "zod";

// Validation schemas
const footerCategorySchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters long" }),
  displayOrder: z.number().int().nonnegative().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

const footerLinkSchema = z.object({
  footerCategoryId: z.number().int().positive(),
  title: z.string().min(2, { message: "Title must be at least 2 characters long" }),
  link: z.string().min(1, { message: "Link is required" }),
  description: z.string().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  isExternal: z.boolean().optional(),
});

/**
 * Get all footer categories with their links
 */
export async function getFooterData() {
  try {
    const categories = await db.footerCategory.findMany({
      where: { status: "active" },
      orderBy: { displayOrder: "asc" },
      include: {
        FooterLinks: {
          where: { status: "active" },
          orderBy: { displayOrder: "asc" }
        }
      }
    });

    return { success: true, categories };
  } catch (error) {
    console.error("Error fetching footer data:", error);
    return { success: false, error: "Failed to load footer data" };
  }
}

/**
 * Create a new footer category
 * @param {Object} data - Category data
 */
export async function createFooterCategory(data) {
  try {
    // Validate input
    const result = footerCategorySchema.safeParse(data);
    if (!result.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        errors: result.error.errors 
      };
    }

    // Create category
    const category = await db.footerCategory.create({
      data: {
        title: data.title,
        displayOrder: data.displayOrder || 0,
        status: data.status || "active",
      }
    });

    return { success: true, category };
  } catch (error) {
    console.error("Error creating footer category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

/**
 * Update an existing footer category
 * @param {number} id - Category ID
 * @param {Object} data - Category data
 */
export async function updateFooterCategory(id, data) {
  try {
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return { success: false, error: "Invalid category ID" };
    }

    // Validate input
    const result = footerCategorySchema.safeParse(data);
    if (!result.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        errors: result.error.errors 
      };
    }

    // Update category
    const category = await db.footerCategory.update({
      where: { id: categoryId },
      data: {
        title: data.title,
        displayOrder: data.displayOrder,
        status: data.status,
      }
    });

    return { success: true, category };
  } catch (error) {
    console.error("Error updating footer category:", error);
    return { success: false, error: "Failed to update category" };
  }
}

/**
 * Delete a footer category
 * @param {number} id - Category ID
 */
export async function deleteFooterCategory(id) {
  try {
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return { success: false, error: "Invalid category ID" };
    }

    // Delete category (will cascade delete links)
    await db.footerCategory.delete({
      where: { id: categoryId }
    });

    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error("Error deleting footer category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}

/**
 * Create a new footer link
 * @param {Object} data - Link data
 */
export async function createFooterLink(data) {
  try {
    // Validate input
    const result = footerLinkSchema.safeParse(data);
    if (!result.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        errors: result.error.errors 
      };
    }

    // Create link
    const link = await db.footerLink.create({
      data: {
        footerCategoryId: data.footerCategoryId,
        title: data.title,
        link: data.link,
        description: data.description || null,
        displayOrder: data.displayOrder || 0,
        status: data.status || "active",
        isExternal: data.isExternal || false,
      }
    });

    return { success: true, link };
  } catch (error) {
    console.error("Error creating footer link:", error);
    return { success: false, error: "Failed to create link" };
  }
}

/**
 * Update an existing footer link
 * @param {number} id - Link ID
 * @param {Object} data - Link data
 */
export async function updateFooterLink(id, data) {
  try {
    const linkId = parseInt(id);
    if (isNaN(linkId)) {
      return { success: false, error: "Invalid link ID" };
    }

    // Validate input
    const result = footerLinkSchema.safeParse(data);
    if (!result.success) {
      return { 
        success: false, 
        error: "Validation failed", 
        errors: result.error.errors 
      };
    }

    // Update link
    const link = await db.footerLink.update({
      where: { id: linkId },
      data: {
        footerCategoryId: data.footerCategoryId,
        title: data.title,
        link: data.link,
        description: data.description,
        displayOrder: data.displayOrder,
        status: data.status,
        isExternal: data.isExternal,
      }
    });

    return { success: true, link };
  } catch (error) {
    console.error("Error updating footer link:", error);
    return { success: false, error: "Failed to update link" };
  }
}

/**
 * Delete a footer link
 * @param {number} id - Link ID
 */
export async function deleteFooterLink(id) {
  try {
    const linkId = parseInt(id);
    if (isNaN(linkId)) {
      return { success: false, error: "Invalid link ID" };
    }

    // Delete link
    await db.footerLink.delete({
      where: { id: linkId }
    });

    return { success: true, message: "Link deleted successfully" };
  } catch (error) {
    console.error("Error deleting footer link:", error);
    return { success: false, error: "Failed to delete link" };
  }
}