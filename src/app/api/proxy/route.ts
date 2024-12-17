import { NextResponse } from 'next/server';

export async function GET() {
  const API_URL = 'https://lakewoodluach.getgrist.com/api/docs/mfG1uWuVC9zwM1kapuvW1U/tables/Resturants/records';
  const API_KEY = '75556160058f1b29607ff9421a798f89039dbc42'; // Replace with your actual API key

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}