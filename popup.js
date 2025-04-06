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
    refreshButton.style.marginTop = '10px';
    refreshButton.addEventListener('click', function() {
      chrome.runtime.sendMessage({ action: 'refreshData' }, function() {
        window.location.reload();
      });
    });
    document.body.appendChild(refreshButton);
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
      ratingSpan.style.color = getRatingColor(agency.rating);
      
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
    detailsDiv.innerHTML = `
      <h3>${agency.name}</h3>
      <p><strong>Rating:</strong> ${agency.rating}/5</p>
      <p><strong>Comments:</strong> ${agency.comments}</p>
      <button id="backButton">Back to List</button>
    `;
    
    resultsDiv.appendChild(detailsDiv);
    
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
  }
  
  // Get color based on rating (same as in content.js)
  function getRatingColor(rating) {
    const numRating = parseFloat(rating);
    if (numRating >= 4) return '#28a745';
    if (numRating >= 3) return '#ffc107';
    return '#dc3545';
  }


 // Add this to your extension's popup.html or relevant UI file

 const collaborateButton = document.createElement('button');
 collaborateButton.textContent = 'Collaborate on Ratings';
 collaborateButton.addEventListener('click', () => {
   chrome.tabs.create({ url: 'https://your-firebase-project-id.web.app' });
 });
 
 document.getElementById('your-button-container').appendChild(collaborateButton);