import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { debugEnvVars, googleMapsApiKey } from "@/lib/env";

// Extend the window interface to include the google object
declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapsAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  onPlaceSelect?: (place: any) => void;
}

export function GoogleMapsAutocomplete({
  value,
  onChange,
  placeholder = "Enter an address",
  className = "",
  onPlaceSelect,
}: GoogleMapsAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);

  // Debug environment variables when component mounts
  useEffect(() => {
    debugEnvVars();
  }, []);

  // Update input value when the value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Check if Google Maps API is loaded
  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log("Google Maps API is loaded");
        setIsGoogleMapsLoaded(true);
      } else {
        console.log("Google Maps API is not loaded yet");
        setIsGoogleMapsLoaded(false);
      }
    };
    
    // Initial check
    checkGoogleMapsLoaded();
    
    // Set up an interval to periodically check if Google Maps has loaded
    const interval = setInterval(checkGoogleMapsLoaded, 500);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  // Initialize traditional Google Maps Autocomplete (fallback method)
  useEffect(() => {
    if (!isGoogleMapsLoaded || !inputRef.current) {
      return;
    }

    try {
      console.log("Initializing Google Maps Autocomplete");
      
      // Check if the Google Maps Places Autocomplete constructor exists
      if (window.google.maps.places.Autocomplete) {
        // Create a standard autocomplete instance
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
        });

        // Store the instance
        autocompleteRef.current = autocomplete;

        // Add event listener for place changes
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place) {
            handlePlaceSelect(place);
          }
        });

        console.log("Google Maps Autocomplete initialized successfully");
        
        // Clean up on unmount
        return () => {
          if (autocompleteRef.current) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
        };
      } else {
        console.warn("Google Maps Places Autocomplete is not available");
      }
    } catch (error) {
      console.error('Error initializing Google Maps Autocomplete:', error);
    }
  }, [isGoogleMapsLoaded]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  // When a place is selected
  const handlePlaceSelect = (place: any) => {
    if (place) {
      console.log("Place selected:", place);
      
      // Get formatted address
      const formattedAddress = place.formatted_address || place.name || '';
      setInputValue(formattedAddress);
      onChange(formattedAddress, place);
      
      // Extract and set location data if available
      if (place.geometry && place.geometry.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        console.log("Location coordinates:", location);
        
        // Extract address components for additional fields
        if (place.address_components) {
          let city = '';
          let state = '';
          let country = '';
          
          place.address_components.forEach((component: any) => {
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name;
            }
            if (component.types.includes('country')) {
              country = component.long_name;
            }
          });
          
          console.log("Extracted address components:", { city, state, country });
          
          // Save this data to pass along with the place
          place.extractedData = { city, state, country, location };
        }
      }
      
      // Call the onPlaceSelect callback if provided
      if (onPlaceSelect) {
        onPlaceSelect(place);
      }
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={isGoogleMapsLoaded ? placeholder : `${placeholder} (Google Maps API not loaded)`}
        className={className}
      />
    </div>
  );
}