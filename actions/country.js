"use server";

import { db } from "@/lib/prisma";
import { cache } from "react";

/**
 * Fetch all countries
 * @returns {Promise<{success: boolean, countries: Array, error: string?}>}
 */
export async function getCountries() {
  try {
    const countries = await db.country.findMany({
      orderBy: {
        country_enName: 'asc'
      }
    });

    return { 
      success: true, 
      countries: countries || [] 
    };
  } catch (error) {
    console.error("Error fetching countries:", error);
    return { 
      success: false, 
      countries: [], 
      error: "Failed to fetch countries. Please try again." 
    };
  }
}

/**
 * Get a cached list of all countries for frequently accessed components
 * like dropdowns in forms
 */
export const getCachedCountries = cache(async () => {
  try {
    const countries = await db.country.findMany({
      select: {
        id: true,
        sortname: true,
        country_enName: true,
        currency_code: true
      },
      orderBy: {
        country_enName: 'asc'
      }
    });
    
    return { 
      success: true, 
      countries: countries || [] 
    };
  } catch (error) {
    console.error("Error fetching cached countries:", error);
    return { 
      success: false, 
      countries: [], 
      error: "Failed to fetch countries" 
    };
  }
});

/**
 * Get a single country by ID
 * @param {number} id - Country ID
 * @returns {Promise<{success: boolean, country: object?, error: string?}>}
 */
export async function getCountryById(id) {
  try {
    if (!id) {
      return { 
        success: false, 
        error: "Country ID is required" 
      };
    }

    const countryId = parseInt(id);
    if (isNaN(countryId)) {
      return { 
        success: false, 
        error: "Invalid country ID format" 
      };
    }

    const country = await db.country.findUnique({
      where: {
        id: countryId
      }
    });

    if (!country) {
      return { 
        success: false, 
        error: "Country not found" 
      };
    }

    return { 
      success: true, 
      country 
    };
  } catch (error) {
    console.error("Error fetching country:", error);
    return { 
      success: false, 
      error: "Failed to fetch country. Please try again." 
    };
  }
}

/**
 * Get states for a specific country
 * @param {number} countryId - Country ID
 * @returns {Promise<{success: boolean, states: Array, error: string?}>}
 */
export async function getStatesByCountry(countryId) {
  try {
    if (!countryId) {
      return { 
        success: false, 
        states: [], 
        error: "Country ID is required" 
      };
    }

    const parsedCountryId = parseInt(countryId);
    if (isNaN(parsedCountryId)) {
      return { 
        success: false, 
        states: [], 
        error: "Invalid country ID format" 
      };
    }

    const states = await db.states.findMany({
      where: {
        country_id: parsedCountryId
      },
      orderBy: {
        state_en: 'asc'
      }
    });

    return { 
      success: true, 
      states: states || [] 
    };
  } catch (error) {
    console.error("Error fetching states:", error);
    return { 
      success: false, 
      states: [], 
      error: "Failed to fetch states. Please try again." 
    };
  }
}

/**
 * Get all states (optionally filtered by country)
 * @param {Object} options - Filter options
 * @param {number} [options.countryId] - Optional country ID to filter states
 * @param {number} [options.page=1] - Page number for pagination
 * @param {number} [options.limit=50] - Number of states per page
 * @returns {Promise<{success: boolean, states: Array, totalPages: number?, error: string?}>}
 */
export async function getAllStates({ 
  countryId = null,
  page = 1, 
  limit = 50 
} = {}) {
  try {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = ((isNaN(pageNum) ? 1 : pageNum) - 1) * (isNaN(limitNum) ? 50 : limitNum);
    
    // Prepare where clause based on countryId
    const where = {};
    if (countryId) {
      const parsedCountryId = parseInt(countryId);
      if (!isNaN(parsedCountryId)) {
        where.country_id = parsedCountryId;
      }
    }

    // Get states with pagination
    const states = await db.states.findMany({
      where,
      skip,
      take: isNaN(limitNum) ? 50 : limitNum,
      include: {
        Country: {
          select: {
            id: true,
            sortname: true,
            country_enName: true
          }
        }
      },
      orderBy: [
        { country_id: 'asc' },
        { state_en: 'asc' }
      ]
    });

    // Get total count for pagination
    const totalCount = await db.states.count({ where });

    return { 
      success: true, 
      states: states || [], 
      totalPages: Math.ceil(totalCount / (isNaN(limitNum) ? 50 : limitNum))
    };
  } catch (error) {
    console.error("Error fetching all states:", error);
    return { 
      success: false, 
      states: [], 
      error: "Failed to fetch states. Please try again." 
    };
  }
}

