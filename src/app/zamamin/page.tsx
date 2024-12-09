'use client';

import React, { useState, useEffect } from 'react';

const ZmanimPage = () => {
  const [cityName, setCityName] = useState('');
  const [geonameId, setGeonameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zmanimData, setZmanimData] = useState<any>(null); // To store Zmanim API response

  // Helper function to convert time to HH:MM
  const formatTime = (isoTime: string): string => {
    if (!isoTime) return '';
    const timePart = isoTime.split('T')[1]; // Extract the time part
    return timePart.slice(0, 5); // Return only the HH:MM
  };
  

  // Step 1: Get the geonameId for the city
  const handleSearch = async () => {
    try {
      const response = await fetch('/api/getGeonameId', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName }),
      });

      const data = await response.json();
      if (data.success) {
        setGeonameId(data.geonameId);
        setError(null);
        fetchZmanimData(data.geonameId); // Fetch Zmanim data after successful geonameId retrieval
      } else {
        setGeonameId(null);
        setError(data.message);
      }
    } catch (error) {
      setError('Error fetching geoname ID.');
    }
  };

  // Step 2: Fetch Zmanim data using the geonameId
  const fetchZmanimData = async (geoId: string) => {
    try {
      const response = await fetch(
        `https://www.hebcal.com/zmanim?cfg=json&geonameid=${geoId}&date=2024-11-11`
      );
      const data = await response.json();
      setZmanimData(data);
      setError(null);
    } catch (error) {
      setError('Error fetching Zmanim data.');
    }
  };

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text">
      <main className="container mx-auto px-6 py-8">
        <h2 className="text-4xl font-bold">Daily Zmanim</h2>

        <div className="mt-8">
          <input
            type="text"
            placeholder="Enter city name"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            className="border border-gray-300 p-2 rounded-md w-full md:w-1/2"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4"
          >
            Search
          </button>
        </div>

        {error && <p className="mt-4 text-red-500">Error: {error}</p>}

        {zmanimData && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4">Zmanim for {cityName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Morning Times */}
              <div>
                <h4 className="text-xl font-semibold mb-4">Morning Times</h4>
                <ul>
                  <li><strong>Dawn:</strong> {formatTime(zmanimData.times.dawn)}</li>
                  <li><strong>Tallis & Tefilin:</strong> {formatTime(zmanimData.times.misheyakirMachmir)}</li>
                  <li><strong>Sunrise:</strong> {formatTime(zmanimData.times.sunrise)}</li>
                  <li><strong>Shema (Magen Avraham):</strong> {formatTime(zmanimData.times.sofZmanShmaMGA)}</li>
                  <li><strong>Shema (GRA & Baal Hatanya):</strong> {formatTime(zmanimData.times.sofZmanShma)}</li>
                  <li><strong>Shacharis (GRA & Baal Hatanya):</strong> {formatTime(zmanimData.times.sofZmanTfilla)}</li>
                </ul>
              </div>

              {/* Afternoon & Evening Times */}
              <div>
                <h4 className="text-xl font-semibold mb-4">Afternoon & Evening Times</h4>
                <ul>
                  <li><strong>Midday:</strong> {formatTime(zmanimData.times.chatzot)}</li>
                  <li><strong>Earliest Mincha:</strong> {formatTime(zmanimData.times.minchaGedola)}</li>
                  <li><strong>Plag Hamincha:</strong> {formatTime(zmanimData.times.plagHaMincha)}</li>
                  <li><strong>Sunset:</strong> {formatTime(zmanimData.times.sunset)}</li>
                  <li><strong>Nightfall (3 Stars):</strong> {formatTime(zmanimData.times.tzeit)}</li>
                  <li><strong>Nightfall (72 minutes):</strong> {formatTime(zmanimData.times.tzeit72min)}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ZmanimPage;
