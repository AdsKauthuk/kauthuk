"use server";

import { db } from "@/lib/prisma";
import os from "os";
import fs from "fs/promises";
import path from "path";
import * as ftp from "basic-ftp";

const localTempDir = os.tmpdir();

// FTP configuration - extracted to avoid repetition and improve security
// In production, these should be environment variables
const FTP_CONFIG = {
  host: "ftp.greenglow.in",
  port: 21,
  user: "u737108297.kauthuktest",
  password: "Test_kauthuk#123",
  remoteDir: "/kauthuk_test/",
};

// Utility function to connect to FTP
async function connectToFTP(ftpClient) {
  if (ftpClient.closed) {
    await ftpClient.access({
      host: FTP_CONFIG.host,
      port: FTP_CONFIG.port,
      user: FTP_CONFIG.user,
      password: FTP_CONFIG.password,
    });
    console.log("Connected to FTP server");
  }
  return ftpClient;
}

// Create a new product with all related data
export async function createProduct(data) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    console.log("Received product data:", data);

    // First create the product
    const product = await db.product.create({
      data: {
        cat_id: parseInt(data.cat_id),
        subcat_id: parseInt(data.subcat_id),
        title: data.title,
        description: data.description,
        status: data.status || "active",
        hasVariants: data.hasVariants || false,
        base_price: parseFloat(data.base_price),
        price_rupees: parseFloat(data.price_rupees),
        price_dollars: parseFloat(data.price_dollars),
        stock_count: parseInt(data.stock_count) || 0,
        stock_status: data.stock_status || "yes",
        quantity_limit: parseInt(data.quantity_limit) || 10,
        terms_condition: data.terms_condition,
        highlights: data.highlights,
        meta_title: data.meta_title,
        meta_keywords: data.meta_keywords,
        meta_description: data.meta_description,
        hsn_code: data.hsn_code,
        tax: data.tax ? parseFloat(data.tax) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        free_shipping: data.free_shipping || "no",
        cod: data.cod || "yes",
      },
    });

    // Handle product images
    if (data.images && data.images.length > 0) {
      await handleProductImages(ftpClient, product.id, data.images);
    }

    // Handle product attributes
    if (data.attributes && data.attributes.length > 0) {
      await handleProductAttributes(product.id, data.attributes);
    }

    // Handle product variants if hasVariants is true
    if (data.hasVariants && data.variants && data.variants.length > 0) {
      await handleProductVariants(ftpClient, product.id, data.variants);
    }

    // Fetch the complete product with relationships for the response
    const completeProduct = await db.product.findUnique({
      where: { id: product.id },
      include: {
        SubCategory: true,
        ProductImages: true,
        ProductAttributes: {
          include: {
            Attribute: true,
            ProductAttributeValues: {
              include: {
                AttributeValue: true,
              },
            },
          },
        },
        ProductVariants: {
          include: {
            VariantAttributeValues: {
              include: {
                AttributeValue: {
                  include: {
                    Attribute: true,
                  },
                },
              },
            },
            ProductImages: true,
          },
        },
      },
    });

    return completeProduct;
  } catch (error) {
    console.error("Error creating product:", error);
    throw new Error(`Failed to create the product: ${error.message}`);
  } finally {
    ftpClient.close();
  }
}

// Improved helper function to handle image uploads to FTP
async function handleProductImages(
  ftpClient,
  productId,
  images,
  variantId = null
) {
  try {
    // Connect to FTP server
    await connectToFTP(ftpClient);

    // Process each image
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const timestamp = Date.now();
      const newImageName = `${timestamp}_${i}_${image.name}`;
      const tempImagePath = path.join(localTempDir, newImageName);

      // Convert ArrayBuffer to Buffer and save temporarily
      const buffer = Buffer.from(await image.arrayBuffer());
      await fs.writeFile(tempImagePath, buffer);

      // Upload to FTP
      const remoteFilePath = `${FTP_CONFIG.remoteDir}${newImageName}`;
      await ftpClient.uploadFrom(tempImagePath, remoteFilePath);
      console.log(`Image ${i + 1} uploaded successfully to: ${remoteFilePath}`);

      // Create product image record in database
      const createdImage = await db.productImage.create({
        data: {
          product_id: productId,
          product_variant_id: variantId,
          image_path: newImageName,
          image_type: i === 0 ? "main" : "gallery",
          display_order: i,
          is_thumbnail: i === 0, // First image is thumbnail - matches your existing data pattern
        },
      });

      console.log(`Created product image record:`, createdImage);

      // Remove temporary file
      await fs.unlink(tempImagePath);
    }
  } catch (error) {
    console.error("Error handling product images:", error);
    throw error;
  }
}

