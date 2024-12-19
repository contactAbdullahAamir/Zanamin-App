"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useJsApiLoader } from "@react-google-maps/api";
import Image from "next/image";
require('dotenv').config();

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

const Home = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAyVpJDHH7EU0LnE9leoqYFMbjTdaQgHjs",
  })
  const [cityName, setCityName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [zmanimData, setZmanimData] = useState<any>(null);
  const [zanaminDate, setZanaminDate] = useState("");
  const [data, setData] = useState<DataItem[]>([]);
  const [source, setSource] = useState<string>("");
  const [distances, setDistances] = useState<
    { destination: string; distance: string; status: string }[]
  >([]);
  const [locations, setLocations] = useState<{ lat: number; lng: number }[]>(
    []
  );

  const [addresses, setAddresses] = useState<string[]>([]);

  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeTafilah, setActiveTafilah] = useState<string | null>(null);

  const [activePriceRange, setActivePriceRange] = useState<string[]>([]);
  const [activeCuisineType, setActiveCuisineType] = useState<string[]>([]);
  const [activeServiceOptions, setActiveServiceOptions] = useState<string[]>(
    []
  );
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [zmanimLoading, setZmanimLoading] = useState<boolean>(true);
  const [locationsLoading, setLocationsLoading] = useState<boolean>(true);
  const [mapLoading, setMapLoading] = useState<boolean>(true);

  let invisibleSpace = "\u200B";

  const renderMap = locations.length > 0;

  // Apply filters when relevant state changes
  useEffect(() => {
    if (isLoading) return;
    const applyFilters = () => {
      const filtered = restaurants.filter((restaurant) => {
        const priceMatch =
          activePriceRange.length === 0 ||
          activePriceRange.some(
            (range) =>
              restaurant.fields.Price_Point.includes(range) ||
              restaurant.fields.Price_Point_Option_2.includes(range)
          );

        const cuisineMatch =
          activeCuisineType.length === 0 ||
          activeCuisineType.includes(restaurant.fields.Dairy_Meat);

        const serviceMatch =
          activeServiceOptions.length === 0 ||
          activeServiceOptions.some((option) =>
            restaurant.fields.Type.includes(option)
          );

        return priceMatch && cuisineMatch && serviceMatch;
      });

      setFilteredRestaurants(filtered);
    };

    applyFilters();
  }, [
    activePriceRange,
    activeCuisineType,
    activeServiceOptions,
    restaurants,
    isLoading,
  ]);

  // Generate addresses from data
  

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
    const updateLocations = async () => {
      if (filteredRestaurants.length > 0) {
        const coords = await Promise.all(
          filteredRestaurants.map(async (restaurant) => {
            const address = `${restaurant.fields.Address} ${restaurant.fields.Address_2nd_Line}, ${restaurant.fields.City}`;
            return await getCoordinates(address);
          })
        );
        setLocations(coords);
        setLocationsLoading(false);
      }
    };

    updateLocations();
  }, [filteredRestaurants]);

  // Fetch restaurants data on mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/proxy`, { method: "GET" });
        const data = await response.json();

        if (data && Array.isArray(data.records)) {
          setRestaurants(data.records);
          setFilteredRestaurants(data.records);
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

  
  const restaurantsToDisplay = Array.isArray(filteredRestaurants)
    ? filteredRestaurants
    : [];

  // Helper function to convert time to HH:MM
  const formatTime = (isoTime: string): string => {
    if (!isoTime) return "";
    const timePart = isoTime.split("T")[1]; // Extract the time part
    return timePart.slice(0, 5); // Return only the HH:MM
  };

  // Step 2: Fetch Zmanim data using the geonameId
  const fetchZmanimData = async () => {
    try {
      const response = await fetch(
        `https://www.hebcal.com/zmanim?cfg=json&geonameid=5100280&date=${zanaminDate}`
      );
      const data = await response.json();
      setZmanimData(data);
      setZmanimLoading(false);
      setError(null);
    } catch (error) {
      setError("Error fetching Zmanim data.");
    }
  };

  // State for each type, category, filter, and tafilah
  type FilterOption =
    | "Adus Hamisrach"
    | "Ashkenaz"
    | "Chassidish"
    | "Bakeries"
    | "Catering"
    | "Markets";
  type resturant_pricerange = "Affordable" | "Mid-Range" | "Premium";
  type cuisine_type = "Milchig" | "Fleishig";
  type service_options = "Dine-in" | "Takeout";
  type CategoryType = "Retail" | "Food" | "Health" | "Service" | "Home";
  type TafilahType = "Shacharit" | "Mincha" | "Ma'ariv" | "Yom Tov";
  type TypeOption = "Minyam" | "Business" | "Restaurants";

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
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  // Toggle Service Options Filter
  const toggleServiceOptions = (option: string) => {
    setActiveServiceOptions((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSource(e.target.value);
  };

  const findDistances = async () => {
    fetchZmanimData();
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
      const topDestinations = sortedDistances.map(d => d.destination); 
      const destinationCoords = await Promise.all(
        topDestinations.map(address => getCoordinates(address))
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
        setMapLoading(false);
        return { lat, lng };
      } else {
        throw new Error("No coordinates found for address");
      }
    } catch (err) {
      console.error("Error getting coordinates for:", address, err);
      setMapLoading(false);
      return { lat: 0, lng: 0 }; // Return a default location in case of error
    }
  };
  interface MapComponentProps {
    locations: { lat: number; lng: number }[]; 
  }

  if (isLoading || mapLoading ) {
    return (
      <div className="flex justify-center items-center min-h-screen flex-col">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-t-transparent border-blue-600" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-4 text-xl text-gray-600">Data is loading, please wait...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-light-background text-light-text dark:bg-dark-background dark:text-dark-text p-16 px-36">
      <div className="flex flex-col md:flex-row justify-center items-start md:space-x-8">
        {/* Map Section */}
        <div>
          {locations.length > 0 ? (
            <div className="rounded-md overflow-hidden">
              <GoogleMap
                mapContainerStyle={{ width: "480px", height: "400px" }}
                center={locations[0]}
                zoom={10}
              >
                {locations.map((location, index) => (
                  <Marker key={index} position={location} />
                ))}
              </GoogleMap>
            </div>
          ) : (
            <div
              style={{
                width: "480px",
                height: "400px",
                display: "flex",
                backgroundColor: "#f0f0f0",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                fontSize: "18px",
              }}
              className="rounded-md"
            ></div>
          )}
        </div>

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
              placeholder="Enter your source location"
              value={source}
              onChange={handleSourceChange}
              className="p-2 border border-gray-300 rounded-md w-full"
            />
           <div className="flex items-center space-x-4">
  <button
    onClick={findDistances}
    className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4"
  >
    Search
  </button>
  <span className="mt-4 text-gray-700">Click search to see Zmanim Times</span>
</div>
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
                    <label className="block text-sm font-semibold mb-1">
                      Price Range:
                    </label>
                    {["$", "$$", "$$$"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => togglePriceRange(filter)}
                        className={`px-4 py-1 rounded-md text-sm mr-2 ${
                          activePriceRange.includes(filter)
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
                    <label className="block text-sm font-semibold mb-1">
                      Cuisine Type:
                    </label>
                    {["Dairy", "Meat"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => toggleCuisineType(filter)}
                        className={`px-4 py-2 rounded-md text-sm mr-2 ${
                          activeCuisineType.includes(filter)
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
                    <label className="block text-sm font-semibold mb-1">
                      Service Options:
                    </label>
                    {["Dine in", "Takeout"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => toggleServiceOptions(filter)}
                        className={`px-4 py-2 rounded-md text-sm mr-2 ${
                          activeServiceOptions.includes(filter)
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
            
            {distances.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-lg w-80 h-60 overflow-y-auto ml-auto">
                <ul className="space-y-4">
                  {distances.map((distance, index) => (
                    <li
                      key={index}
                      className="bg-gray-50 p-4 rounded-lg shadow-sm"
                    >
                      <div className="text-sm text-gray-600">
                        <strong className="font-medium text-gray-900">
                          Destination:
                        </strong>{" "}
                        {distance.destination}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong className="font-medium text-gray-900">
                          Distance:
                        </strong>{" "}
                        {distance.distance}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      
      <div>
        <div>
          <span className="text-[#53aae3] font-medium mb-4">DAILY ZMANIM</span>
          <h1 className="text-2xl font-semibold mb-1">
            {new Date(zanaminDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h1>
          <b className="text-2xl font-semibold mb-1">י׳ חשון תשפ״ה</b>
        </div>
      </div>
      <div className="flex justify-evenly items-center space-x-12 pt-6">
        <div className="flex-1">
          <div className="space-y-8">
            <div className="items-center">
              <Image
                src="SVG/s_DAWN.svg"
                width={300}
                height={300}
                className="zman-svg"
                alt="Dawn"
              />
              <h3 className="text-2xl">
                {zmanimData ? formatTime(zmanimData.times.dawn) : "00:00"}
              </h3>
            </div>
            <div className="item-center">
              <Image
                src="SVG/s_TALISTEFILIN.svg"
                width={300}
                height={300}
                className="zman-svg"
                alt="Talis"
              />
              <h3 className="text-2xl">
                {zmanimData
                  ? formatTime(zmanimData.times.misheyakirMachmir)
                  : "00:00"}
              </h3>
            </div>
            <div className="item-center">
              <Image
                src="SVG/s_SUNRISE.svg"
                width={300}
                height={300}
                className="zman-svg"
                alt="Sunrise"
              />
              <h3 className="text-2xl">
                {zmanimData ? formatTime(zmanimData.times.sunrise) : "00:00"}
              </h3>
            </div>
            <div className="item-center">
              <Image
                src="SVG/s_SHEMA MGA.svg"
                width={300}
                height={300}
                className="zman-svg"
                alt="Shema"
              />
              <h3 className="text-2xl">
                {zmanimData
                  ? formatTime(zmanimData.times.sofZmanShmaMGA)
                  : "00:00"}
              </h3>
            </div>
            <div className="item-center">
              <Image
                src="SVG/s_SHEMA GRA.svg"
                width={300}
                height={300}
                className="zman-svg"
                alt="Shema G"
              />
              <h3 className="text-2xl">
                {zmanimData
                  ? formatTime(zmanimData.times.sofZmanShma)
                  : "00:00"}
              </h3>
            </div>
            <div className="item-center">
              <Image
                src="SVG/s_SHACRIS GRA.svg"
                width={300}
                height={300}
                className="zman-svg"
                alt="Shacris"
              />
              <h3 className="text-2xl">
                {zmanimData
                  ? formatTime(zmanimData.times.sofZmanTfilla)
                  : "00:00"}
              </h3>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="space-y-8">
            <div className="item-center">
              <Image
                src="SVG/s_MIDDAY.svg"
                width={300}
                height={300}
                className="zman-svg"
                alt="Midday"
              />
              <h3 className="text-2xl">
                {zmanimData ? formatTime(zmanimData.times.chatzot) : "00:00"}
              </h3>
            </div>
            <div className="item-center">
              <Image
                src="SVG/s_EARLY MINCHA.svg"
                width={300}
                height={300}
                className="zman-svg"
                alt="Early Mincha"
              />
              <h3 className="text-2xl">
                {zmanimData
                  ? formatTime(zmanimData.times.minchaGedola)
                  : "00:00"}
              </h3>
            </div>
            <div className="item-center">
              <Image
                src="SVG/s_PLAG HAMINCHA.svg"
                width={250}
                height={250}
                className="zman-svg"
                alt="Plag Mincha"
              />
              <h3 className="text-2xl">
                {zmanimData
                  ? formatTime(zmanimData.times.plagHaMincha)
                  : "00:00"}
              </h3>
            </div>
            <div className="item-center">
              <Image
                src="SVG/s_SUNSET.svg"
                width={300}
                height={300}
                className="zman-svg"
                alt="Sunset"
              />
              <h3 className="text-2xl">
                {zmanimData ? formatTime(zmanimData.times.sunset) : "00:00"}
              </h3>
            </div>
            <div className="item-center">
              <Image
                src="SVG/s_NIGHT 3 STARS.svg"
                width={300}
                height={300}
                className="zman-svg"
                alt="Night 3 Stars"
              />
              <h3 className="text-2xl">
                {zmanimData ? formatTime(zmanimData.times.tzeit85deg) : "00:00"}
              </h3>
            </div>
            <div className="item-center">
              <Image
                src="SVG/s_NIGHT 72.svg"
                width={300}
                height={300}
                className="zman-svg"
                alt="Night 7"
              />
              <h3 className="text-2xl">
                {zmanimData ? formatTime(zmanimData.times.tzeit72min) : "00:00"}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Home), { ssr: false });
