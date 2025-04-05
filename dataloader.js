// Global object to hold the data from Excel: keys are agency names.
let agencyDataMap = {};

// Function to load and parse the Excel file
async function loadAgencyData() {
  // Update with your GitHub raw URL for the Excel file
  const url = "https://github.com/MuhammadMohtashim/Extension/raw/refs/heads/main/data.xlsx"; 
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Convert sheet to JSON; header row is assumed in row 1.
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Assuming the first row has headers: ["Agency Name", "Agency Rating", "Agency Comments"]
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const agencyName = row[0];
      const agencyRating = row[1];
      const agencyComments = row[2];
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

// Load the data as soon as the script runs.
loadAgencyData();
