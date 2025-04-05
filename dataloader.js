// Global object to hold agency data, keyed by agency name.
let agencyDataMap = {};

// Set to true to load local data.txt packaged with your extension,
// or false to load the remote CSV file from GitHub.
const useLocalData = false;

async function loadAgencyData() {
  // Choose the URL based on useLocalData.
  let dataUrl;
  if (useLocalData) {
    // Generates a URL like: chrome-extension://<extension-id>/data.txt
    dataUrl = chrome.runtime.getURL('data.txt');
  } else {
    // Replace with your GitHub raw file URL.
    dataUrl = "https://raw.githubusercontent.com/MuhammadMohtashim/Extension/refs/heads/main/data.csv";
  }
  console.log("Fetching agency data from URL:", dataUrl);
  try {
    const response = await fetch(dataUrl);
    const textData = await response.text();
    // Split file into lines and remove empty lines.
    const lines = textData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Assume first line contains headers: "Agency Name,Agency Rating,Agency Comments"
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      const agencyName = row[0].trim();
      const agencyRating = row[1] ? row[1].trim() : "N/A";
      const agencyComments = row[2] ? row[2].trim() : "No comments";
      if (agencyName) {
        agencyDataMap[agencyName] = {
          rating: agencyRating,
          comments: agencyComments
        };
      }
    }
    console.log("Agency data loaded:", agencyDataMap);
  } catch (error) {
    console.error("Error loading agency data:", error);
  }
}

// Load the agency data when this script runs.
loadAgencyData();
