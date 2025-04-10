"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return; // Prevent execution on server

    const media = window.matchMedia(query);
    
    // Initial check
    setMatches(media.matches);
    
    // Add listener for changes
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    
    // Cleanup function
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query]); // Removed `matches` from dependencies to avoid infinite loop
  
  return matches;
}
