"use client";

import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

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
  const [source, setSource] = useState<string>("");
  const [distances, setDistances] = useState<
    { destination: string; distance: string; status: string }[]
  >([]);
  const [locations, setLocations] = useState<{ lat: number; lng: number }[]>(
    []
  );

  const [addresses, setAddresses] = useState<string[]>([]); // Moved to state to avoid re-computation

  // Fetch data and generate addresses when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/proxy");
        if (!response.ok) throw new Error("Failed to fetch data");

        const result = await response.json();
        setData(result.records || []);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      const formattedAddresses = data
        .map((item) => {
          const address = item.fields?.Address || "";
          const address2 = item.fields?.Address_2nd_Line || "";
          const city = item.fields?.City || "";
          return `${address} ${address2}, ${city}`.trim();
        })
        .filter(Boolean);
      setAddresses(formattedAddresses);
    }
  }, [data]);

  const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSource(e.target.value);
  };

  const findDistances = async () => {
    if (!source || addresses.length === 0) {
      setError(
        "Please provide a source location and ensure there are destination addresses."
      );
      return;
    }

    try {
      const destinations = addresses.join("|");
      const response = await fetch(
        `/api/distances?source=${encodeURIComponent(
          source
        )}&destinations=${encodeURIComponent(destinations)}`
      );

      if (!response.ok)
        throw new Error("Error fetching data from the distance API");

      const data: DistanceMatrixResponse = await response.json();
      if (!data.rows || data.rows.length === 0)
        throw new Error("No distance data available.");

      const distancesArray = data.rows[0].elements.map((element, index) => ({
        destination: data.destination_addresses[index],
        distance: element.distance?.text || "N/A",
        status: element.status,
        value: element.distance?.value || Infinity,
      }));

      const sortedDistances = distancesArray
        .sort((a, b) => a.value - b.value)
        .slice(0, 4);
      setDistances(sortedDistances);

      const sourceCoords = await getCoordinates(source);
      const destinationCoords = await Promise.all(
        addresses.map((address) => getCoordinates(address))
      );

      setLocations([sourceCoords, ...destinationCoords]);
    } catch (err: any) {
      setError("Error fetching Distance Matrix data: " + err.message);
    }
  };

  const getCoordinates = async (address: string) => {
    try {
      const response = await fetch(
        `/api/maps?address=${encodeURIComponent(address)}`
      );
      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();
      if (data.results && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      } else {
        throw new Error("No coordinates found for address");
      }
    } catch (err) {
      console.error("Error getting coordinates for:", address, err);
      return { lat: 0, lng: 0 }; // Return a default location in case of error
    }
  };

  return (
    <div>
      <h1 className="text-lg">Dashboard</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

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

      {locations.length > 0 && (
        <LoadScript googleMapsApiKey="AIzaSyAyVpJDHH7EU0LnE9leoqYFMbjTdaQgHjs">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "400px" }}
            center={locations[0]} // Center the map on the source location
            zoom={10}
          >
            {locations.map((location, index) => (
              <Marker key={index} position={location} />
            ))}
          </GoogleMap>
        </LoadScript>
      )}
    </div>
  );
};

export default Dashboard;
