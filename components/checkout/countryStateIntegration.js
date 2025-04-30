"use client";

import { useState, useEffect } from "react";
import { getStatesByCountry } from "@/actions/country";

/**
 * Custom hook to manage country and state relationships in the checkout form
 * @param {Object} options - Options object
 * @param {Function} options.watch - Form watch function from react-hook-form
 * @param {Function} options.setValue - Form setValue function from react-hook-form
 * @param {Function} options.getValues - Form getValues function from react-hook-form
 * @returns {Object} - State values and utility functions
 */
export const useCountryStateFields = ({ watch, setValue, getValues }) => {
  // Country IDs for fetching states
  const [billingCountryId, setBillingCountryId] = useState(null);
  const [shippingCountryId, setShippingCountryId] = useState(null);
  
  // Loading states
  const [loadingBillingStates, setLoadingBillingStates] = useState(false);
  const [loadingShippingStates, setLoadingShippingStates] = useState(false);
  
  // Available states for each country
  const [billingStates, setBillingStates] = useState([]);
  const [shippingStates, setShippingStates] = useState([]);
  
  // Watch form values
  const watchBillingCountry = watch("billingCountry");
  const watchShippingCountry = watch("shippingCountry");
  const watchSameAsBilling = watch("sameAsBilling");

  // Lookup a country ID by name from the DOM
  const getCountryIdByName = (countryName) => {
    // Use data attributes to find the country ID
    const countryElements = document.querySelectorAll('[data-country-id]');
    let countryId = null;
    
    // Look through visible country elements to find a matching name
    countryElements.forEach(element => {
      if (element.textContent.trim() === countryName) {
        countryId = element.getAttribute('data-country-id');
      }
    });
    
    return countryId;
  };

  // Handle change of billing country
  useEffect(() => {
    const updateBillingStates = async () => {
      if (!watchBillingCountry) return;
      
      try {
        setLoadingBillingStates(true);
        
        // Find ID from selected country name
        const countryId = getCountryIdByName(watchBillingCountry);
        if (!countryId) return;
        
        setBillingCountryId(countryId);
        
        // Fetch states for this country
        const result = await getStatesByCountry(countryId);
        
        if (result.success && result.states) {
          setBillingStates(result.states);
          
          // Check if current state is in the new list
          const currentState = getValues("billingState");
          const stateExists = result.states.some(s => s.state_en === currentState);
          
          // If not, select first state or clear
          if (!stateExists) {
            setValue("billingState", result.states.length > 0 ? result.states[0].state_en : "");
          }
        } else {
          setBillingStates([]);
          setValue("billingState", "");
        }
      } catch (error) {
        console.error("Error fetching billing states:", error);
        setBillingStates([]);
        setValue("billingState", "");
      } finally {
        setLoadingBillingStates(false);
      }
    };
    
    updateBillingStates();
  }, [watchBillingCountry, setValue, getValues]);
  
  // Handle change of shipping country (when not same as billing)
  useEffect(() => {
    // Skip if shipping is same as billing
    if (watchSameAsBilling) return;
    
    const updateShippingStates = async () => {
      if (!watchShippingCountry) return;
      
      try {
        setLoadingShippingStates(true);
        
        // Find ID from selected country name
        const countryId = getCountryIdByName(watchShippingCountry);
        if (!countryId) return;
        
        setShippingCountryId(countryId);
        
        // Fetch states for this country
        const result = await getStatesByCountry(countryId);
        
        if (result.success && result.states) {
          setShippingStates(result.states);
          
          // Check if current state is in the new list
          const currentState = getValues("shippingState");
          const stateExists = result.states.some(s => s.state_en === currentState);
          
          // If not, select first state or clear
          if (!stateExists) {
            setValue("shippingState", result.states.length > 0 ? result.states[0].state_en : "");
          }
        } else {
          setShippingStates([]);
          setValue("shippingState", "");
        }
      } catch (error) {
        console.error("Error fetching shipping states:", error);
        setShippingStates([]);
        setValue("shippingState", "");
      } finally {
        setLoadingShippingStates(false);
      }
    };
    
    updateShippingStates();
  }, [watchShippingCountry, watchSameAsBilling, setValue, getValues]);
  
  // When "same as billing" changes to true
  useEffect(() => {
    if (watchSameAsBilling) {
      // Copy billing address to shipping
      setValue("shippingCountry", getValues("billingCountry"));
      setValue("shippingState", getValues("billingState"));
      setShippingCountryId(billingCountryId);
      setShippingStates(billingStates);
    }
  }, [watchSameAsBilling, setValue, getValues, billingCountryId, billingStates]);

  return {
    // Add the setter functions to the return object
    selectedCountryId: billingCountryId,
    selectedShippingCountryId: shippingCountryId,
    billingStates,
    shippingStates,
    loadingBillingStates,
    loadingShippingStates,
    setBillingCountryId,    // Export this setter
    setShippingCountryId    // Export this setter
  };
};