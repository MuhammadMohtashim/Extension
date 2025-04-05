// List of agency names (keywords) to detect.
// You can keep this list in sync with your Excel data or make it dynamic.
const keywords = ["Recruitment Inc", "Agency XYZ", "Recruitment Agency"];

// Modified fetch function to look up the agency info from our loaded data.
async function fetchCompanyData(companyName) {
  // Wait for the data to load if necessary (simple retry mechanism)
  let attempts = 0;
  while (Object.keys(agencyDataMap).length === 0 && attempts < 5) {
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }
  return agencyDataMap[companyName] || null;
}

// Function to display the fetched company data on the page.
function displayCompanyData(companyName, data, referenceElement) {
  // Create a container for the display.
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.backgroundColor = "#fff";
  container.style.border = "1px solid #ccc";
  container.style.padding = "10px";
  container.style.zIndex = 9999;
  container.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  
  container.innerHTML = `<strong>${companyName}</strong><br>
    Rating: ${data.rating || "N/A"}<br>
    Comments: ${data.comments || "No comments"}`;

  // Position the container near the reference element.
  const rect = referenceElement.getBoundingClientRect();
  container.style.top = `${rect.top + window.scrollY}px`;
  container.style.left = `${rect.right + 10 + window.scrollX}px`;

  // Append the container to the document.
  document.body.appendChild(container);
}

// Function to scan an element's text content for any of the keywords.
async function scanElement(element) {
  const text = element.textContent;
  if (!text) return;
  for (let keyword of keywords) {
    if (text.includes(keyword)) {
      // Avoid duplicate fetches by checking if this element has already been processed.
      if (!element.dataset.companyDataDisplayed) {
        const companyData = await fetchCompanyData(keyword);
        if (companyData) {
          displayCompanyData(keyword, companyData, element);
          // Mark that we've processed this element.
          element.dataset.companyDataDisplayed = "true";
        }
      }
    }
  }
}

// Initial scan of the page for keywords.
document.querySelectorAll("body *").forEach(element => {
  scanElement(element);
});

// Use MutationObserver to re-check for new agency names when the DOM changes.
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

// Start observing the document body for changes.
observer.observe(document.body, { childList: true, subtree: true });
