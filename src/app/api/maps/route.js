import { NextResponse } from 'next/server';
require('dotenv').config();

// Utility function to delay requests to avoid hitting Google API rate limits
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(req) {
  try {
    // Extract query parameters from the request URL
    const urlParams = new URL(req.url);
    const address = urlParams.searchParams.get('address');


    
    // Validate input
    if (!address) {
      return NextResponse.json(
        { message: 'Address is required.' }, 
        { status: 400 }
      );
    }



    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    console.log(apiKey)

    if (!apiKey) {
      return NextResponse.json(
        { message: 'API key is not set in environment variables.' }, 
        { status: 500 }
      );
    }

    // Build the Google Geocode API URL
    const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(apiKey)}`;
    
    try {
      // Delay to avoid hitting rate limits (if required)
      await delay(200); // 200 ms delay before each request

      // Call the Google API
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === 'OK') {
        // Return the successful response from Google API
        return NextResponse.json(data, { status: 200 });
      } else {
        console.error('Error in Google API response:', data);
        return NextResponse.json(
          { message: 'Error in Google API response.', error: data }, 
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error fetching data from Google API:', error.message, error.stack);
      return NextResponse.json(
        { message: 'Error fetching data from Google API.', error: error.message }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Server Error:', error.message, error.stack);
    return NextResponse.json(
      { message: 'Server error', error: error.message }, 
      { status: 500 }
    );
  }
}
