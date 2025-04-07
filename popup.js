document.addEventListener('DOMContentLoaded', function() {
  // Load company data from storage
  chrome.storage.local.get('companyData', function(data) {
    if (data.companyData && data.companyData.length > 0) {
      const agencies = data.companyData;
      document.getElementById('totalAgencies').textContent = agencies.length;
      
      // Show last updated time
      const now = new Date();
      document.getElementById('lastUpdated').textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
      
      // Set up search functionality
      const searchInput = document.getElementById('searchInput');
      searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const results = agencies.filter(agency => 
          agency.name.toLowerCase().includes(searchTerm)
        );
        displayResults(results.slice(0, 10)); // Show top 10 results
      });
      
      // Show top rated agencies by default
      const topRated = [...agencies]
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        .slice(0, 5);
      displayResults(topRated);
    } else {
      document.getElementById('results').innerHTML = '<p>No agency data available. Please refresh.</p>';
    }
  });
  
  // Refresh data button
  const refreshButton = document.createElement('button');
  refreshButton.textContent = 'Refresh Data';
  refreshButton.className = 'action-button';
  refreshButton.addEventListener('click', function() {
    this.textContent = 'Refreshing...';
    this.disabled = true;
    
    chrome.runtime.sendMessage({ action: 'refreshData' }, function(response) {
      if (response && response.success) {
        window.location.reload();
      } else {
        refreshButton.textContent = 'Refresh Failed';
        setTimeout(() => {
          refreshButton.textContent = 'Refresh Data';
          refreshButton.disabled = false;
        }, 2000);
      }
    });
  });
  
  // Collaborate button - directs to the Firebase web app
  const collaborateButton = document.createElement('button');
  collaborateButton.textContent = 'Contribute Ratings';
  collaborateButton.className = 'action-button primary';
  collaborateButton.addEventListener('click', function() {
    // Replace with your actual Firebase web app URL
    chrome.tabs.create({ url: 'https://recruiter-search-c7515.firebaseapp.com/' });
  });
  
  // Add buttons to the UI
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';
  buttonContainer.appendChild(refreshButton);
  buttonContainer.appendChild(collaborateButton);
  
  // Add button container after the search box or another appropriate location
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.after(buttonContainer);
  } else {
    document.body.appendChild(buttonContainer);
  }
});
  
// Display search results or default list
function displayResults(agencies) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';
  
  if (agencies.length === 0) {
    resultsDiv.innerHTML = '<p>No matching agencies found.</p>';
    return;
  }
  
  agencies.forEach(agency => {
    const agencyDiv = document.createElement('div');
    agencyDiv.className = 'agency-item';
    
    const ratingSpan = document.createElement('span');
    ratingSpan.className = 'rating';
    ratingSpan.textContent = agency.rating + '/5';
    ratingSpan.style.backgroundColor = getRatingColor(agency.rating);
    
    agencyDiv.textContent = agency.name + ' ';
    agencyDiv.appendChild(ratingSpan);
    
    // Make the whole div clickable to show more details
    agencyDiv.style.cursor = 'pointer';
    agencyDiv.addEventListener('click', function() {
      showAgencyDetails(agency);
    });
    
    resultsDiv.appendChild(agencyDiv);
  });
}

// Show detailed agency info
function showAgencyDetails(agency) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';
  
  const detailsDiv = document.createElement('div');
  detailsDiv.className = 'agency-details';
  
  const commentsList = agency.comments ? agency.comments.split('|').map(comment => 
    `<li>${comment.trim()}</li>`
  ).join('') : '';
  
  detailsDiv.innerHTML = `
    <h3>${agency.name}</h3>
    <div class="rating-badge" style="background-color: ${getRatingColor(agency.rating)}">
      ${agency.rating}/5
    </div>
    <div class="comments-section">
      <h4>Top Comments:</h4>
      ${commentsList ? `<ul>${commentsList}</ul>` : '<p>No comments available</p>'}
    </div>
    <div class="action-row">
      <button id="backButton" class="action-button">Back to List</button>
      <button id="contributeButton" class="action-button primary">Add Your Rating</button>
    </div>
  `;
  
  resultsDiv.appendChild(detailsDiv);
  
  // Back button handler
  document.getElementById('backButton').addEventListener('click', function() {
    // Go back to the default view
    chrome.storage.local.get('companyData', function(data) {
      if (data.companyData) {
        const topRated = [...data.companyData]
          .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
          .slice(0, 5);
        displayResults(topRated);
      }
    });
  });
  
  // Contribute button handler - open Firebase app with pre-selected agency
  document.getElementById('contributeButton').addEventListener('click', function() {
    // Open Firebase web app with the agency name as a parameter
    const encodedName = encodeURIComponent(agency.name);
    chrome.tabs.create({ 
      url: `https://recruiter-search-c7515.firebaseapp.com?agency=${encodedName}` 
    });
  });
}

// Get color based on rating (same as in content.js)
function getRatingColor(rating) {
  const numRating = parseFloat(rating);
  if (numRating >= 4) return '#28a745';
  if (numRating >= 3) return '#ffc107';
  return '#dc3545';
}