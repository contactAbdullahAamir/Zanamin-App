"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, Polygon, InfoWindow } from "@react-google-maps/api";
import { useJsApiLoader } from "@react-google-maps/api";
import Image from "next/image";

interface DataItem {
  fields?: {
    Address?: string;
    Address_2nd_Line?: string;
    City?: string;
    Category?: "Minyanim" | "Restaurants" | "Businesses";
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

interface RegionOverlay {
  name: string;
  description: string;
  coordinates: { lat: number; lng: number }[];
}

const Home = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAyVpJDHH7EU0LnE9leoqYFMbjTdaQgHjs",
  });

  const [locations, setLocations] = useState<{ lat: number; lng: number; category: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all"); // Default to "all" to show all locations
  const [error, setError] = useState<string | null>(null);
  const [regionInfo, setRegionInfo] = useState<string | null>(null);
  
  // ** Custom Region Data (Eruv Areas) **
  const eruvRegions: RegionOverlay[] = [
    {
      name: "Downtown Eruv",
      description: "This Eruv covers the downtown area, ensuring community access.",
      coordinates: [
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7208, lng: -74.0060 },
        { lat: 40.7208, lng: -73.9960 },
        { lat: 40.7128, lng: -73.9960 },
      ],
    },
    {
      name: "Central Park Eruv",
      description: "Covers the Central Park region, providing a safe area for community access.",
      coordinates: [
        { lat: 40.7829, lng: -73.9654 },
        { lat: 40.7929, lng: -73.9654 },
        { lat: 40.7929, lng: -73.9554 },
        { lat: 40.7829, lng: -73.9554 },
      ],
    },
  ];

  // ** Fetch Location Data **
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/proxy");
        if (!response.ok) throw new Error("Failed to fetch data");

        const result = await response.json();
        const locationData = result.records.map((item: DataItem) => ({
          lat: item.fields?.Address ? parseFloat(item.fields.Address) : 0,
          lng: item.fields?.Address_2nd_Line ? parseFloat(item.fields.Address_2nd_Line) : 0,
          category: item.fields?.Category || "Business",
        }));

        setLocations(locationData);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  // ** Filter locations by category (all, minyanim, restaurants, businesses) **
  const filteredLocations = activeCategory === "all"
    ? locations
    : locations.filter(location => location.category === activeCategory);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  return (
    <div className="bg-light-background text-light-text dark:bg-dark-background dark:text-dark-text p-16 px-36">
      <div className="flex justify-center space-x-4 mb-4">
        <button onClick={() => handleCategoryChange('all')} className="px-4 py-2 bg-blue-500 text-white rounded-md">All</button>
        <button onClick={() => handleCategoryChange('Minyanim')} className="px-4 py-2 bg-blue-500 text-white rounded-md">Minyanim</button>
        <button onClick={() => handleCategoryChange('Restaurants')} className="px-4 py-2 bg-blue-500 text-white rounded-md">Restaurants</button>
        <button onClick={() => handleCategoryChange('Businesses')} className="px-4 py-2 bg-blue-500 text-white rounded-md">Businesses</button>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "500px" }}
        center={{ lat: 40.7128, lng: -74.0060 }}
        zoom={12}
      >
        {/* ** Region Overlays ** */}
        {eruvRegions.map((region, index) => (
          <Polygon
            key={index}
            paths={region.coordinates}
            options={{ 
              fillColor: "#008080", 
              fillOpacity: 0.4, 
              strokeColor: "#008080", 
              strokeOpacity: 1, 
              strokeWeight: 2 
            }}
            onMouseOver={() => setRegionInfo(region.description)}
            onMouseOut={() => setRegionInfo(null)}
          />
        ))}

        {/* ** Hover Tooltip for Region ** */}
        {regionInfo && (
          <InfoWindow position={{ lat: 40.7128, lng: -74.0060 }}>
            <div>{regionInfo}</div>
          </InfoWindow>
        )}

        {/* ** Category Markers ** */}
        {filteredLocations.map((location, index) => (
          <Marker 
            key={index} 
            position={{ lat: location.lat, lng: location.lng }} 
            icon={{
              url: location.category === "Minyanim" 
                ? '/icons/minyanim-icon.png' 
                : location.category === "Restaurants" 
                ? '/icons/restaurant-icon.png' 
                : '/icons/business-icon.png',
              scaledSize: new window.google.maps.Size(30, 30),
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Home), { ssr: false });
