
import { Weather } from '../types';

function getWeatherDescription(code: number): string {
  const descriptions: { [key: number]: string } = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return descriptions[code] || "Unknown weather condition";
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<Weather> {
  try {
    const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    const geoData = await geoResponse.json();
    const locationName = `${geoData.city}, ${geoData.countryName}`;

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
    );
    const weatherData = await weatherResponse.json();

    if (!weatherData.current) {
      throw new Error("Could not fetch current weather data.");
    }
    
    const current = weatherData.current;
    
    return {
      location: locationName,
      temperature: Math.round(current.temperature_2m),
      description: getWeatherDescription(current.weather_code),
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
    };
  } catch (error) {
    console.error("Weather API error:", error);
    throw new Error("Failed to fetch weather data. Please try again.");
  }
}
