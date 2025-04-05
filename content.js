// Function to look up agency data for a given company name.
async function fetchCompanyData(companyName) {
  let attempts = 0;
  // Wait (retry) until agencyDataMap is populated.
  while (Object.keys(agencyDataMap).length === 0 && attempts < 5) {
    console.log("Waiting for agency data to load...");
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }
  console.log("Looking up data for:", companyName, "->", agencyDataMap[companyName]);
  return agencyDataMap[companyName] || null;
}

// Function to display the fetched company data near the reference element.
function displayCompanyData(companyName, data, referenceElement) {
  // Create an overlay container.
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.backgroundColor = "#fff";
  container.style.border = "1px solid #ccc";
  container.style.padding = "10px";
  container.style.zIndex = 9999;
  container.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  
  container.innerHTML = `<strong>${companyName}</strong><br>
    Rating: ${data.rating}<br>
    Comments: ${data.comments}`;
  
  // Position the container near the detected element.
  const rect = referenceElement.getBoundingClientRect();
  container.style.top = `${rect.top + window.scrollY}px`;
  container.style.left = `${rect.right + 10 + window.scrollX}px`;
  
  document.body.appendChild(container);
}

// Function to scan an element's text content for agency names.
async function scanElement(element) {
  const text = element.textContent;
  if (!text) return;
  
  // Use keys from agencyDataMap if available; otherwise, fallback to default keywords.
  const keywordsList = Object.keys(agencyDataMap).length > 0 ? Object.keys(agencyDataMap) : ["Recruitment Inc", "Agency XYZ", "Recruitment Agency"];
  
  for (let keyword of keywordsList) {
    if (text.includes(keyword)) {
      // Prevent duplicate processing.
      if (!element.dataset.companyDataDisplayed) {
        const companyData = await fetchCompanyData(keyword);
        if (companyData) {
          displayCompanyData(keyword, companyData, element);
          element.dataset.companyDataDisplayed = "true";
        }
      }
    }
  }
}

// Initial scan of the page.
document.querySelectorAll("body *").forEach(element => {
  scanElement(element);
});

// Observe for dynamic content changes.
const observer = new MutationObserver(mutationsList => {
  for (let mutation of mutationsList) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          scanElement(node);
          node.querySelectorAll("*").forEach(child => scanElement(child));
        }
      });
    }
  }
});

// Start observing document changes.
observer.observe(document.body, { childList: true, subtree: true });
