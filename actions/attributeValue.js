"use server";

import { db } from "@/lib/prisma";

export async function createAttributeValue(data) {
  try {
    console.log("Received attribute value data:", data);
    
    if (!data.attribute_id || !data.value || !data.display_value) {
      throw new Error("Missing required fields: attribute_id, value, and display_value are required");
    }

    // Create the attributeValue with all required fields
    const attributeValue = await db.attributeValue.create({
      data: {
        attribute_id: data.attribute_id,
        value: data.value,
        display_value: data.display_value,
        color_code: data.color_code || null,
        image_path: data.image_path || null,
        display_order: data.display_order || 0
      },
    });

    console.log("AttributeValue created successfully:", attributeValue);
    return attributeValue;
  } catch (error) {
    // Handle unique constraint error if applicable
    if (error.code === "P2002") {
      throw new Error("An attribute value with this value already exists for this attribute.");
    }

    console.error("Error creating attribute value:", error);
    throw new Error(`Failed to create the attribute value: ${error.message}`);
  }
}

export async function getAttributeValues({
  page = 1,
  limit = 15,
  search = "",
  attribute_id = null,
  sort = "latest",
}) {
  try {
    const skip = (page - 1) * limit;

    // Build where clause
    let where = {};
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { value: { contains: search } },
        { display_value: { contains: search } }
      ];
    }
    
    // Filter by attribute_id if provided
    if (attribute_id) {
      where.attribute_id = parseInt(attribute_id);
    }

    // Determine sort order
    const orderBy = {};
    switch (sort) {
      case "latest":
        orderBy.id = "desc";
        break;
      case "oldest":
        orderBy.id = "asc";
        break;
      case "display_order":
        orderBy.display_order = "asc";
        break;
      case "name":
        orderBy.value = "asc";
        break;
      default:
        orderBy.id = "desc";
    }

    // Fetch attribute values with pagination and filters
    const attributeValues = await db.attributeValue.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        Attribute: {
          select: {
            id: true,
            name: true,
            display_name: true,
            type: true
          },
        },
      },
    });

    // Get total count for pagination
    const totalCount = await db.attributeValue.count({ where });

    return {
      attributeValues: attributeValues || [],
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    };
  } catch (error) {
    console.error("Error fetching attribute values:", error.message);
    throw new Error("Failed to fetch attribute values. Please try again later.");
  }
}

export async function getAttributeValuesByAttributeId(attributeId) {
  try {
    if (!attributeId) {
      throw new Error("Attribute ID is required");
    }

    const attributeValues = await db.attributeValue.findMany({
      where: {
        attribute_id: parseInt(attributeId)
      },
      orderBy: {
        display_order: "asc"
      }
    });

    return attributeValues;
  } catch (error) {
    console.error("Error fetching attribute values:", error.message);
    throw new Error("Failed to fetch attribute values. Please try again later.");
  }
}

export async function getAttributeValueById(id) {
  try {
    if (!id) {
      throw new Error("Attribute Value ID is required");
    }

    const attributeValue = await db.attributeValue.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        Attribute: {
          select: {
            id: true,
            name: true,
            display_name: true,
            type: true
          }
        }
      }
    });

    if (!attributeValue) {
      throw new Error("Attribute value not found");
    }

    return attributeValue;
  } catch (error) {
    console.error("Error fetching attribute value:", error.message);
    throw new Error(`Failed to fetch attribute value: ${error.message}`);
  }
}

export async function updateAttributeValue(data) {
  try {
    const id = data.id;
    
    // Validate input
    if (!id || !data.value || !data.display_value) {
      throw new Error("Invalid input. Required fields are missing.");
    }

    // Update the attributeValue with all fields
    const updatedAttributeValue = await db.attributeValue.update({
      where: { id },
      data: {
        value: data.value,
        display_value: data.display_value,
        color_code: data.color_code,
        image_path: data.image_path,
        display_order: data.display_order || 0
      },
    });

    return updatedAttributeValue;
  } catch (error) {
    // Handle unique constraint error
    if (error.code === "P2002") {
      throw new Error("An attribute value with this value already exists for this attribute.");
    }

    // Handle record not found error
    if (error.code === "P2025") {
      throw new Error("Attribute value not found.");
    }

    console.error("Error updating attribute value:", error);
    throw new Error(`Failed to update the attribute value: ${error.message}`);
  }
}

export async function updateAttributeValueOrder(values) {
  try {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error("Invalid input. Expected an array of attribute values with IDs and display orders.");
    }

    // Use transaction to update all values atomically
    const updates = await db.$transaction(
      values.map(item => 
        db.attributeValue.update({
          where: { id: item.id },
          data: { display_order: item.display_order }
        })
      )
    );

    return { success: true, message: "Display order updated successfully" };
  } catch (error) {
    console.error("Error updating attribute value order:", error);
    throw new Error(`Failed to update display order: ${error.message}`);
  }
}

export async function deleteAttributeValueById(id) {
  try {
    if (!id) {
      throw new Error("Attribute Value ID is required");
    }

    // Check if value is used in any product attribute values
    const productAttributeValue = await db.productAttributeValue.findFirst({
      where: { attribute_value_id: id }
    });

    if (productAttributeValue) {
      throw new Error("Cannot delete attribute value as it is being used in products");
    }

    // Check if value is used in any variant attribute values
    const variantAttributeValue = await db.variantAttributeValue.findFirst({
      where: { attribute_value_id: id }
    });

    if (variantAttributeValue) {
      throw new Error("Cannot delete attribute value as it is being used in product variants");
    }

    // Delete the attribute value
    const deletedAttributeValue = await db.attributeValue.delete({
      where: { id }
    });

    return {
      success: true,
      deletedAttributeValue
    };
  } catch (error) {
    console.error("Error deleting attribute value:", error);
    throw new Error(error.message || "Failed to delete the attribute value. Please try again.");
  }
}

export async function bulkDeleteAttributeValues(ids) {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("Invalid input. Expected an array of IDs.");
    }

    // Check if any values are used in products
    const productAttributeValues = await db.productAttributeValue.findFirst({
      where: { 
        attribute_value_id: {
          in: ids
        }
      }
    });

    if (productAttributeValues) {
      throw new Error("Cannot delete attribute values as one or more are being used in products");
    }

    // Check if any values are used in variants
    const variantAttributeValues = await db.variantAttributeValue.findFirst({
      where: { 
        attribute_value_id: {
          in: ids
        }
      }
    });

    if (variantAttributeValues) {
      throw new Error("Cannot delete attribute values as one or more are being used in product variants");
    }

    // Delete the attribute values
    const { count } = await db.attributeValue.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return {
      success: true,
      count,
      message: `Successfully deleted ${count} attribute values`
    };
  } catch (error) {
    console.error("Error bulk deleting attribute values:", error);
    throw new Error(error.message || "Failed to delete attribute values. Please try again.");
  }
}