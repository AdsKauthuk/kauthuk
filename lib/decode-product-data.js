"use server";

import { db } from "@/lib/prisma";

// Helper functions for base64 encoding/decoding
// Must be async for server actions
export async function baseEncode(value) {
  if (value) {
    return Buffer.from(value.trim()).toString('base64');
  }
  return null;
}

export async function baseDecode(value, wrap = 0) {
  if (!value) return null;

  let decodedValue = Buffer.from(value.trim(), 'base64').toString('utf-8');

  if (wrap !== 0) {
    decodedValue = decodedValue.replace(new RegExp(`(.{${wrap}})`, 'g'), '$1<br />');
  }

  return decodedValue;
}

// Function to verify a plain password against a Base64 encoded password
export async function verifyBase64Password(plainPassword, encodedPassword) {
  try {
    // Decode the stored Base64 password
    const decodedStoredPassword = await baseDecode(encodedPassword);
    
    if (!decodedStoredPassword) {
      return false;
    }
    
    // Compare plain password with decoded password
    return plainPassword === decodedStoredPassword;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

/**
 * Updates all products by decoding Base64 encoded fields
 * @returns {Object} Result of the operation
 */
export async function decodeAndUpdateAllProducts() {
  try {
    // Get all products
    const products = await db.product.findMany();
    
    let updatedCount = 0;
    const errors = [];

    // Process each product
    for (const product of products) {
      try {
        // Fields that might be Base64 encoded
        const fieldsToCheck = [
          'description', 
          'terms_condition', 
          'highlights', 
          'meta_description', 
          'meta_keywords'
        ];

        const updateData = {};
        let needsUpdate = false;

        // Check each field and decode if it appears to be Base64
        for (const field of fieldsToCheck) {
          if (product[field] && await isLikelyBase64(product[field])) {
            try {
              const decoded = await baseDecode(product[field]);
              if (decoded && decoded !== product[field]) {
                updateData[field] = decoded;
                needsUpdate = true;
                console.log(`Decoded ${field} for product ${product.id}: ${product[field].substring(0, 20)}... -> ${decoded.substring(0, 20)}...`);
              }
            } catch (decodeError) {
              // If decoding fails, it probably wasn't Base64
              console.log(`Couldn't decode ${field} for product ${product.id}, probably not Base64`);
            }
          }
        }

        // Update the product if any fields were decoded
        if (needsUpdate) {
          await db.product.update({
            where: { id: product.id },
            data: updateData
          });
          updatedCount++;
        }
      } catch (productError) {
        errors.push({
          productId: product.id,
          error: productError.message
        });
        console.error(`Error updating product ${product.id}:`, productError);
      }
    }

    return {
      success: true,
      message: `Updated ${updatedCount} products`,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    console.error("Error decoding product data:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Checks if a string is likely to be Base64 encoded
 * @param {string} str The string to check
 * @returns {boolean} True if the string is likely Base64
 */
export async function isLikelyBase64(str) {
  if (typeof str !== 'string') return false;
  
  // Check if the string only contains valid Base64 characters
  if (!/^[A-Za-z0-9+/=]+$/.test(str)) return false;
  
  // Check if the string has correct Base64 length (multiple of 4)
  if (str.length % 4 !== 0) return false;
  
  try {
    // Try to decode and check if the result is different from the original
    const decoded = await baseDecode(str);
    if (!decoded) return false;
    
    // Check if the decoded string contains visible text characters
    // (Base64 encoded text usually has many visible characters when decoded)
    const visibleChars = decoded.replace(/[\s\r\n]/g, '').length;
    return visibleChars > 0 && visibleChars !== str.length;
  } catch (e) {
    return false;
  }
}

/**
 * Updates a single product by decoding Base64 encoded fields
 * @param {number} productId The ID of the product to update
 * @returns {Object} Result of the operation
 */
export async function decodeAndUpdateSingleProduct(productId) {
  try {
    // Get the product
    const product = await db.product.findUnique({
      where: { id: parseInt(productId) }
    });
    
    if (!product) {
      return {
        success: false,
        error: "Product not found"
      };
    }

    // Fields that might be Base64 encoded
    const fieldsToCheck = [
      'description', 
      'terms_condition', 
      'highlights', 
      'meta_description', 
      'meta_keywords'
    ];

    const updateData = {};
    let needsUpdate = false;
    const decodedFields = {};

    // Check each field and decode if it appears to be Base64
    for (const field of fieldsToCheck) {
      if (product[field] && await isLikelyBase64(product[field])) {
        try {
          const decoded = await baseDecode(product[field]);
          if (decoded && decoded !== product[field]) {
            updateData[field] = decoded;
            decodedFields[field] = {
              original: product[field],
              decoded: decoded
            };
            needsUpdate = true;
          }
        } catch (decodeError) {
          // If decoding fails, it probably wasn't Base64
          console.log(`Couldn't decode ${field} for product ${product.id}, probably not Base64`);
        }
      }
    }

    // Update the product if any fields were decoded
    if (needsUpdate) {
      await db.product.update({
        where: { id: product.id },
        data: updateData
      });
      
      return {
        success: true,
        message: `Updated product ${product.id}`,
        decodedFields
      };
    } else {
      return {
        success: true,
        message: "No Base64 encoded fields found that need decoding"
      };
    }
  } catch (error) {
    console.error(`Error decoding product ${productId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}