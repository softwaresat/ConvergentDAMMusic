const { db } = require("./firebaseAdmin");
const concerts = require("./concerts_with_ids.json");

// Function to convert date strings to timestamps
function parseDate(dateStr) {
  // Extract date and time components
  // Example format: "Tuesday, April 22nd - 1:00 PM"
  const dateRegex = /([a-zA-Z]+), ([a-zA-Z]+) (\d+)[a-z]* - (\d+):(\d+) ([AP]M)/;
  const match = dateStr.match(dateRegex);
  
  if (match) {
    const [, dayOfWeek, month, day, hour, minute, ampm] = match;
    // Get current year since it's not in the strings
    const year = new Date().getFullYear();
    
    // Convert to 24-hour format for parsing
    let hour24 = parseInt(hour);
    if (ampm === "PM" && hour24 !== 12) hour24 += 12;
    if (ampm === "AM" && hour24 === 12) hour24 = 0;
    
    // Create a date object
    const dateObj = new Date(year, getMonthNumber(month), parseInt(day), hour24, parseInt(minute));
    
    return {
      display: dateStr, // Keep original string for display
      timestamp: dateObj.getTime(), // Add timestamp for proper sorting
      iso: dateObj.toISOString() // ISO format for universal compatibility
    };
  }
  
  // Fallback if regex doesn't match
  return {
    display: dateStr,
    timestamp: Date.now(), // Current time as fallback
    iso: new Date().toISOString()
  };
}

// Helper function to convert month name to number
function getMonthNumber(monthName) {
  const months = {
    "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
    "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
  };
  return months[monthName] || 0;
}

async function updateConcertDates() {
  console.log(`Starting concert date updates for ${concerts.length} concerts...`);
  const batch = db.batch();
  
  try {
    for (const concert of concerts) {
      if (!concert.id || !concert.date) {
        console.log(`Skipping concert with missing id or date: ${concert.artistName}`);
        continue;
      }
      
      // Parse the date string into structured date objects
      const parsedDate = parseDate(concert.date);
      
      // Update the document with new date format while preserving original
      const docRef = db.collection("concerts").doc(concert.id);
      batch.update(docRef, {
        date: concert.date, // Keep original string
        dateTimestamp: parsedDate.timestamp, // Add timestamp for sorting
        dateISO: parsedDate.iso // Add ISO format
      });
      
      console.log(`Adding date fields for: ${concert.artistName} - ${parsedDate.iso}`);
    }

    // Commit the batch
    await batch.commit();
    console.log("All concert dates updated successfully!");
    
  } catch (error) {
    console.error("Error updating concert dates:", error);
  }
}

console.log("Starting concert date update process...");
updateConcertDates()
  .then(() => console.log("Concert date update complete"))
  .catch(err => {
    console.error("Failed to update concert dates:", err);
    process.exit(1);
  });