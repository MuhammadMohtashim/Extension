// Global object to hold agency data, keyed by agency name.
let agencyDataMap = {};

// Function to load and parse the CSV text file.
async function loadAgencyData() {
  // Replace with your GitHub raw file URL.
  const url = "https://raw.githubusercontent.com/MuhammadMohtashim/Extension/refs/heads/main/data.csv";
  console.log("Fetching agency data from URL:", url);
  try {
    const response = await fetch(url);
    const textData = await response.text();
    // Split file into lines and trim whitespace.
    const lines = textData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // First line is assumed to be headers: "Agency Name,Agency Rating,Agency Comments"
    const headers = lines[0].split(',');
    
    // Process each subsequent line.
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
