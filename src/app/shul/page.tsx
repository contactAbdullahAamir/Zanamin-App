'use client';

import React, { useEffect, useState } from 'react';

interface DataItem {
  fields?: {
    Address?: string;
    Address_2nd_Line?: string;
    City?: string;
  };
}

interface DistanceMatrixResponse {
  origin_addresses: string[];
  destination_addresses: string[];
  rows: Array<{
    elements: Array<{
      distance: { value: number; text: string };
      duration: { value: number };
      status: string;
    }>;
  }>;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DataItem[]>([]); 
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');  
  const [distances, setDistances] = useState<{ destination: string; distance: string; status: string }[]>([]);  // State to store distances

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/proxy');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result.records || []);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  const addresses = Array.isArray(data)
    ? data.map((item) => {
        const address = item.fields?.Address || '';
        const address2 = item.fields?.Address_2nd_Line || '';
        const city = item.fields?.City || '';
        return `${address} ${address2}, ${city}`.trim();
      }).filter(Boolean)
    : [];

  const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSource(e.target.value); 
  };

  const findDistances = async () => {
    if (!source || addresses.length === 0) {
      setError('Please provide a source location and ensure there are destination addresses.');
      return;
    }

    try {
      const destinations = addresses.join('|'); // Use pipe '|' to separate destinations for the API request
      console.log('Source:', source);
      console.log('Destinations:', destinations);

      const response = await fetch(`/api/distances?source=${encodeURIComponent(source)}&destinations=${encodeURIComponent(destinations)}`, {
        method: 'GET', // Ensure GET method
      });

      if (!response.ok) {
        throw new Error('Error fetching data from the distance API');
      }

      const data: DistanceMatrixResponse = await response.json();
      console.log('API Response:', data); // Log the response

      if (data.rows && data.rows.length > 0) {
        const distancesArray = data.rows[0].elements;

        // Check if distances array is valid and contains elements
        if (!distancesArray || distancesArray.length === 0) {
          setError('No distances found in the response.');
          return;
        }

        // Create an array with distance, status, and destination
        const distancesOnly = distancesArray
          .map((current, index) => {
            const distanceValue = current.distance?.text;
            const status = current.status;
            const destination = data.destination_addresses[index];

            // Ensure we only return valid distance values
            if (distanceValue && status) {
              return { destination, distance: distanceValue, status, value: current.distance?.value }; // Add the numeric value for sorting
            }
            return null; // Return null if no valid distance found
          })
          .filter((item) => item !== null) as { destination: string; distance: string; status: string; value: number }[]; // Filter out null items

        // Sort distances by the numeric value
        const sortedDistances = distancesOnly.sort((a, b) => a.value - b.value);

        // Get the top 4 nearest destinations
        const top4Distances = sortedDistances.slice(0, 4);

        console.log('Top 4 Distances:', top4Distances); // Log the top 4 nearest distances

        // Set the distances to the state
        setDistances(top4Distances);
      } else {
        setError('Error calculating distances. No rows found.');
      }
    } catch (err: any) {
      setError('Error fetching Distance Matrix data: ' + err.message);
      console.error('Error fetching Distance Matrix data:', err); // Log the error
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <input
        type="text"
        placeholder="Enter your source location"
        value={source}
        onChange={handleSourceChange}
      />
      <button onClick={findDistances}>Find Distances</button>

      {distances.length > 0 && (
        <div>
          <h2>Top 4 Nearest Distances from Source</h2>
          <ul>
            {distances.map((distance, index) => (
              <li key={index}>
                <strong>Destination:</strong> {distance.destination} <br />
                <strong>Distance:</strong> {distance.distance} <br />
                <strong>Status:</strong> {distance.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2>Addresses</h2>
      {addresses.length > 0 ? (
        <ul>
          {addresses.map((address, index) => (
            <li key={index}>{address}</li>
          ))}
        </ul>
      ) : (
        <p>No addresses found</p>
      )}
    </div>
  );
};

export default Dashboard;