// Helper function to handle product attributes
async function handleProductAttributes(productId, attributes) {
  try {
    for (const attr of attributes) {
      // Create the product attribute link
      const productAttribute = await db.productAttribute.create({
        data: {
          product_id: productId,
          attribute_id: parseInt(attr.attribute_id),
          is_required: attr.is_required || false,
        },
      });

      // If attribute values are provided
      if (attr.values && attr.values.length > 0) {
        for (const value of attr.values) {
          await db.productAttributeValue.create({
            data: {
              product_attribute_id: productAttribute.id,
              attribute_value_id: parseInt(value.attribute_value_id),
              price_adjustment_rupees: value.price_adjustment_rupees
                ? parseFloat(value.price_adjustment_rupees)
                : null,
              price_adjustment_dollars: value.price_adjustment_dollars
                ? parseFloat(value.price_adjustment_dollars)
                : null,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error handling product attributes:", error);
    throw error;
  }
}

// Helper function to handle product variants
async function handleProductVariants(ftpClient, productId, variants) {
  try {
    for (const variant of variants) {
      // Create the variant
      const productVariant = await db.productVariant.create({
        data: {
          product_id: productId,
          sku: variant.sku,
          price_rupees: parseFloat(variant.price_rupees),
          price_dollars: parseFloat(variant.price_dollars),
          stock_count: parseInt(variant.stock_count) || 0,
          stock_status: variant.stock_status || "yes",
          weight: variant.weight ? parseFloat(variant.weight) : null,
          is_default: variant.is_default || false,
        },
      });

      // Handle variant attribute values
      if (variant.attribute_values && variant.attribute_values.length > 0) {
        for (const attrValue of variant.attribute_values) {
          await db.variantAttributeValue.create({
            data: {
              variant_id: productVariant.id,
              attribute_value_id: parseInt(attrValue.attribute_value_id),
            },
          });
        }
      }

      // Handle variant images if present
      if (variant.images && variant.images.length > 0) {
        await handleProductImages(
          ftpClient,
          productId,
          variant.images,
          productVariant.id
        );
      }
    }
  } catch (error) {
    console.error("Error handling product variants:", error);
    throw error;
  }
}

// Get a single product by ID with all related data
export async function getOneProduct(id) {
  try {
    const productId = parseInt(id);

    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        SubCategory: {
          include: {
            Category: true,
          },
        },
        ProductImages: true, // Get all images without filtering
        ProductAttributes: {
          include: {
            Attribute: true,
            ProductAttributeValues: {
              include: {
                AttributeValue: true,
              },
            },
          },
        },
        ProductVariants: {
          include: {
            VariantAttributeValues: {
              include: {
                AttributeValue: {
                  include: {
                    Attribute: true,
                  },
                },
              },
            },
            ProductImages: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Check if we got any product images
    if (product.ProductImages.length === 0) {
      console.log("No images found for product ID:", productId);
    } else {
      console.log(
        `Found ${product.ProductImages.length} images for product ID:`,
        productId
      );
    }

    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error(`Failed to fetch the product: ${error.message}`);
  }
}

// Delete a product with all related data
export async function deleteProductById(id) {
  console.log("Deleting product with id:", id);
  if (!id) {
    throw new Error("Product ID is required");
  }

  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    const productId = parseInt(id);

    // First, fetch all images associated with the product (including variant images)
    const productImages = await db.productImage.findMany({
      where: { product_id: productId },
    });

    // Connect to FTP server to delete images
    if (productImages.length > 0) {
      await connectToFTP(ftpClient);

      // Delete each image from FTP
      for (const image of productImages) {
        try {
          const remoteFilePath = `${FTP_CONFIG.remoteDir}${image.image_path}`;
          await ftpClient.remove(remoteFilePath);
          console.log("Image deleted from FTP:", remoteFilePath);
        } catch (ftpError) {
          console.warn(
            "Error deleting image or file not found:",
            ftpError.message
          );
        }
      }
    }

    // Delete the product from the database
    // This should cascade and delete all related data due to the schema relationships
    const deletedProduct = await db.product.delete({
      where: { id: productId },
    });

    return {
      success: true,
      deletedProduct,
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error(`Failed to delete the product: ${error.message}`);
  } finally {
    ftpClient.close();
  }
}

// Get products with pagination, filtering, and sorting
export async function getProducts({
  page = 1,
  limit = 10,
  search = "",
  category = "",
  subcategory = "",
  status = "",
  sort = "latest",
  featured = "",
} = {}) {
  try {
    const skip = (page - 1) * limit;

    // Build the where clause based on filters
    let where = {};

    if (search) {
      where.title = { contains: search };
    }

    if (category) {
      where.cat_id = parseInt(category);
    }

    if (subcategory) {
      where.subcat_id = parseInt(subcategory);
    }

    if (status && (status === "active" || status === "inactive")) {
      where.status = status;
    }
    // Add featured filter
    if (featured && (featured === "yes" || featured === "no")) {
      where.featured = featured;
    }
    console.log("featureds",featured)
    // Determine sort order
    let orderBy = {};
    switch (sort) {
      case "latest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "price-high":
      case "price_high":
        orderBy = { price_rupees: "desc" };
        break;
      case "price-low":
      case "price_low":
        orderBy = { price_rupees: "asc" };
        break;
      case "name-asc":
      case "name_asc":
        orderBy = { title: "asc" };
        break;
      case "name-desc":
      case "name_desc":
        orderBy = { title: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    // Fetch products with pagination and filters
    const products = await db.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        SubCategory: {
          include: {
            Category: true,
          },
        },
        ProductImages: {
          // Looking at your database, none of your images have is_thumbnail=true
          // So we'll get all images for each product instead of filtering
          take: 5, // Limit to 5 images per product for performance
          orderBy: {
            display_order: "asc", // Order by display_order to get most important first
          },
        },
        ProductVariants: {
          select: {
            _count: true,
          },
        },
      },
    });

    // Get total count for pagination calculation
    const totalCount = await db.product.count({ where });

    // Filter out products with invalid SubCategory if needed for the client
    const validProducts = products.filter(
      (product) => product.SubCategory !== null
    );

    // Log image counts for debugging
    for (const product of validProducts) {
      console.log(
        `Product ${product.id} (${product.title}) has ${product.ProductImages.length} images`
      );
    }

    return {
      products: validProducts, // Send only products with valid subcategories
      totalPages: Math.ceil(totalCount / limit),
      total: totalCount,
    };
  } catch (error) {
    console.error("Error fetching products:", error.message);
    throw new Error("Failed to fetch products. Please try again later.");
  }
}

// Check if images exist for a product (debugging function)
export async function checkProductImages(productId) {
  try {
    // Get all images for the product
    const images = await db.productImage.findMany({
      where: { product_id: parseInt(productId) },
    });

    // Look specifically for thumbnail images
    const thumbnailImages = await db.productImage.findMany({
      where: {
        product_id: parseInt(productId),
        is_thumbnail: true,
      },
    });

    // Check if we need to fix this product's images
    let fixResult = null;
    if (images.length > 0 && thumbnailImages.length === 0) {
      // Set the first image as a thumbnail if none exists
      const firstImage = images[0];
      await db.productImage.update({
        where: { id: firstImage.id },
        data: { is_thumbnail: true },
      });
      fixResult = "Fixed: Set the first image as thumbnail";
    }

    return {
      success: true,
      imagesCount: images.length,
      thumbnailCount: thumbnailImages.length,
      images,
      fixResult,
    };
  } catch (error) {
    console.error("Error checking product images:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Utility function to fix all product images with no thumbnails
export async function fixProductImageThumbnails() {
  try {
    // Get all products
    const products = await db.product.findMany({
      select: { id: true },
    });

    let fixedCount = 0;

    // For each product, check if it needs fixing
    for (const product of products) {
      const images = await db.productImage.findMany({
        where: { product_id: product.id },
        orderBy: { display_order: "asc" },
      });

      const thumbnailImages = await db.productImage.findMany({
        where: {
          product_id: product.id,
          is_thumbnail: true,
        },
      });

      // If we have images but no thumbnails, fix it
      if (images.length > 0 && thumbnailImages.length === 0) {
        const firstImage = images[0];
        await db.productImage.update({
          where: { id: firstImage.id },
          data: { is_thumbnail: true },
        });
        fixedCount++;
      }
    }

    return {
      success: true,
      message: `Fixed ${fixedCount} products with missing thumbnails`,
    };
  } catch (error) {
    console.error("Error fixing product thumbnails:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update an existing product
export async function updateProduct(id, data) {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = true;

  try {
    console.log("Updating product with id:", id, "Data:", data);
    const productId = parseInt(id);

    // Fetch the existing product to check if it exists
    const existingProduct = await db.product.findUnique({
      where: { id: productId },
      include: {
        ProductImages: true,
        ProductAttributes: {
          include: {
            ProductAttributeValues: true,
          },
        },
        ProductVariants: {
          include: {
            VariantAttributeValues: true,
            ProductImages: true,
          },
        },
      },
    });

    if (!existingProduct) {
      throw new Error("Product not found");
    }

    // Prepare update data for the product
    const updateData = {
      title: data.title,
      description: data.description,
      status: data.status,
      hasVariants: data.hasVariants,
      base_price: parseFloat(data.base_price),
      price_rupees: parseFloat(data.price_rupees),
      price_dollars: parseFloat(data.price_dollars),
      stock_count: parseInt(data.stock_count),
      stock_status: data.stock_status,
      quantity_limit: parseInt(data.quantity_limit),
      terms_condition: data.terms_condition,
      highlights: data.highlights,
      meta_title: data.meta_title,
      meta_keywords: data.meta_keywords,
      meta_description: data.meta_description,
      hsn_code: data.hsn_code,
      tax: data.tax ? parseFloat(data.tax) : null,
      weight: data.weight ? parseFloat(data.weight) : null,
      free_shipping: data.free_shipping,
      cod: data.cod,
    };

    // If category or subcategory changed
    if (data.cat_id) updateData.cat_id = parseInt(data.cat_id);
    if (data.subcat_id) updateData.subcat_id = parseInt(data.subcat_id);

    // 1. Update the product basic details
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: updateData,
    });

    // 2. Handle product images if new ones are provided
    if (data.newImages && data.newImages.length > 0) {
      await handleProductImages(ftpClient, productId, data.newImages);
    }

    // 3. Handle deleted images
    if (data.deletedImageIds && data.deletedImageIds.length > 0) {
      await deleteProductImages(ftpClient, data.deletedImageIds);
    }

    // 4. Update product attributes if provided
    if (data.updatedAttributes && data.updatedAttributes.length > 0) {
      // First remove existing product attribute values
      for (const attr of existingProduct.ProductAttributes) {
        await db.productAttributeValue.deleteMany({
          where: { product_attribute_id: attr.id },
        });
      }

      // Then remove existing product attributes
      await db.productAttribute.deleteMany({
        where: { product_id: productId },
      });

      // Add the updated attributes
      await handleProductAttributes(productId, data.updatedAttributes);
    }

    // 5. Handle product variants
    if (data.hasVariants) {
      // Handle deleted variants
      if (data.deletedVariantIds && data.deletedVariantIds.length > 0) {
        for (const variantId of data.deletedVariantIds) {
          // First get variant images to delete them from FTP
          const variantImages = await db.productImage.findMany({
            where: { product_variant_id: parseInt(variantId) },
          });

          // Delete images from FTP
          if (variantImages.length > 0) {
            await connectToFTP(ftpClient);

            for (const image of variantImages) {
              try {
                const remoteFilePath = `${FTP_CONFIG.remoteDir}${image.image_path}`;
                await ftpClient.remove(remoteFilePath);
              } catch (ftpError) {
                console.warn("Error deleting variant image:", ftpError.message);
              }
            }
          }

          // Delete the variant (cascade will handle related records)
          await db.productVariant.delete({
            where: { id: parseInt(variantId) },
          });
        }
      }

      // Update existing variants
      if (data.updatedVariants && data.updatedVariants.length > 0) {
        for (const variant of data.updatedVariants) {
          if (variant.id) {
            // Update existing variant
            await db.productVariant.update({
              where: { id: parseInt(variant.id) },
              data: {
                sku: variant.sku,
                price_rupees: parseFloat(variant.price_rupees),
                price_dollars: parseFloat(variant.price_dollars),
                stock_count: parseInt(variant.stock_count),
                stock_status: variant.stock_status,
                weight: variant.weight ? parseFloat(variant.weight) : null,
                is_default: variant.is_default,
              },
            });

            // Handle variant attribute values if needed
            if (
              variant.updated_attribute_values &&
              variant.updated_attribute_values.length > 0
            ) {
              // First delete existing attribute values
              await db.variantAttributeValue.deleteMany({
                where: { variant_id: parseInt(variant.id) },
              });

              // Add new attribute values
              for (const attrValue of variant.updated_attribute_values) {
                await db.variantAttributeValue.create({
                  data: {
                    variant_id: parseInt(variant.id),
                    attribute_value_id: parseInt(attrValue.attribute_value_id),
                  },
                });
              }
            }

            // Handle new variant images
            if (variant.newImages && variant.newImages.length > 0) {
              await handleProductImages(
                ftpClient,
                productId,
                variant.newImages,
                parseInt(variant.id)
              );
            }
          }
        }
      }

      // Add new variants
      if (data.newVariants && data.newVariants.length > 0) {
        await handleProductVariants(ftpClient, productId, data.newVariants);
      }
    } else if (existingProduct.hasVariants) {
      // Product switched from having variants to no variants - delete all variants
      await db.productVariant.deleteMany({
        where: { product_id: productId },
      });
    }

    // Fetch the updated product with all relationships
    const completeUpdatedProduct = await db.product.findUnique({
      where: { id: productId },
      include: {
        SubCategory: {
          include: {
            Category: true,
          },
        },
        ProductImages: true,
        ProductAttributes: {
          include: {
            Attribute: true,
            ProductAttributeValues: {
              include: {
                AttributeValue: true,
              },
            },
          },
        },
        ProductVariants: {
          include: {
            VariantAttributeValues: {
              include: {
                AttributeValue: {
                  include: {
                    Attribute: true,
                  },
                },
              },
            },
            ProductImages: true,
          },
        },
      },
    });

    return completeUpdatedProduct;
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error(`Failed to update the product: ${error.message}`);
  } finally {
    ftpClient.close();
  }
}

// Helper function to delete product images from FTP and database
async function deleteProductImages(ftpClient, imageIds) {
  try {
    // Fetch image data from database
    const imagesToDelete = await db.productImage.findMany({
      where: {
        id: {
          in: imageIds.map((id) => parseInt(id)),
        },
      },
    });

    if (imagesToDelete.length === 0) {
      return;
    }

    // Connect to FTP if not already connected
    await connectToFTP(ftpClient);

    // Delete each image from FTP and database
    for (const image of imagesToDelete) {
      try {
        const remoteFilePath = `${FTP_CONFIG.remoteDir}${image.image_path}`;
        await ftpClient.remove(remoteFilePath);
        console.log("Image deleted from FTP:", remoteFilePath);
      } catch (ftpError) {
        console.warn(
          "Error deleting image or file not found on FTP:",
          ftpError.message
        );
      }

      // Delete from database regardless of FTP success
      await db.productImage.delete({
        where: { id: image.id },
      });
    }
  } catch (error) {
    console.error("Error deleting product images:", error);
    throw error;
  }
}

// Get product attributes for form selection
export async function getProductAttributes() {
  try {
    const attributes = await db.attribute.findMany({
      include: {
        AttributeValues: true,
      },
      orderBy: {
        display_order: "asc",
      },
    });

    return attributes;
  } catch (error) {
    console.error("Error fetching product attributes:", error);
    throw new Error(
      "Failed to fetch product attributes. Please try again later."
    );
  }
}

// Get categories and subcategories for form selection
export async function getCategoriesAndSubcategories() {
  try {
    const categories = await db.category.findMany({
      where: {
        showHome: "active",
      },
      include: {
        SubCategory: true,
      },
      orderBy: {
        catName: "asc",
      },
    });

    return categories;
  } catch (error) {
    console.error("Error fetching categories and subcategories:", error);
    throw new Error("Failed to fetch categories. Please try again later.");
  }
}

// Fix products with missing subcategories
export async function repairProductSubcategories() {
  try {
    // Find products with missing subcategory references
    const invalidProducts = await db.product.findMany({
      where: {
        OR: [{ SubCategory: null }, { subcat_id: null }],
      },
      select: {
        id: true,
      },
    });

    console.log(
      `Found ${invalidProducts.length} products with invalid subcategory references`
    );

    // Get a default subcategory to assign to these products
    const defaultSubcategory = await db.subCategory.findFirst({
      orderBy: {
        id: "asc",
      },
    });

    if (!defaultSubcategory) {
      return {
        success: false,
        error: "No subcategory found to use as default",
      };
    }

    // Update the invalid products with the default subcategory
    for (const product of invalidProducts) {
      await db.product.update({
        where: {
          id: product.id,
        },
        data: {
          subcat_id: defaultSubcategory.id,
          cat_id: defaultSubcategory.cat_id,
        },
      });
    }

    return {
      success: true,
      message: `Repaired ${invalidProducts.length} products with invalid subcategory references`,
    };
  } catch (error) {
    console.error(
      "Error repairing products:",
      error?.message || "Unknown error"
    );

    return {
      success: false,
      error: "Failed to repair product subcategories",
    };
  }
}

// In your product actions file (e.g., /actions/product.js)

// Toggle product featured status
export async function toggleProductFeatured(id, currentFeatured) {
  try {
    const productId = parseInt(id);
    const newFeaturedStatus = currentFeatured === "yes" ? "no" : "yes";

    // Update only the featured field
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: {
        featured: newFeaturedStatus
      }
    });

    return {
      success: true,
      product: updatedProduct,
      message: `Product ${updatedProduct.featured === "yes" ? "marked as featured" : "removed from featured"}`
    };
  } catch (error) {
    console.error("Error toggling product featured status:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to update product featured status"
    };
  }
}