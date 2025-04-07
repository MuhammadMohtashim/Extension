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

// In content.js, update the checkJobPage function

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
    
    // Try to find the job details container
    const jobDetailsContainer = document.querySelector('.jobs-search__job-details');
    
    if (jobDetailsContainer) {
      try {
        // Create a new observer - don't reuse old ones as they may be invalid
        const jobDetailsObserver = new MutationObserver(checkJobDetailsPanel);
        
        // Start observing with error handling
        jobDetailsObserver.observe(jobDetailsContainer, { childList: true, subtree: true });
        
        // Store the observer reference in a global variable to disconnect it later if needed
        window.currentJobObserver = jobDetailsObserver;
      } catch (error) {
        console.error("Error setting up job details observer:", error);
        
        // Use a fallback method - polling
        if (!window.jobDetailsPollInterval) {
          window.jobDetailsPollInterval = setInterval(checkJobDetailsPanel, 1000);
        }
      }
    } else {
      // If container not found, use polling method
      if (!window.jobDetailsPolling) {
        window.jobDetailsPolling = true;
        
        // Check for container every 500ms
        const containerCheckInterval = setInterval(() => {
          const container = document.querySelector('.jobs-search__job-details');
          if (container) {
            clearInterval(containerCheckInterval);
            checkJobPage(); // Retry with container found
          }
        }, 500);
        
        // Don't let it run forever
        setTimeout(() => clearInterval(containerCheckInterval), 10000);
      }
    }
    
    // Also check immediately when the function is called
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

// Add this to your global initialization code to clean up on page changes
window.addEventListener('beforeunload', () => {
  // Clean up any observers or intervals
  if (window.currentJobObserver) {
    window.currentJobObserver.disconnect();
  }
  if (window.jobDetailsPollInterval) {
    clearInterval(window.jobDetailsPollInterval);
  }
});

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




// Update this function in content.js
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
  
  // Handle comments that might be delimited with |
  let commentsHtml = '';
  if (company.comments) {
    if (company.comments.includes('|')) {
      // Split comments by the delimiter and create a list
      const commentsList = company.comments.split('|').map(comment => 
        `<li>${comment.trim()}</li>`
      ).join('');
      commentsHtml = `<strong>Top Comments:</strong><ul style="padding-left: 20px; margin-top: 5px;">${commentsList}</ul>`;
    } else {
      commentsHtml = `<strong>Agency Comments:</strong><p>${company.comments}</p>`;
    }
  } else {
    commentsHtml = '<p>No comments available</p>';
  }
  
  comments.innerHTML = commentsHtml;
  
  // Add "Contribute" button
  const contributeButton = document.createElement('button');
  contributeButton.textContent = 'Add Your Rating';
  contributeButton.style.cssText = `
    background-color: #0073b1;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 15px;
    margin-right: 10px;
  `;
  contributeButton.onclick = () => {
    // Open the Firebase web app with this agency pre-selected
    const encodedName = encodeURIComponent(company.name);
    chrome.runtime.sendMessage({ 
      action: 'openContributeTab', 
      url: `https://recruiter-search-c7515.firebaseapp.com?agency=${encodedName}` 
    });
    popup.remove();
  };
  
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
  `;
  closeButton.onclick = () => popup.remove();
  
  // Button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: flex-end;
  `;
  buttonContainer.appendChild(contributeButton);
  buttonContainer.appendChild(closeButton);
  
  // Assemble popup
  popup.appendChild(header);
  popup.appendChild(comments);
  popup.appendChild(buttonContainer);
  
  // Add popup to the page
  document.body.appendChild(popup);
  
  // Auto-dismiss after 15 seconds
  setTimeout(() => {
    if (document.body.contains(popup)) {
      popup.remove();
    }
  }, 15000);
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

// Add this to your main content.js initialization

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Extension error caught:', event.error);
  
  // If it's a context invalidation error, attempt recovery
  if (event.error && event.error.message && 
      event.error.message.includes('Extension context invalidated')) {
    
    // Clean up any existing observers/intervals
    cleanupExtensionResources();
    
    // Reinitialize after a short delay
    setTimeout(() => {
      console.log('Attempting to reinitialize extension...');
      initializeExtension();
    }, 1000);
  }
});

// Cleanup function
function cleanupExtensionResources() {
  if (window.currentJobObserver) {
    try {
      window.currentJobObserver.disconnect();
    } catch (e) {
      console.log('Error disconnecting observer:', e);
    }
    window.currentJobObserver = null;
  }
  
  if (window.jobDetailsPollInterval) {
    clearInterval(window.jobDetailsPollInterval);
    window.jobDetailsPollInterval = null;
  }
}

// Initialize function - wrap your main code in this
function initializeExtension() {
  // Your main initialization code here
  // This might include setting up event listeners, observers, etc.
  checkForCompanyNames();
}

// Start the extension
initializeExtension();