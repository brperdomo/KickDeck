/**
 * RESTORE EXACT FLIGHT ASSIGNMENTS FROM CSV DATA
 * 
 * This script restores the exact team distributions based on the CSV file:
 * flight-configurations-2025-08-10_1754852060356.csv
 */

const flightConfig = {
  // Boys divisions
  "B2012": { "Nike Elite": 4, "Nike Premier": 7, "Nike Classic": 4 },
  "B2011": { "Nike Elite": 4, "Nike Premier": 4, "Nike Classic": 4 },
  "B2010": { "Nike Elite": 6, "Nike Premier": 8 }, // No classic listed
  "B2009": { "Nike Elite": 4, "Nike Premier": 6 }, // No classic listed  
  "B2007": { "Nike Elite": 4, "Nike Premier": 6 }, // No classic listed
  "B2019": { "Nike Classic": 5 }, // Only classic
  "B2018": { "Nike Classic": 3 }, // Only classic
  "B2017": { "Nike Premier": 6, "Nike Classic": 6 },
  "B2016": { "Nike Elite": 6, "Nike Premier": 7, "Nike Classic": 6 },
  "B2015": { "Nike Elite": 4, "Nike Premier": 7, "Nike Classic": 17 },
  "B2014": { "Nike Elite": 4, "Nike Premier": 8, "Nike Classic": 13 },
  "B2013": { "Nike Elite": 6, "Nike Premier": 7, "Nike Classic": 6 },
  
  // Girls divisions
  "G2012": { "Nike Elite": 3, "Nike Premier": 4, "Nike Classic": 4 },
  "G2011": { "Nike Elite": 6, "Nike Premier": 6, "Nike Classic": 4 },
  "G2010": { "Nike Elite": 4, "Nike Premier": 6 }, // No classic listed
  "G2009": { "Nike Elite": 5, "Nike Classic": 4 }, // No premier listed
  "G2007": { "Nike Elite": 4, "Nike Classic": 4 }, // No premier listed
  "G2017": { "Nike Premier": 6 }, // Only premier
  "G2016": { "Nike Classic": 6 }, // Only classic
  "G2015": { "Nike Elite": 4, "Nike Premier": 4, "Nike Classic": 4 },
  "G2014": { "Nike Elite": 4, "Nike Premier": 5, "Nike Classic": 6 },
  "G2013": { "Nike Premier": 6, "Nike Classic": 6 }
};

console.log("Flight configuration loaded:");
console.log(JSON.stringify(flightConfig, null, 2));