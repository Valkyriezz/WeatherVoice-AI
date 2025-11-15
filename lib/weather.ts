export async function getWeather(lat: number, lon: number) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) throw new Error("WEATHER_API_KEY missing");

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=ja&appid=${apiKey}`
  );

  if (!res.ok) {
    throw new Error("Weather API failed");
  }

  const data = await res.json();

  return {
    temp: data.main.temp,
    condition: data.weather[0].description,
    city: data.name,
  };
}
