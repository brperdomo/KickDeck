interface AddressInfo {
  address: string;
  city: string;
  state: string;
  country?: string;
}

/**
 * Formats an address from address parts
 */
export function formatAddress(addressInfo: AddressInfo): string {
  const { address, city, state, country } = addressInfo;
  let formattedAddress = `${address}, ${city}, ${state}`;
  
  if (country && country !== 'USA' && country !== 'US') {
    formattedAddress += `, ${country}`;
  }
  
  return formattedAddress;
}