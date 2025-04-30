"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { getCachedCountries, getStatesByCountry } from "@/actions/country";
import { Loader2 } from "lucide-react";

// Country Select Component
export const CountrySelect = ({ 
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  onCountryIdChange // Add this prop to capture country ID changes
}) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const result = await getCachedCountries();
        
        if (result.success && result.countries) {
          setCountries(result.countries);
          
          // If we have a value and onCountryIdChange is provided, find the ID
          if (value && onCountryIdChange) {
            const selectedCountry = result.countries.find(
              c => c.country_enName.toLowerCase() === value.toLowerCase()
            );
            if (selectedCountry) {
              onCountryIdChange(selectedCountry.id);
            }
          }
        } else {
          console.error("Failed to fetch countries:", result.error);
        }
      } catch (err) {
        console.error("Error fetching countries:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [value, onCountryIdChange]);

  const handleCountryChange = (newValue) => {
    onChange(newValue);
    
    // When country changes, find its ID and update parent component
    if (onCountryIdChange) {
      const selectedCountry = countries.find(
        c => c.country_enName === newValue
      );
      if (selectedCountry) {
        onCountryIdChange(selectedCountry.id);
      }
    }
  };

  return (
    <div className="space-y-1.5">
      <Label 
        htmlFor={id}
        className="text-sm font-medium text-gray-700 block"
      >
        {label}{required && "*"}
      </Label>
      
      <Select
        value={value}
        onValueChange={handleCountryChange}
      >
        <SelectTrigger 
          id={id}
          className={`w-full rounded-lg ${
            error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-[#6B2F1A]"
          }`}
        >
          <SelectValue placeholder="Select a country">
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </div>
            ) : (
              value
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          <SelectGroup>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading countries...
              </div>
            ) : (
              countries.map((country) => (
                <SelectItem 
                  key={country.id} 
                  value={country.country_enName}
                  data-country-id={country.id}
                >
                  {country.country_enName}
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

// State Select Component
export const StateSelect = ({ 
  id,
  label,
  value,
  onChange,
  countryId,
  error,
  required = false
}) => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      // If countryId is not provided, don't fetch states
      if (!countryId) {
        setStates([]);
        return;
      }

      try {
        setLoading(true);
        const result = await getStatesByCountry(countryId);
        
        if (result.success && result.states) {
          setStates(result.states);
          
          // If the current value is not in the new states list, reset it
          if (value && !result.states.some(s => s.state_en === value)) {
            onChange(result.states.length > 0 ? result.states[0].state_en : '');
          }
        } else {
          console.error("Failed to fetch states:", result.error);
          setStates([]);
        }
      } catch (err) {
        console.error("Error fetching states:", err);
        setStates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, [countryId, onChange, value]);

  return (
    <div className="space-y-1.5">
      <Label 
        htmlFor={id}
        className="text-sm font-medium text-gray-700 block"
      >
        {label}{required && "*"}
      </Label>
      
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading || states.length === 0}
      >
        <SelectTrigger 
          id={id}
          className={`w-full rounded-lg ${
            error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-[#6B2F1A]"
          }`}
        >
          <SelectValue placeholder="Select a state">
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </div>
            ) : (
              value || (states.length === 0 ? "Select a country first" : "Select a state")
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          <SelectGroup>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading states...
              </div>
            ) : states.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                {countryId ? "No states found for this country" : "Select a country first"}
              </div>
            ) : (
              states.map((state) => (
                <SelectItem 
                  key={state.id} 
                  value={state.state_en}
                >
                  {state.state_en}
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};