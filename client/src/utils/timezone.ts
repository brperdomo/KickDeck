/**
 * Timezone utilities for converting timezone names to abbreviations
 * and formatting game times with proper timezone display
 */

// Timezone mapping from IANA timezone names to abbreviations
const TIMEZONE_ABBREVIATIONS: Record<string, string> = {
  // US Timezones
  'America/New_York': 'ET',
  'America/Detroit': 'ET',
  'America/Kentucky/Louisville': 'ET',
  'America/Kentucky/Monticello': 'ET',
  'America/Indiana/Indianapolis': 'ET',
  'America/Indiana/Vincennes': 'ET',
  'America/Indiana/Winamac': 'ET',
  'America/Indiana/Marengo': 'ET',
  'America/Indiana/Petersburg': 'ET',
  'America/Indiana/Vevay': 'ET',
  
  'America/Chicago': 'CT',
  'America/Indiana/Tell_City': 'CT',
  'America/Indiana/Knox': 'CT',
  'America/Menominee': 'CT',
  'America/North_Dakota/Center': 'CT',
  'America/North_Dakota/New_Salem': 'CT',
  'America/North_Dakota/Beulah': 'CT',
  
  'America/Denver': 'MT',
  'America/Boise': 'MT',
  
  'America/Los_Angeles': 'PT',
  'America/Metlakatla': 'PT',
  
  'America/Anchorage': 'AKT',
  'America/Juneau': 'AKT',
  'America/Nome': 'AKT',
  'America/Sitka': 'AKT',
  'America/Yakutat': 'AKT',
  
  'Pacific/Honolulu': 'HT',
  
  // Common fallbacks
  'America/Phoenix': 'MST', // Arizona doesn't observe DST
  'Pacific/Guam': 'ChST',
  'Pacific/Saipan': 'ChST',
  'America/Puerto_Rico': 'AST',
  'America/Virgin': 'AST',
};

/**
 * Convert IANA timezone name to common abbreviation
 */
export function getTimezoneAbbreviation(timezone?: string | null): string {
  if (!timezone) return 'ET'; // Default fallback
  
  return TIMEZONE_ABBREVIATIONS[timezone] || 'UTC';
}

/**
 * Format a game time string with timezone abbreviation
 */
export function formatGameTimeWithTimezone(
  timeString: string, 
  timezone?: string | null
): string {
  let timeOnly: string;
  
  // Extract time part from various formats
  if (timeString.includes('T')) {
    // Format: YYYY-MM-DDTHH:MM:SS
    timeOnly = timeString.split('T')[1].split(':').slice(0, 2).join(':');
  } else {
    // Assume already a time string
    timeOnly = timeString;
  }
  
  // Convert to 12-hour format
  const [hours, minutes] = timeOnly.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  const timezoneAbbr = getTimezoneAbbreviation(timezone);
  
  return `${formattedTime} ${timezoneAbbr}`;
}

/**
 * Get timezone abbreviation for a field based on complex data
 */
export function getFieldTimezone(complexes: any[], fieldId: number): string {
  for (const complex of complexes) {
    const field = complex.fields?.find((f: any) => f.id === fieldId);
    if (field) {
      return getTimezoneAbbreviation(complex.timezone);
    }
  }
  return 'ET'; // Default fallback
}