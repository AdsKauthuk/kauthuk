import React, { useEffect, useState } from 'react';
import { getCountries, getStatesByCountry } from '@/actions/country';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Country Select component
export const CountrySelect = ({ 
  value, 
  onChange, 
  error,
  id = "country", 
  label = "Country",
  className = "", 
  required = false 
}) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const result = await getCountries();
        if (result.success) {
          setCountries(result.countries);
        } else {
          setFetchError(result.error || "Failed to load countries");
        }
      } catch (error) {
        setFetchError("Error loading countries. Please try again.");
        console.error("Country fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-gray-700 mb-1.5 block">
        {label}{required && "*"}
      </label>
      <select
        id={id}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={`w-full h-10 px-3 py-2 bg-white border rounded-lg text-sm ${
          error
            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 focus:ring-[#6B2F1A] focus:border-[#6B2F1A]"
        } outline-none transition-colors duration-200 ease-in-out`}
      >
        <option value="">Select a country</option>
        {countries.map((country) => (
          <option key={country.id} value={country.id.toString()}>
            {country.country_enName}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1.5">{error}</p>}
      {fetchError && (
        <Alert className="mt-2 bg-red-50 text-red-800 border-red-100">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{fetchError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// State Select component
export const StateSelect = ({ 
  value, 
  onChange, 
  countryId, 
  error,
  id = "state", 
  label = "State/Province",
  className = "", 
  required = false 
}) => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchStates = async () => {
      // Reset states when country changes
      setStates([]);
      
      // Only fetch states if we have a valid countryId
      if (!countryId) {
        return;
      }

      try {
        setLoading(true);
        const result = await getStatesByCountry(countryId);
        if (result.success) {
          setStates(result.states);
          setFetchError(null);
        } else {
          setFetchError(result.error || "Failed to load states");
        }
      } catch (error) {
        setFetchError("Error loading states. Please try again.");
        console.error("State fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, [countryId]);

  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-gray-700 mb-1.5 block">
        {label}{required && "*"}
      </label>
      <select
        id={id}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || !countryId}
        className={`w-full h-10 px-3 py-2 bg-white border rounded-lg text-sm ${
          error
            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 focus:ring-[#6B2F1A] focus:border-[#6B2F1A]"
        } outline-none transition-colors duration-200 ease-in-out`}
      >
        <option value="">Select a state</option>
        {states.map((state) => (
          <option key={state.id} value={state.id.toString()}>
            {state.state_en}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1.5">{error}</p>}
      {fetchError && (
        <Alert className="mt-2 bg-red-50 text-red-800 border-red-100">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{fetchError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};