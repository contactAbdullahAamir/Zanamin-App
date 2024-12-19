import { NextResponse } from 'next/server';
require('dotenv').config();


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(req) {
  try {
    // Extract query parameters from the request URL
    const urlParams = new URL(req.url);
    const source = urlParams.searchParams.get('source');
    const destinations = urlParams.searchParams.get('destinations');

    // Validate input
    if (!source || !destinations) {
      return NextResponse.json(
        { message: 'Source and destinations are required.' }, 
        { status: 400 }
      );
    }

    // Split destinations into an array (in case it was a single string)
    const destinationList = destinations.split('|');
    console.log('Destination List:', destinationList);  // Debugging

    // Load the API key from environment variables (more secure)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { message: 'API key is not set in environment variables.' }, 
        { status: 500 }
      );
    }

    // Prepare the response structure
    const mergedResults = {
      origin_addresses: [],
      destination_addresses: [],
      rows: [],
    };

    // Process the destinations in chunks of 10
    const CHUNK_SIZE = 10;

    for (let i = 0; i < destinationList.length; i += CHUNK_SIZE) {
      // Slice the destination array to get the current chunk
      const chunk = destinationList.slice(i, i + CHUNK_SIZE);
      const destinationsString = encodeURIComponent(chunk.join('|'));
      console.log(`Encoded Destinations String for chunk: ${destinationsString}`);  // Debugging

      // Build the API URL
      const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(source)}&destinations=${destinationsString}&key=${encodeURIComponent(apiKey)}`;

      
      try {
        // Delay to avoid hitting rate limits
        await delay(200); // 200 ms delay before each request

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status === 'OK') {
          // **Filter and Merge Results** with distance and status
          mergedResults.origin_addresses = [...new Set([...mergedResults.origin_addresses, ...data.origin_addresses])];
          mergedResults.destination_addresses = [...new Set([...mergedResults.destination_addresses, ...data.destination_addresses])];

          // Extract only distance and status for each destination
          const rows = data.rows.map(row => ({
            elements: row.elements.map(element => ({
              distance: element.distance,  // Keep only the distance info
              status: element.status       // Keep only the status info
            }))
          }));

          mergedResults.rows = mergedResults.rows.concat(rows);
        } else {
          console.error('Error in Google API response:', data);
        }
      } catch (error) {
        console.error('Error fetching data from Google API:', error.message, error.stack);
      }
    }

    // Return the filtered response (only distance and status)
    return NextResponse.json(mergedResults, { status: 200 });

  } catch (error) {
    console.error('Server Error:', error.message, error.stack);
    return NextResponse.json(
      { message: 'Server error', error: error.message }, 
      { status: 500 }
    );
  }
}
