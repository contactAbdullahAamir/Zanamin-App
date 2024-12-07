'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

const Home = () => {
  const [leaflet, setLeaflet] = useState<any>(null);

  useEffect(() => {
    // Dynamically import Leaflet for client-side rendering
    import("leaflet").then((L) => {
      setLeaflet(L.default);
      
      // Fix missing marker icons
      delete (L.default.Icon.Default.prototype as unknown as { _getIconUrl: any })._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });

      // Initialize map
      const map = L.default.map("map").setView([40.7128, -74.006], 12);

      // Add OpenStreetMap tiles
      L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Add markers for multiple locations
      const locations = [
        { latitude: 40.7128, longitude: -74.006, label: "New York" },
        { latitude: 40.7306, longitude: -73.9352, label: "Brooklyn" },
        { latitude: 40.758, longitude: -73.9855, label: "Times Square" },
      ];

      locations.forEach(({ latitude, longitude, label }) => {
        L.default.marker([latitude, longitude])
          .addTo(map)
          .bindPopup(label);
      });
    });
  }, []);

  return (
    <div className="bg-light-background text-light-text dark:bg-dark-background dark:text-dark-text p-16 px-36">
      <div className="flex flex-col md:flex-row justify-center items-start md:space-x-8">
        {/* Map Section */}
        <div id="map" className="mb-8 md:mb-0 md:mr-8 w-full md:w-[400px] h-[350px]"></div>

        {/* Content Section */}
        <div className="flex flex-col items-start w-full md:w-1/2 p-12">
          <div className="mb-6 w-full">
            <label htmlFor="date-picker" className="block text-lg font-semibold mb-2">
              Pick a Date:
            </label>
            <input
              type="date"
              id="date-picker"
              className="p-2 border border-gray-300 rounded-md w-full"
            />
          </div>
          <div className="mb-6 w-full">
            <label htmlFor="address-search" className="block text-lg font-semibold mb-2">
              Address:
            </label>
            <input
              type="text"
              id="address-search"
              placeholder="Enter address"
              className="p-2 border border-gray-300 rounded-md w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Home), { ssr: false });
