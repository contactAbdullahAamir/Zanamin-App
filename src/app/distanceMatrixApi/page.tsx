'use client';
import { useState, useEffect } from 'react';

// Define the structure of a restaurant object
interface Restaurant {
  Name: string;
  Address: string;
  City: string;
  // Add other fields as necessary
}

const DistanceMatrixApi = () => {
  // Type the restaurants state as an array of Restaurant
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        setLoading(true);
        setError(null);

        // Fetch the data from the API
        const response = await fetch('/api/proxy');
        if (!response.ok) {
          throw new Error('Failed to fetch restaurant data');
        }
        const restaurantData = await response.json(); 

        setRestaurants(restaurantData);  
      } catch (error) {
        setError('Error fetching restaurant data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurants();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Restaurants</h1>
      <ul>
        {restaurants.map((restaurant, index) => (
          <li key={index}>{restaurant.Name}</li>
        ))}
      </ul>
    </div>
  );
};

export default DistanceMatrixApi;
