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

  useEffect(() => {
      const fetchRestaurants = async () => {
        setIsLoading(true); // Start loading
        try {
          const response = await fetch(
            `/api/proxy`,
            { method: 'GET' }
          );
          const data = await response.json();
          
          // Check if the data contains a `records` field and it's an array
          if (data && Array.isArray(data.records)) {
            setRestaurants(data.records); // Set the records array to state
            setFilteredRestaurants(data.records); // Set the records as the initial filtered list
          } else {
            console.error("Fetched data is not in the expected format:", data);
          }
        } catch (error) {
          console.error("Error fetching restaurants:", error);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchRestaurants();
    }, []);
  

  // State for each type, category, filter, and tafilah
  type FilterOption =
    | "Adus Hamisrach"
    | "Ashkenaz"
    | "Chassidish"
    | "Bakeries"
    | "Catering"
    | "Markets";
  type resturant_pricerange="Affordable" | "Mid-Range" | "Premium";
  type cuisine_type="Milchig" | "Fleishig";
  type service_options="Dine-in" | "Takeout";
  type CategoryType = "Retail" | "Food" | "Health" | "Service" | "Home";
  type TafilahType = "Shacharit" | "Mincha" | "Ma'ariv" | "Yom Tov";
  type TypeOption = "Minyam" | "Business" | "Restaurants";
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeTafilah, setActiveTafilah] = useState<string | null>(null);

   const [activePriceRange, setActivePriceRange] = useState<string[]>([]);
    const [activeCuisineType, setActiveCuisineType] = useState<string[]>([]);
    const [activeServiceOptions, setActiveServiceOptions] = useState<string[]>([]);
    const [restaurants, setRestaurants] = useState<any[]>([]); // Ensure this is an array
    const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
  

  // Toggle function for Type
  const toggleType = (type: string) => {
    setActiveType(type);
    setActiveCategory(null); 
    setActiveFilter(null);
    setActiveTafilah(null);
    
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

  // Toggle function for PriceRange (only for restaurants)
  const togglePriceRange = (range: string) => {
    setActivePriceRange((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range]
    );
  };

  // Toggle Cuisine Type Filter
  const toggleCuisineType = (cuisine: string) => {
    setActiveCuisineType((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  // Toggle Service Options Filter
  const toggleServiceOptions = (option: string) => {
    setActiveServiceOptions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };


   useEffect(() => {
      const applyFilters = () => {
        if (isLoading) return; // Don't filter while data is loading
        const filtered = restaurants.filter((restaurant) => {
          
          // **1. Price Range Filter**: Match `Price_Point` or `Price_Point_Option_2`
          const priceMatch = activePriceRange.length === 0 
            || activePriceRange.some((range) => 
              restaurant.fields.Price_Point.includes(range) || 
              restaurant.fields.Price_Point_Option_2.includes(range)
            );
  
          // **2. Cuisine Type Filter**: Match `Dairy_Meat`
          const cuisineMatch = activeCuisineType.length === 0 
            || activeCuisineType.includes(restaurant.fields.Dairy_Meat);
  
  
            
          // **3. Service Options Filter**: Check if `Type` array includes the selected options
          const serviceMatch = activeServiceOptions.length === 0 
            || activeServiceOptions.some((option) => 
              restaurant.fields.Type.includes(option)
            );
  
          // Return true if the restaurant matches all active filters
          return priceMatch && cuisineMatch && serviceMatch;
        });
  
        setFilteredRestaurants(filtered);
      };
  
      applyFilters();
    }, [activePriceRange, activeCuisineType, activeServiceOptions, restaurants, isLoading]);
  
    // Render a loading state while waiting for data to be fetched
    if (isLoading) {
      return <div>Loading restaurants...</div>;
    }

  const restaurantsToDisplay = Array.isArray(filteredRestaurants) ? filteredRestaurants : [];


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


                {activeType === "Restaurants" && (
                  <div className="mt-4">
                  <label className="block text-lg font-semibold mb-2">Price Range:</label>
                  {["$", "$$", "$$$"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => togglePriceRange(filter)}
                      className={`px-4 py-2 rounded-md text-sm mr-2 ${activePriceRange.includes(filter) ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
          
                )}


                 {activeType === "Restaurants" && (
                   <div className="mt-4">
                   <label className="block text-lg font-semibold mb-2">Cuisine Type:</label>
                   {["Dairy", "Meat"].map((filter) => (
                     <button
                       key={filter}
                       onClick={() => toggleCuisineType(filter)}
                       className={`px-4 py-2 rounded-md text-sm mr-2 ${activeCuisineType.includes(filter) ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                     >
                       {filter}
                     </button>
                   ))}
                 </div>
                )}


              {activeType === "Restaurants" && (
                  <div className="mt-4">
                  <label className="block text-lg font-semibold mb-2">Service Options:</label>
                  {["Dine in", "Takeout"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => toggleServiceOptions(filter)}
                      className={`px-4 py-2 rounded-md text-sm mr-2 ${activeServiceOptions.includes(filter) ? "bg-blue-500 text-white" : "bg-gray-200"}`}
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

     

      {/* Display Filtered Restaurants */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Filtered Restaurants</h2>
        {restaurantsToDisplay.length === 0 ? (
          <p>No restaurants match your filters.</p>
        ) : (
          restaurantsToDisplay.map((restaurant) => (
            <div key={restaurant.id} className="p-4 border-b">
              <h3 className="text-xl font-semibold">{restaurant.fields.Name}</h3>
              <p>{restaurant.fields.Address}</p>
              <p><strong>Price:</strong> {restaurant.fields.Price_Point}</p>
              <p><strong>Cuisine:</strong> {restaurant.fields.Dairy_Meat}</p>
              <p><strong>Services:</strong> {restaurant.fields.Type[1]}</p>
            </div>
          ))
        )}
        
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
