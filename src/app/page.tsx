"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";

const Home = () => {
  const [leaflet, setLeaflet] = useState<any>(null);

  const [cityName, setCityName] = useState("");
  const [geonameId, setGeonameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zmanimData, setZmanimData] = useState<any>(null); // To store Zmanim API response
  const [zanaminDate, setZanaminDate] = useState("");
  let invisibleSpace = "\u200B";

  // Helper function to convert time to HH:MM
  const formatTime = (isoTime: string): string => {
    if (!isoTime) return "";
    const timePart = isoTime.split("T")[1]; // Extract the time part
    return timePart.slice(0, 5); // Return only the HH:MM
  };

  // Step 1: Get the geonameId for the city
  const handleSearch = async () => {
    try {
      const response = await fetch("/api/getGeonameId", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setError("Error fetching geoname ID.");
    }
  };

  // Step 2: Fetch Zmanim data using the geonameId
  const fetchZmanimData = async (geoId: string) => {
    try {
      const response = await fetch(
        `https://www.hebcal.com/zmanim?cfg=json&geonameid=5100280&date=${zanaminDate}`
      );
      const data = await response.json();
      setZmanimData(data);
      setError(null);
    } catch (error) {
      setError("Error fetching Zmanim data.");
    }
  };

  useEffect(() => {
    // Dynamically import Leaflet for client-side rendering
    import("leaflet").then((L) => {
      setLeaflet(L.default);

      // Fix missing marker icons
      delete (
        L.default.Icon.Default.prototype as unknown as { _getIconUrl: any }
      )._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });

      // Initialize the map
      const map = L.default.map("map").setView([40.7128, -74.006], 12);

      // Add OpenStreetMap tiles
      L.default
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        })
        .addTo(map);

      // Add markers for multiple locations
      const locations = [
        { latitude: 40.7128, longitude: -74.006, label: "New York" },
        { latitude: 40.7306, longitude: -73.9352, label: "Brooklyn" },
        { latitude: 40.758, longitude: -73.9855, label: "Times Square" },
      ];

      locations.forEach(({ latitude, longitude, label }) => {
        L.default.marker([latitude, longitude]).addTo(map).bindPopup(label);
      });
    });
  }, []);

  // State for each type, category, filter, and tafilah
  type FilterOption =
    | "Adus Hamisrach"
    | "Ashkenaz"
    | "Chassidish"
    | "Bakeries"
    | "Catering"
    | "Markets";
  type CategoryType = "Retail" | "Food" | "Health" | "Service" | "Home";
  type TafilahType = "Shacharit" | "Mincha" | "Ma'ariv" | "Yom Tov";
  type TypeOption = "Minyam" | "Business" | "Restaurants";
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeTafilah, setActiveTafilah] = useState<string | null>(null);

  // Toggle function for Type
  const toggleType = (type: string) => {
    setActiveType(type); // Set the selected type
    setActiveCategory(null); // Reset the category when type is changed
    setActiveFilter(null); // Reset filters when type is changed
    setActiveTafilah(null); // Reset tafilah when type is changed
  };

  // Toggle function for Category (only for Business type)
  const toggleCategory = (category: string) => {
    setActiveCategory(category);
  };
  // Toggle function for Filter (for Minyam or Business types)
  const toggleFilter = (filter: string) => {
    setActiveFilter(filter);
  };

  // Toggle function for Tafilah (only for Minyam type)
  const toggleTafilah = (tafilah: string) => {
    setActiveTafilah(tafilah);
  };
  return (
    <div className="bg-light-background text-light-text dark:bg-dark-background dark:text-dark-text p-16 px-36">
      <div className="flex flex-col md:flex-row justify-center items-start md:space-x-8">
        {/* Map Section */}
        <div
          id="map"
          className="mb-8 md:mb-0 md:mr-8 w-full md:w-[400px] h-[350px]"
        ></div>

        {/* Content Section */}
        <div className="flex flex-col items-start w-full md:w-1/2 p-12">
          <div className="mb-6 w-full">
            <label
              htmlFor="date-picker"
              className="block text-lg font-semibold mb-2"
            >
              Pick a Date:
            </label>
            <input
              type="date"
              value={zanaminDate}
              onChange={(e) => setZanaminDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-md w-full"
            />
          </div>
          <div className="mb-6 w-full">
            <label
              htmlFor="address-search"
              className="block text-lg font-semibold mb-2"
            >
              Address:
            </label>
            <input
              type="text"
              placeholder="Enter city name"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              className="p-2 border border-gray-300 rounded-md w-full"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4"
            >
              Search
            </button>
            {error && <p className="mt-4 text-red-500">Error: {error}</p>}
          </div>
          <div>
            {/* Type Column */}
            <div className="mt-4">
              <label className="block text-lg font-semibold mb-2">Type:</label>
              {["Minyam", "Business", "Restaurants"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => toggleType(filter as TypeOption)}
                  className={`px-4 py-2 rounded-md text-sm mr-2 ${
                    activeType === filter
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Conditionally render Category, Filters, and Tafilah based on Type selection */}
            {activeType && (
              <>
                {/* Filters Column for Minyam */}
                {activeType === "Minyam" && (
                  <div className="mt-4">
                    <label className="block text-lg font-semibold mb-2">
                      Filters:
                    </label>
                    {["Adus Hamisrach", "Ashkenaz", "Chassidish"].map(
                      (filter) => (
                        <button
                          key={filter}
                          onClick={() => toggleFilter(filter as FilterOption)}
                          className={`px-4 py-2 rounded-md text-sm mr-2 ${
                            activeFilter === filter
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200"
                          }`}
                        >
                          {filter}
                        </button>
                      )
                    )}
                  </div>
                )}

                {/* Tafilah Column for Minyam */}
                {activeType === "Minyam" && (
                  <div className="mt-4">
                    <label className="block text-lg font-semibold mb-2">
                      Tafilah:
                    </label>
                    {["Shacharit", "Mincha", "Ma'ariv", "Yom Tov"].map(
                      (filter) => (
                        <button
                          key={filter}
                          onClick={() => toggleTafilah(filter as TafilahType)}
                          className={`px-4 py-2 rounded-md text-sm mr-2 ${
                            activeTafilah === filter
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200"
                          }`}
                        >
                          {filter}
                        </button>
                      )
                    )}
                  </div>
                )}

                {/* Category Column for Business */}
                {activeType === "Business" && (
                  <div className="mt-4">
                    <label className="block text-lg font-semibold mb-2">
                      Category:
                    </label>
                    {["Retail", "Food", "Health", "Service", "Home"].map(
                      (filter) => (
                        <button
                          key={filter}
                          onClick={() => toggleCategory(filter as CategoryType)}
                          className={`px-4 py-2 rounded-md text-sm mr-2 ${
                            activeCategory === filter
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200"
                          }`}
                        >
                          {filter}
                        </button>
                      )
                    )}
                  </div>
                )}

                {/* Filters Column for Business */}
                {activeType === "Business" && (
                  <div className="mt-4">
                    <label className="block text-lg font-semibold mb-2">
                      Filters:
                    </label>
                    {["Bakeries", "Catering", "Markets"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => toggleFilter(filter as FilterOption)}
                        className={`px-4 py-2 rounded-md text-sm mr-2 ${
                          activeFilter === filter
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {zmanimData && (
        <div className="mt-8">
          <h3 className="text-[#4188b8] font-medium mb-4">DAILY ZANAMIN</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Morning Times */}
            <div>
              <h4 className="text-xl font-semibold mb-4">
                {new Date(zanaminDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h4>
              <ul>
                <li>
                  <strong className="text-[#4188b8] font-medium uppercase ">
                    DAWN:
                  </strong>{" "}
                  <br /> {formatTime(zmanimData.times.dawn)}
                </li>
                <li>
                  <strong className="text-[#4188b8] font-medium uppercase  ">
                    Tallis & Tefilin:
                  </strong>{" "}
                  <br />
                  {formatTime(zmanimData.times.misheyakirMachmir)}
                </li>
                <li>
                  <strong className="text-[#4188b8] font-medium uppercase  ">
                    Sunrise:
                  </strong>{" "}
                  <br />
                  {formatTime(zmanimData.times.sunrise)}
                </li>
                <li>
                  <strong className="text-[#4188b8] font-medium uppercase  ">
                    Shema (Magen Avraham):
                  </strong>{" "}
                  <br />
                  {formatTime(zmanimData.times.sofZmanShmaMGA)}
                </li>
                <li>
                  <strong className="text-[#4188b8] font-medium uppercase  ">
                    Shema (GRA & Baal Hatanya):
                  </strong>{" "}
                  <br />
                  {formatTime(zmanimData.times.sofZmanShma)}
                </li>
                <li>
                  <strong className="text-[#4188b8] font-medium uppercase  ">
                    Shacharis (GRA & Baal Hatanya):
                  </strong>{" "}
                  <br />
                  {formatTime(zmanimData.times.sofZmanTfilla)}
                </li>
              </ul>
            </div>

            {/* Afternoon & Evening Times */}
            <div>
              <h4 className="text-xl font-semibold mb-4">
                {invisibleSpace}
                <span className="sr-only">Hidden Text</span>
              </h4>
              <ul>
                <li>
                  <strong className="text-[#4188b8] font-medium uppercase">
                    Midday:
                  </strong>{" "}
                  <br />
                  {formatTime(zmanimData.times.chatzot)}
                </li>
                <li>
                  <strong className="text-[#4188b8] font-medium uppercase  ">
                    Earliest Mincha:
                  </strong>{" "}
                  <br />
                  {formatTime(zmanimData.times.minchaGedola)}
                </li>
                <li>
                  <strong className="text-[#4188b8] font-medium uppercase  ">
                    Plag Hamincha:
                  </strong>{" "}
                  <br />
                  {formatTime(zmanimData.times.plagHaMincha)}
                </li>
                <li>
                  <strong className="text-[#4188b8] font-medium uppercase  ">
                    Sunset:
                  </strong>{" "}
                  <br />
                  {formatTime(zmanimData.times.sunset)}
                </li>
                <li>
                  <strong className="text-[#4188b8] font-medium uppercase  ">
                    Nightfall (3 Stars):
                  </strong>{" "}
                  <br />
                  {formatTime(zmanimData.times.tzeit85deg)}
                </li>
                <li>
                  <strong className="text-[#4188b8] font-medium uppercase  ">
                    Nightfall (72 minutes):
                  </strong>{" "}
                  <br />
                  {formatTime(zmanimData.times.tzeit72min)}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default dynamic(() => Promise.resolve(Home), { ssr: false });
