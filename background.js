let companyData = [];

// Fetch company data from Firebase Realtime Database
async function fetchCompanyData() {
  try {
    // Get your Firebase config from the Firebase console
    // Format: https://YOUR-PROJECT-ID.firebasedatabase.app/agencies.json
    const response = await fetch("https://recruiter-search-c7515-default-rtdb.europe-west1.firebasedatabase.app/agencies.json");
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert Firebase object format to array
    companyData = [];
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const agency = data[key];
        
        // Calculate average rating if there are multiple ratings
        let avgRating = 0;
        if (agency.ratings && Array.isArray(agency.ratings)) {
          const sum = agency.ratings.reduce((total, curr) => total + curr, 0);
          avgRating = (sum / agency.ratings.length).toFixed(1);
        } else if (typeof agency.ratings === 'object') {
          // Handle ratings as an object with numeric keys
          const ratingsArray = Object.values(agency.ratings);
          const sum = ratingsArray.reduce((total, curr) => total + curr, 0);
          avgRating = (sum / ratingsArray.length).toFixed(1);
        } else {
          avgRating = agency.rating || "0";
        }
        
        // Get top comments if available (sorted by likes)
        let topComments = "";
        if (agency.comments && Array.isArray(agency.comments)) {
          // Sort by likes and take top 5
          const sortedComments = [...agency.comments]
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, 5);
          
          topComments = sortedComments
            .map(comment => comment.text)
            .join(" | ");
        } else if (typeof agency.comments === 'object') {
          // Handle comments as an object with keys
          const commentsArray = Object.values(agency.comments);
          const sortedComments = commentsArray
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, 5);
            
          topComments = sortedComments
            .map(comment => comment.text)
            .join(" | ");
        } else {
          topComments = agency.comments || "";
        }
        
        companyData.push({
          id: key,
          name: agency.name || "",
          rating: avgRating,
          comments: topComments
        });
      }
    }
    
    // Store in local storage for quick access
    chrome.storage.local.set({ companyData: companyData });
    console.log('Company data loaded from Firebase:', companyData.length, 'entries');
  } catch (error) {
    console.error('Error fetching company data from Firebase:', error);
    
    // Attempt to load from local storage as fallback
    chrome.storage.local.get('companyData', (data) => {
      if (data.companyData) {
        companyData = data.companyData;
        console.log('Loaded cached data:', companyData.length, 'entries');
      }
    });
  }
}

// Initial data load when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  fetchCompanyData();
  
  // Set up periodic data refresh (e.g., once every hour)
  setInterval(fetchCompanyData, 60 * 60 * 1000);
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkCompany') {
    const companyName = request.companyName;
    const matchedCompany = findCompany(companyName);
    sendResponse({ company: matchedCompany });
  } else if (request.action === 'refreshData') {
    fetchCompanyData()
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep the message channel open for async response
  } else if (request.action === 'getCompanyData') {
    sendResponse({ companyData: companyData });
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