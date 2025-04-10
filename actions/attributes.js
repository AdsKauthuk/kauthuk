// actions/attribute.js
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/prisma';

/**
 * Fetch all attributes with their values
 */
export async function getAttributes() {
  try {
    const attributes = await db.attribute.findMany({
      include: {
        AttributeValues: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return { success: true, attributes };
  } catch (error) {
    console.error("Error fetching attributes:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new attribute with values
 */
export async function createAttribute(data) {
  try {
    // Create attribute and values in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the attribute
      const attribute = await tx.attribute.create({
        data: {
          name: data.name,
          type: data.type
        }
      });

      // Create attribute values if provided
      if (data.values && data.values.length > 0) {
        await tx.attributeValue.createMany({
          data: data.values.map(value => ({
            attribute_id: attribute.id,
            value: value
          }))
        });
      }

      return attribute;
    });

    revalidatePath('/admin/attributes');
    return { success: true, attribute: result };
  } catch (error) {
    console.error("Error creating attribute:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing attribute and its values
 */
export async function updateAttribute(id, data) {
  try {
    const attributeId = parseInt(id, 10);
    
    // Update in transaction
    const result = await db.$transaction(async (tx) => {
      // Update attribute
      const attribute = await tx.attribute.update({
        where: { id: attributeId },
        data: {
          name: data.name,
          type: data.type
        }
      });

      // Handle values - delete existing and create new
      if (data.values) {
        // Delete existing values
        await tx.attributeValue.deleteMany({
          where: { attribute_id: attributeId }
        });

        // Create new values
        if (data.values.length > 0) {
          await tx.attributeValue.createMany({
            data: data.values.map(value => ({
              attribute_id: attributeId,
              value: value
            }))
          });
        }
      }

      return attribute;
    });

    revalidatePath('/admin/attributes');
    return { success: true, attribute: result };
  } catch (error) {
    console.error("Error updating attribute:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an attribute and its values
 * Note: This will fail if the attribute is used in any products
 */
export async function deleteAttribute(id) {
  try {
    const attributeId = parseInt(id, 10);
    
    // Check if attribute is in use
    const inUse = await db.variantValue.findFirst({
      where: { attribute_id: attributeId }
    });

    if (inUse) {
      return {
        success: false,
        error: 'This attribute is used in products and cannot be deleted.'
      };
    }

    // Delete in transaction
    await db.$transaction(async (tx) => {
      // Delete attribute values
      await tx.attributeValue.deleteMany({
        where: { attribute_id: attributeId }
      });
      
      // Delete attribute
      await tx.attribute.delete({
        where: { id: attributeId }
      });
    });

    revalidatePath('/admin/attributes');
    return { success: true };
  } catch (error) {
    console.error("Error deleting attribute:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get attribute values for a specific attribute
 */
export async function getAttributeValues(attributeId) {
  try {
    const values = await db.attributeValue.findMany({
      where: { attribute_id: parseInt(attributeId, 10) },
      orderBy: { value: 'asc' }
    });

    return { success: true, values };
  } catch (error) {
    console.error("Error fetching attribute values:", error);
    return { success: false, error: error.message };
  }
}