/**
 * Get a state by ID
 * @param {number} id - State ID
 * @returns {Promise<{success: boolean, state: object?, error: string?}>}
 */
export async function getStateById(id) {
  try {
    if (!id) {
      return { 
        success: false, 
        error: "State ID is required" 
      };
    }

    const stateId = parseInt(id);
    if (isNaN(stateId)) {
      return { 
        success: false, 
        error: "Invalid state ID format" 
      };
    }

    const state = await db.states.findUnique({
      where: {
        id: stateId
      },
      include: {
        Country: {
          select: {
            id: true,
            sortname: true,
            country_enName: true
          }
        }
      }
    });

    if (!state) {
      return { 
        success: false, 
        error: "State not found" 
      };
    }

    return { 
      success: true, 
      state 
    };
  } catch (error) {
    console.error("Error fetching state:", error);
    return { 
      success: false, 
      error: "Failed to fetch state. Please try again." 
    };
  }
}

/**
 * Add a new country
 * @param {Object} data - Country data
 * @returns {Promise<{success: boolean, country: object?, error: string?}>}
 */
export async function addCountry(data) {
  try {
    if (!data || !data.country_enName || !data.sortname) {
      return {
        success: false,
        error: "Country name and sort name are required"
      };
    }

    const country = await db.country.create({
      data: {
        country_enName: data.country_enName.trim(),
        sortname: data.sortname.trim(),
        country_arName: data.country_arName || null,
        dial_code: data.dial_code || null,
        currency_name: data.currency_name || null,
        currency_code: data.currency_code || null,
      }
    });

    return {
      success: true,
      country
    };
  } catch (error) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.includes("country_enName") 
        ? "Country name" 
        : "Country code";
      
      return {
        success: false,
        error: `${field} already exists.`
      };
    }

    console.error("Error adding country:", error);
    return {
      success: false,
      error: "Failed to add country. Please try again."
    };
  }
}

/**
 * Add a new state
 * @param {Object} data - State data
 * @returns {Promise<{success: boolean, state: object?, error: string?}>}
 */
export async function addState(data) {
  try {
    if (!data || !data.state_en || !data.country_id) {
      return {
        success: false,
        error: "State name and country ID are required"
      };
    }

    const countryId = parseInt(data.country_id);
    if (isNaN(countryId)) {
      return {
        success: false,
        error: "Invalid country ID format"
      };
    }

    // Check if country exists
    const countryExists = await db.country.findUnique({
      where: { id: countryId }
    });

    if (!countryExists) {
      return {
        success: false,
        error: "Country not found"
      };
    }

    const state = await db.states.create({
      data: {
        state_en: data.state_en.trim(),
        country_id: countryId
      }
    });

    return {
      success: true,
      state
    };
  } catch (error) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "This state already exists in the selected country."
      };
    }

    console.error("Error adding state:", error);
    return {
      success: false,
      error: "Failed to add state. Please try again."
    };
  }
}

/**
 * Update a country
 * @param {Object} data - Country data with ID
 * @returns {Promise<{success: boolean, country: object?, error: string?}>}
 */
export async function updateCountry(data) {
  try {
    if (!data || !data.id || !data.country_enName || !data.sortname) {
      return {
        success: false,
        error: "Country ID, name, and sort name are required"
      };
    }

    const countryId = parseInt(data.id);
    if (isNaN(countryId)) {
      return {
        success: false,
        error: "Invalid country ID format"
      };
    }

    const country = await db.country.update({
      where: { id: countryId },
      data: {
        country_enName: data.country_enName.trim(),
        sortname: data.sortname.trim(),
        country_arName: data.country_arName || null,
        dial_code: data.dial_code || null,
        currency_name: data.currency_name || null,
        currency_code: data.currency_code || null,
      }
    });

    return {
      success: true,
      country
    };
  } catch (error) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.includes("country_enName") 
        ? "Country name" 
        : "Country code";
      
      return {
        success: false,
        error: `${field} already exists.`
      };
    }

    if (error.code === "P2025") {
      return {
        success: false,
        error: "Country not found."
      };
    }

    console.error("Error updating country:", error);
    return {
      success: false,
      error: "Failed to update country. Please try again."
    };
  }
}

