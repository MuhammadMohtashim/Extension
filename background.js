let companyData = [];

// Fetch company data from GitHub CSV
async function fetchCompanyData() {
  try {
    // Replace with your actual GitHub raw CSV URL
    const response = await fetch('https://raw.githubusercontent.com/MuhammadMohtashim/Extension/refs/heads/main/data.csv');
    const csvText = await response.text();
    companyData = parseCSV(csvText);
    
    // Store in local storage for quick access
    chrome.storage.local.set({ companyData: companyData });
    console.log('Company data loaded:', companyData.length, 'entries');
  } catch (error) {
    console.error('Error fetching company data:', error);
  }
}

// Parse CSV into an array of company objects
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    if (!line.trim()) return null;
    
    const values = line.split(',');
    const company = {};
    
    // Map CSV headers to our expected properties
    company.name = values[headers.indexOf('Agency Name')]?.trim() || '';
    company.rating = values[headers.indexOf('Agency Rating')]?.trim() || '0';
    company.comments = values[headers.indexOf('Agency Comments')]?.trim() || '';
    
    return company;
  }).filter(company => company !== null && company.name);
}

// Initial data load when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  fetchCompanyData();
  
  // Set up periodic data refresh (e.g., once a day)
  setInterval(fetchCompanyData, 24 * 60 * 60 * 1000);
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkCompany') {
    const companyName = request.companyName;
    const matchedCompany = findCompany(companyName);
    sendResponse({ company: matchedCompany });
  } else if (request.action === 'refreshData') {
    fetchCompanyData();
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});

// Find company in our data
function findCompany(name) {
  if (!name || !companyData.length) return null;
  
  // Case insensitive partial matching
  const normalized = name.toLowerCase().trim();
  return companyData.find(company => 
    company.name.toLowerCase().includes(normalized) || 
    normalized.includes(company.name.toLowerCase())
  );
}