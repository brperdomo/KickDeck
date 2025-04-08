/**
 * Represents a field complex with its full information
 */
export interface Complex {
  id: number;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phoneNumber?: string | null;
  email?: string | null;
  website?: string | null;
  
  // Location data (latitude and longitude are required for sharing/geolocation)
  latitude: number;
  longitude: number;
  
  // Operating hours
  openTime?: string | null;
  closeTime?: string | null;
  
  // Sharing fields
  shared: boolean;  // Is this complex shared with other instances?
  sharedId?: string | null;  // Unique ID used for cross-instance identification
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}