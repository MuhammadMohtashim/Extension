let lastCheckedUrl = '';
let lastCheckedCompanyName = '';

// Main function to check the page for company names
function checkForCompanyNames() {
  // Avoid rechecking the same page
  if (window.location.href === lastCheckedUrl) return;
  lastCheckedUrl = window.location.href;
  
  // Check different LinkedIn page types
  if (window.location.href.includes('/company/')) {
    checkCompanyPage();
  } else if (window.location.href.includes('/jobs/')) {
    checkJobPage();
  } else if (window.location.href.includes('/search/results/')) {
    checkSearchResults();
  }
}

// Check company pages
function checkCompanyPage() {
  const companyNameElement = document.querySelector('.org-top-card-summary__title');
  if (companyNameElement) {
    const companyName = companyNameElement.textContent.trim();
    if (companyName !== lastCheckedCompanyName) {
      lastCheckedCompanyName = companyName;
      queryCompanyInfo(companyName, companyNameElement);
    }
  }
}

// Update the checkJobPage function in content.js
function checkJobPage() {
  // Handle job search view specifically
  if (window.location.href.includes('/jobs/search/')) {
    // When in the job search view, we need to watch for job selection changes
    // LinkedIn dynamically loads job details when clicked
    
    // Check for the company name in the job details panel
    const checkJobDetailsPanel = () => {
      const companyElements = document.querySelectorAll('.jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__company-name');
      
      companyElements.forEach(element => {
        const companyName = element.textContent.trim();
        if (companyName) {
          queryCompanyInfo(companyName, element, true); // The true flag will make it display as a popup
        }
      });
    };
    
    // Watch for changes in the job details panel
    const jobDetailsObserver = new MutationObserver(checkJobDetailsPanel);
    
    // Start observing the job details container
    const jobDetailsContainer = document.querySelector('.jobs-search__job-details');
    if (jobDetailsContainer) {
      jobDetailsObserver.observe(jobDetailsContainer, { childList: true, subtree: true });
    }
    
    // Also check when the page loads
    checkJobDetailsPanel();
  } else {
    // Handle regular job page (direct URL to job)
    const companyElements = document.querySelectorAll('.job-details-jobs-unified-top-card__company-name');
    companyElements.forEach(element => {
      const companyName = element.textContent.trim();
      if (companyName && companyName !== lastCheckedCompanyName) {
        lastCheckedCompanyName = companyName;
        queryCompanyInfo(companyName, element, true); // Show as popup
      }
    });
  }
}

// Check search results
function checkSearchResults() {
  const companyElements = document.querySelectorAll('.entity-result__title-text a, .job-card-container__company-name');
  companyElements.forEach(element => {
    const companyName = element.textContent.trim();
    if (companyName) {
      queryCompanyInfo(companyName, element);
    }
  });
}

// Update queryCompanyInfo function in content.js
function queryCompanyInfo(companyName, element, showAsPopup = false) {
  chrome.runtime.sendMessage(
    { action: 'checkCompany', companyName: companyName },
    response => {
      if (response && response.company) {
        if (showAsPopup) {
          displayCompanyInfoPopup(response.company, element);
        } else {
          displayCompanyInfo(response.company, element);
        }
      }
    }
  );
}

// Add this function to content.js
function displayCompanyInfoPopup(company, element) {
  // Remove any existing popup first
  const existingPopup = document.querySelector('.agency-checker-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // Create popup
  const popup = document.createElement('div');
  popup.className = 'agency-checker-popup';
  popup.style.cssText = `
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 20px;
    z-index: 9999;
    width: 320px;
    font-family: Arial, sans-serif;
  `;
  
  // Create header with rating
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  `;
  
  // Company name
  const nameElement = document.createElement('h3');
  nameElement.textContent = company.name;
  nameElement.style.margin = '0';
  
  // Rating badge
  const ratingBadge = document.createElement('span');
  ratingBadge.textContent = `${company.rating}/5`;
  ratingBadge.style.cssText = `
    background-color: ${getRatingColor(company.rating)};
    color: white;
    padding: 5px 10px;
    border-radius: 20px;
    font-weight: bold;
  `;
  
  header.appendChild(nameElement);
  header.appendChild(ratingBadge);
  
  // Comments section
  const comments = document.createElement('div');
  comments.innerHTML = `
    <strong>Agency Comments:</strong>
    <p>${company.comments || 'No comments available'}</p>
  `;
  
  // Close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.cssText = `
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 15px;
    float: right;
  `;
  closeButton.onclick = () => popup.remove();
  
  // Assemble popup
  popup.appendChild(header);
  popup.appendChild(comments);
  popup.appendChild(closeButton);
  
  // Add popup to the page
  document.body.appendChild(popup);
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.body.contains(popup)) {
      popup.remove();
    }
  }, 10000);
}

// Get color based on company rating
function getRatingColor(rating) {
  const numRating = parseFloat(rating);
  if (numRating >= 4) return '#28a745'; // Green
  if (numRating >= 3) return '#ffc107'; // Yellow
  return '#dc3545'; // Red
}

// Check the page immediately and whenever URL changes
checkForCompanyNames();
setInterval(checkForCompanyNames, 2000); // Periodic check every 2 seconds

// Also check when content is loaded or updated
document.addEventListener('DOMContentLoaded', checkForCompanyNames);
const observer = new MutationObserver(checkForCompanyNames);
observer.observe(document.body, { childList: true, subtree: true });