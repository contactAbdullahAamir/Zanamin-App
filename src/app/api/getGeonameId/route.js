import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    // Parse request body to get the city name
    const { cityName } = await request.json();

    // Full path to the file in the 'public' folder
    const filePath = path.join(process.cwd(), 'public', 'cities1000.txt');

    // Read the file contents
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const lines = fileData.split('\n'); // Split file into lines

    // Loop through each line to search for the city
    let geonameId = null;
    for (let line of lines) {
      const columns = line.split('\t'); // Assuming the file is tab-separated
      const city = columns[1]; // Assuming the 2nd column is the city name
      const id = columns[0]; // Assuming the 1st column is the geoname ID

      if (city && city.toLowerCase() === cityName.toLowerCase()) {
        geonameId = id;
        break;
      }
    }

    if (geonameId) {
      return NextResponse.json({ success: true, geonameId });
    } else {
      return NextResponse.json({ success: false, message: 'City not found' });
    }

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error reading file', error });
  }
}
