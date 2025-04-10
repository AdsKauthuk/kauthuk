"use server";

import { db } from "@/lib/prisma";

export async function createAttribute(data) {
  try {
    console.log("Received attribute data:", data);

    // Create the attribute with all required fields from schema
    const attribute = await db.attribute.create({
      data: {
        name: data.name,
        display_name: data.display_name,
        type: data.type || "text",
        is_variant: data.is_variant || false,
        affects_price: data.affects_price || false,
        display_order: data.display_order || 0
      },
    });

    console.log("Attribute created successfully:", attribute);
    return attribute;
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      throw new Error("Attribute with this name already exists.");
    }

    console.error("Error creating attribute:", error);
    throw new Error("Failed to create the attribute. Please try again.");
  }
}

export async function createAttributeValue(data) {
  try {
    console.log("Received attribute value data:", data);

    // Create the attribute value
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

    console.log("Attribute value created successfully:", attributeValue);
    return attributeValue;
  } catch (error) {
    console.error("Error creating attribute value:", error);
    throw new Error("Failed to create the attribute value. Please try again.");
  }
}

export async function getAttributes({
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
            { name: { contains: search } },
            { display_name: { contains: search } },
          ]
        }
      : {};

    // Fetch attributes with pagination and search filter
    const attributes = await db.attribute.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sort === "name" ? "name" : "id"]: sort === "name" ? "asc" : sort === "latest" ? "desc" : "asc",
      },
      include: {
        AttributeValues: {
          orderBy: {
            display_order: "asc"
          }
        }
      }
    });

    // Get total count for pagination calculation
    const totalCount = await db.attribute.count({ where });

    return {
      attributes: attributes || [], // Ensure attributes is never null
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    };
  } catch (error) {
    console.error("Error fetching attributes:", error.message);
    throw new Error("Failed to fetch attributes. Please try again later.");
  }
}

export async function getAllAttributes() {
  try {
    // Fetch all attributes with their values
    const attributes = await db.attribute.findMany({
      orderBy: {
        display_order: "asc"
      },
      include: {
        AttributeValues: {
          orderBy: {
            display_order: "asc"
          }
        }
      }
    });

    return {
      attributes: attributes || [] // Ensure attributes is never null
    };
  } catch (error) {
    console.error("Error fetching attributes:", error.message);
    throw new Error("Failed to fetch attributes. Please try again later.");
  }
}

export async function getAttributeById(id) {
  try {
    const attribute = await db.attribute.findUnique({
      where: { id },
      include: {
        AttributeValues: {
          orderBy: {
            display_order: "asc"
          }
        }
      }
    });

    if (!attribute) {
      throw new Error("Attribute not found");
    }

    return attribute;
  } catch (error) {
    console.error("Error fetching attribute:", error);
    throw new Error("Failed to fetch the attribute. Please try again.");
  }
}

export async function updateAttribute(data) {
  try {
    const id = data.id;
    // Validate input
    if (!id || !data.name || !data.display_name) {
      throw new Error("Invalid input. Required fields are missing.");
    }

    // Update the attribute
    const updatedAttribute = await db.attribute.update({
      where: { id },
      data: {
        name: data.name,
        display_name: data.display_name,
        type: data.type || "text",
        is_variant: data.is_variant,
        affects_price: data.affects_price,
        display_order: data.display_order || 0
      },
    });

    return updatedAttribute;
  } catch (error) {
    // Handle unique constraint error
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      throw new Error("Attribute with this name already exists.");
    }

    // Handle record not found error
    if (error.code === "P2025") {
      throw new Error("Attribute not found.");
    }

    console.error("Error updating attribute:", error);
    throw new Error("Failed to update the attribute. Please try again.");
  }
}

export async function updateAttributeValue(data) {
  try {
    const id = data.id;
    // Validate input
    if (!id || !data.value || !data.display_value) {
      throw new Error("Invalid input. Required fields are missing.");
    }

    // Update the attribute value
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
    // Handle record not found error
    if (error.code === "P2025") {
      throw new Error("Attribute value not found.");
    }

    console.error("Error updating attribute value:", error);
    throw new Error("Failed to update the attribute value. Please try again.");
  }
}

export async function deleteAttributeById(id) {
  try {
    if (!id) {
      throw new Error("Attribute ID is required");
    }

    // Check if attribute is used in any products
    const productAttributes = await db.productAttribute.findFirst({
      where: { attribute_id: id }
    });

    if (productAttributes) {
      throw new Error("Cannot delete attribute as it is being used in products");
    }

    // First delete all attribute values
    await db.attributeValue.deleteMany({
      where: { attribute_id: id }
    });

    // Then delete the attribute
    const deletedAttribute = await db.attribute.delete({
      where: { id }
    });

    return {
      success: true,
      deletedAttribute
    };
  } catch (error) {
    console.error("Error deleting attribute:", error);
    throw new Error(error.message || "Failed to delete the attribute. Please try again.");
  }
}

export async function deleteAttributeValueById(id) {
  try {
    if (!id) {
      throw new Error("Attribute value ID is required");
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

// Get just the variant attributes for variant selection
export async function getVariantAttributes() {
  try {
    const variantAttributes = await db.attribute.findMany({
      where: {
        is_variant: true
      },
      include: {
        AttributeValues: true
      },
      orderBy: {
        display_order: "asc"
      }
    });

    return variantAttributes;
  } catch (error) {
    console.error("Error fetching variant attributes:", error);
    throw new Error("Failed to fetch variant attributes. Please try again.");
  }
}

// Get price-affecting attributes for price configuration
export async function getPriceAffectingAttributes() {
  try {
    const priceAttributes = await db.attribute.findMany({
      where: {
        affects_price: true
      },
      include: {
        AttributeValues: true
      },
      orderBy: {
        display_order: "asc"
      }
    });

    return priceAttributes;
  } catch (error) {
    console.error("Error fetching price attributes:", error);
    throw new Error("Failed to fetch price-affecting attributes. Please try again.");
  }
}

export async function getAttributes2() {
  // console.log("search",search)
  try {
    // Fetch attributes with pagination and search filter
    const attributes = await db.attribute.findMany();

    // Get total count for pagination calculation

    return {
      attributes: attributes || [], // Ensure attributes is never null
    };
  } catch (error) {
    console.error("Error fetching attributes:", error.message);
    throw new Error("Failed to fetch attributes. Please try again later.");
  }
}