/**
 * Update a state
 * @param {Object} data - State data with ID
 * @returns {Promise<{success: boolean, state: object?, error: string?}>}
 */
export async function updateState(data) {
  try {
    if (!data || !data.id || !data.state_en) {
      return {
        success: false,
        error: "State ID and name are required"
      };
    }

    const stateId = parseInt(data.id);
    if (isNaN(stateId)) {
      return {
        success: false,
        error: "Invalid state ID format"
      };
    }

    // If country_id is present, validate it
    let countryId = null;
    if (data.country_id) {
      countryId = parseInt(data.country_id);
      if (isNaN(countryId)) {
        return {
          success: false,
          error: "Invalid country ID format"
        };
      }

      // Check if country exists
      const countryExists = await db.country.findUnique({
        where: { id: countryId }
      });

      if (!countryExists) {
        return {
          success: false,
          error: "Country not found"
        };
      }
    }

    // Prepare update data
    const updateData = {
      state_en: data.state_en.trim()
    };

    // Add country_id to update data if it's present
    if (countryId !== null) {
      updateData.country_id = countryId;
    }

    const state = await db.states.update({
      where: { id: stateId },
      data: updateData
    });

    return {
      success: true,
      state
    };
  } catch (error) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "This state already exists in the selected country."
      };
    }

    if (error.code === "P2025") {
      return {
        success: false,
        error: "State not found."
      };
    }

    console.error("Error updating state:", error);
    return {
      success: false,
      error: "Failed to update state. Please try again."
    };
  }
}

/**
 * Delete a country
 * @param {number} id - Country ID
 * @returns {Promise<{success: boolean, message: string, error: string?}>}
 */
export async function deleteCountry(id) {
  try {
    if (!id) {
      return {
        success: false,
        error: "Country ID is required"
      };
    }

    const countryId = parseInt(id);
    if (isNaN(countryId)) {
      return {
        success: false,
        error: "Invalid country ID format"
      };
    }

    // Check if there are states associated with this country
    const statesCount = await db.states.count({
      where: { country_id: countryId }
    });

    if (statesCount > 0) {
      return {
        success: false,
        error: "Cannot delete country with existing states. Please delete states first."
      };
    }

    // Check if there are delivery or billing addresses using this country
    const deliveryAddressCount = await db.deliveryAddress.count({
      where: { country_id: countryId }
    });

    const billingAddressCount = await db.billingAddress.count({
      where: { country_id: countryId }
    });

    if (deliveryAddressCount > 0 || billingAddressCount > 0) {
      return {
        success: false,
        error: "Cannot delete country that is used in customer addresses."
      };
    }

    // Delete the country
    await db.country.delete({
      where: { id: countryId }
    });

    return {
      success: true,
      message: "Country deleted successfully"
    };
  } catch (error) {
    if (error.code === "P2025") {
      return {
        success: false,
        error: "Country not found."
      };
    }

    console.error("Error deleting country:", error);
    return {
      success: false,
      error: "Failed to delete country. Please try again."
    };
  }
}

/**
 * Delete a state
 * @param {number} id - State ID
 * @returns {Promise<{success: boolean, message: string, error: string?}>}
 */
export async function deleteState(id) {
  try {
    if (!id) {
      return {
        success: false,
        error: "State ID is required"
      };
    }

    const stateId = parseInt(id);
    if (isNaN(stateId)) {
      return {
        success: false,
        error: "Invalid state ID format"
      };
    }

    // Check if there are delivery or billing addresses using this state
    const deliveryAddressCount = await db.deliveryAddress.count({
      where: { state_id: stateId }
    });

    const billingAddressCount = await db.billingAddress.count({
      where: { state_id: stateId }
    });

    if (deliveryAddressCount > 0 || billingAddressCount > 0) {
      return {
        success: false,
        error: "Cannot delete state that is used in customer addresses."
      };
    }

    // Delete the state
    await db.states.delete({
      where: { id: stateId }
    });

    return {
      success: true,
      message: "State deleted successfully"
    };
  } catch (error) {
    if (error.code === "P2025") {
      return {
        success: false,
        error: "State not found."
      };
    }

    console.error("Error deleting state:", error);
    return {
      success: false,
      error: "Failed to delete state. Please try again."
    };
  }
}