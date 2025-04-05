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

// Check job pages
function checkJobPage() {
  const companyElements = document.querySelectorAll('.job-details-jobs-unified-top-card__company-name');
  companyElements.forEach(element => {
    const companyName = element.textContent.trim();
    if (companyName && companyName !== lastCheckedCompanyName) {
      lastCheckedCompanyName = companyName;
      queryCompanyInfo(companyName, element);
    }
  });
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

// Send company name to background script and display results
function queryCompanyInfo(companyName, element) {
  chrome.runtime.sendMessage(
    { action: 'checkCompany', companyName: companyName },
    response => {
      if (response && response.company) {
        displayCompanyInfo(response.company, element);
      }
    }
  );
}

// Display company information next to the company name
function displayCompanyInfo(company, element) {
  // Remove any existing info first
  const existingInfo = element.parentNode.querySelector('.agency-checker-info');
  if (existingInfo) {
    existingInfo.remove();
  }
  
  // Create and style the info element
  const infoElement = document.createElement('div');
  infoElement.className = 'agency-checker-info';
  infoElement.style.cssText = `
    margin-left: 10px;
    padding: 5px 10px;
    background-color: ${getRatingColor(company.rating)};
    color: white;
    border-radius: 5px;
    font-size: 12px;
    display: inline-block;
  `;
  
  // Add company details
  infoElement.innerHTML = `
    <strong>Rating:</strong> ${company.rating}/5
    <span class="agency-tooltip">ℹ️
      <div class="tooltip-content">
        <p><strong>${company.name}</strong></p>
        <p><strong>Rating:</strong> ${company.rating}/5</p>
        <p><strong>Comments:</strong> ${company.comments}</p>
      </div>
    </span>
  `;
  
  // Add tooltip styles
  const style = document.createElement('style');
  style.textContent = `
    .agency-tooltip { 
      position: relative;
      cursor: pointer;
      margin-left: 5px;
    }
    .tooltip-content {
      display: none;
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      padding: 10px;
      width: 250px;
      z-index: 1000;
      color: #333;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      border-radius: 4px;
      left: 20px;
      top: -10px;
    }
    .agency-tooltip:hover .tooltip-content {
      display: block;
    }
  `;
  document.head.appendChild(style);
  
  // Insert after the company name
  element.parentNode.insertBefore(infoElement, element.nextSibling);
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