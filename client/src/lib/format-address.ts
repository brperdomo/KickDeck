import { Complex } from "@/types/complex";

/**
 * Formats the complex address in a consistent way
 */
export function formatAddress(complex: Complex): string {
  const addressParts = [
    complex.address,
    complex.city,
    complex.state,
    complex.zipCode,
    complex.country !== "USA" && complex.country !== "United States" ? complex.country : ""
  ].filter(Boolean);
  
  return addressParts.join(", ");
}

/**
 * Generates a Google Maps URL for the given complex
 */
export function getGoogleMapsUrl(complex: Complex): string {
  // If we have coordinates, use them for precise location
  if (complex.latitude && complex.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${complex.latitude},${complex.longitude}`;
  }
  
  // Otherwise fall back to address search
  const addressQuery = encodeURIComponent(formatAddress(complex));
  return `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
}

/**
 * Generates a Google Maps directions URL for the given complex
 */
export function getDirectionsUrl(complex: Complex): string {
  // If we have coordinates, use them for precise location
  if (complex.latitude && complex.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${complex.latitude},${complex.longitude}`;
  }
  
  // Otherwise fall back to address search
  const addressQuery = encodeURIComponent(formatAddress(complex));
  return `https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`;
}

/**
 * Formats operating hours in a consistent way
 */
export function formatHours(complex: Complex): string {
  if (complex.openTime && complex.closeTime) {
    return `${formatTime(complex.openTime)} - ${formatTime(complex.closeTime)}`;
  } else if (complex.openTime) {
    return `Opens at ${formatTime(complex.openTime)}`;
  } else if (complex.closeTime) {
    return `Closes at ${formatTime(complex.closeTime)}`;
  }
  
  return "Hours not specified";
}

/**
 * Helper function to format time strings
 */
function formatTime(timeString: string): string {
  try {
    // Check if timeString is already in 12-hour format
    if (timeString.includes("AM") || timeString.includes("PM")) {
      return timeString;
    }
    
    // Parse time string (expected format: "HH:MM:SS" or "HH:MM")
    const [hours, minutes] = timeString.split(":").map(Number);
    
    // Convert to 12-hour format
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  } catch (error) {
    // In case of parsing errors, return the original string
    return timeString;
  }
}