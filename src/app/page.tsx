'use client'; // Ensure this is a client-side component
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix missing marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: any })._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Home = () => {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensures the code runs only on the client
  }, []);

  useEffect(() => {
    if (!isClient) return; // Guard for SSR
    const map = L.map("map").setView([40.7128, -74.006], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const allLocations = [
      { latitude: 40.7128, longitude: -74.006, label: "New York", type: "Business", category: "Retail" },
      { latitude: 40.7306, longitude: -73.9352, label: "Brooklyn", type: "Retail", category: "Food" },
      { latitude: 40.758, longitude: -73.9855, label: "Times Square", type: "Restaurants", category: "Food" },
      { latitude: 40.7309, longitude: -73.9977, label: "Soho", type: "Business", category: "Health" },
      { latitude: 40.749, longitude: -73.9877, label: "Madison Square", type: "Restaurants", category: "Service" }
    ];

    const filteredLocations = allLocations.filter(location => {
      return (
        (activeType ? location.type === activeType : true) &&
        (activeCategory ? location.category === activeCategory : true) &&
        (activeFilter ? location.label.includes(activeFilter) : true)
      );
    });

    filteredLocations.forEach(({ latitude, longitude, label }) => {
      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(label);
    });

    return () => {
      map.remove();
    };
  }, [isClient, activeType, activeCategory, activeFilter]);

  const toggleType = (filter: string) => setActiveType(prev => (prev === filter ? null : filter));
  const toggleCategory = (filter: string) => setActiveCategory(prev => (prev === filter ? null : filter));
  const toggleFilter = (filter: string) => setActiveFilter(prev => (prev === filter ? null : filter));

  if (!isClient) return null; // Prevent rendering on the server

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

          {/* Type Column */}
          <div className="mt-4">
            <label className="block text-lg font-semibold mb-2">Type:</label>
            {['Minyam', 'Business', 'Restaurants'].map((filter) => (
              <button
                key={filter}
                onClick={() => toggleType(filter)}
                className={`px-4 py-2 rounded-md text-sm mr-2 ${
                  activeType === filter ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Category Column */}
          <div className="mt-4">
            <label className="block text-lg font-semibold mb-2">Category:</label>
            {['Retail', 'Food', 'Health', 'Service', 'Home'].map((filter) => (
              <button
                key={filter}
                onClick={() => toggleCategory(filter)}
                className={`px-4 py-2 rounded-md text-sm mr-2 ${
                  activeCategory === filter ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Filters Column */}
          <div className="mt-4">
            <label className="block text-lg font-semibold mb-2">Filters:</label>
            {['Bakeries', 'Catering', 'Markets'].map((filter) => (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`px-4 py-2 rounded-md text-sm mr-2 ${
                  activeFilter === filter ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Home), { ssr: false });
