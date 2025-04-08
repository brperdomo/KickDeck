import { useEffect, useState } from 'react';

interface UseGoogleMapsScriptProps {
  apiKey?: string;
}

interface UseGoogleMapsScriptResult {
  loaded: boolean;
  error: Error | null;
}

// Augment window interface to include google property
declare global {
  interface Window {
    google?: {
      maps: any;
    };
  }
}

/**
 * Custom hook to dynamically load the Google Maps JavaScript API
 * Will attempt to use the provided API key or fall back to any key defined in the environment
 */
export function useGoogleMapsScript({ apiKey }: UseGoogleMapsScriptProps = {}): UseGoogleMapsScriptResult {
  const [state, setState] = useState<UseGoogleMapsScriptResult>({
    loaded: !!window.google?.maps,
    error: null,
  });

  useEffect(() => {
    // If Google Maps is already loaded, don't reload it
    if (window.google?.maps) {
      setState({ loaded: true, error: null });
      return;
    }

    // Don't load the script if it's already loading
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      const checkIfLoaded = () => {
        if (window.google?.maps) {
          setState({ loaded: true, error: null });
          return true;
        }
        return false;
      };

      // Check if it's already loaded
      if (!checkIfLoaded()) {
        // If not loaded yet, set up an interval to check
        const interval = setInterval(() => {
          if (checkIfLoaded()) {
            clearInterval(interval);
          }
        }, 100);

        // Clean up interval
        return () => clearInterval(interval);
      }
      return;
    }

    // Determine the API key to use
    const apiKeyToUse = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // If no API key is available, log an error
    if (!apiKeyToUse) {
      console.warn(
        'No Google Maps API key provided. Map functionality may be limited. ' +
        'Please provide an API key via the apiKey prop or the VITE_GOOGLE_MAPS_API_KEY environment variable.'
      );
    }

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKeyToUse || ''}&libraries=places`;
    script.async = true;
    script.defer = true;

    const onScriptLoad = () => {
      setState({ loaded: true, error: null });
    };

    const onScriptError = (error: Event | string) => {
      setState({
        loaded: false,
        error: error instanceof Error ? error : new Error('Failed to load Google Maps script'),
      });
      script.remove();
    };

    script.addEventListener('load', onScriptLoad);
    script.addEventListener('error', onScriptError as EventListener);

    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', onScriptLoad);
      script.removeEventListener('error', onScriptError as EventListener);

      // Don't remove the script on cleanup - other components might be using it
    };
  }, [apiKey]);

  return state;
}