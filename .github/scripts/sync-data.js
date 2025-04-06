const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin SDK with service account
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fetchAgenciesData() {
  const agenciesSnapshot = await db.collection('agencies').get();
  const agencies = [];
  
  for (const agencyDoc of agenciesSnapshot.docs) {
    const agency = agencyDoc.data();
    
    // Get top 5 comments by likes
    const commentsSnapshot = await agencyDoc.ref.collection('comments')
      .orderBy('likes', 'desc')
      .limit(5)
      .get();
    
    // Combine all comments into a single string, separated by " | "
    let commentsText = '';
    if (!commentsSnapshot.empty) {
      commentsText = commentsSnapshot.docs
        .map(doc => doc.data().text)
        .join(' | ');
    }
    
    agencies.push({
      name: agency.name,
      rating: agency.averageRating.toFixed(1),
      comments: commentsText
    });
  }
  
  return agencies;
}

function generateCSV(agencies) {
  // CSV header
  let csv = 'Agency Name,Agency Rating,Agency Comments\n';
  
  // Add each agency as a row
  agencies.forEach(agency => {
    // Escape quotes in text fields and wrap text in quotes to handle commas
    const escapedName = `"${agency.name.replace(/"/g, '""')}"`;
    const escapedComments = `"${agency.comments.replace(/"/g, '""')}"`;
    
    csv += `${escapedName},${agency.rating},${escapedComments}\n`;
  });
  
  return csv;
}

async function main() {
  try {
    console.log('Fetching agencies data from Firebase...');
    const agencies = await fetchAgenciesData();
    
    console.log(`Found ${agencies.length} agencies. Generating CSV...`);
    const csv = generateCSV(agencies);
    
    // Write to file
    fs.writeFileSync('agencies.csv', csv);
    console.log('CSV file updated successfully!');
  } catch (error) {
    console.error('Error syncing data:', error);
    process.exit(1);
  }
}

main();
