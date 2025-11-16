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
    city: data.name,
    condition: data.weather[0].description,
    mainWeather: data.weather[0].main,

    // Temperature
    temp: data.main.temp,
    feels_like: data.main.feels_like,
    temp_min: data.main.temp_min,
    temp_max: data.main.temp_max,

    // Atmospheric
    pressure: data.main.pressure,
    humidity: data.main.humidity,
    visibility: data.visibility,

    // Clouds
    clouds: data.clouds?.all,

    // Wind
    wind_speed: data.wind?.speed,
    wind_deg: data.wind?.deg,

    // Sun times (converted to local readable format)
    sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString("ja-JP"),
    sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString("ja-JP"),
  };
}
