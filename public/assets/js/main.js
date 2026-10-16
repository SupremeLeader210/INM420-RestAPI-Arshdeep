const apiKey = "27acdfb9c33844fd9ce230218261510";
const apiUrl = "https://api.weatherapi.com/v1/forecast.json";

// each city: what to send the api, and the photo in assets/images
const cities = {
  "toronto": { query: "Toronto, Ontario, Canada", photo: "toronto.jpg" },
  "vancouver": { query: "Vancouver, British Columbia, Canada", photo: "vancouver.jpg" },
  "montreal": { query: "Montreal, Quebec, Canada", photo: "montreal.jpg" },
  "mansa": { query: "29.99,75.39", photo: "mansa.jpg" }
};

// page elements
const citySelect = document.querySelector("#city-select");
const cityRegion = document.querySelector("#city-region");
const unitC = document.querySelector("#unit-c");
const unitF = document.querySelector("#unit-f");
const statusBox = document.querySelector("#status");
const currentBox = document.querySelector("#current");
const bigIcon = document.querySelector("#big-icon");
const sunrise = document.querySelector("#sunrise");
const sunset = document.querySelector("#sunset");
const nowDate = document.querySelector("#now-date");
const nowTemp = document.querySelector("#now-temp");
const nowFeels = document.querySelector("#now-feels");
const nowSummary = document.querySelector("#now-summary");
const wind = document.querySelector("#wind");
const humidity = document.querySelector("#humidity");
const pressure = document.querySelector("#pressure");
const precip = document.querySelector("#precip");
const hourList = document.querySelector("#hour-list");
const dayList = document.querySelector("#day-list");

let unit = "c";
let weather = null;
let selectedDay = 0;

// ask the api for the weather
async function getWeather(query) {
  const url = `${apiUrl}?key=${apiKey}&q=${encodeURIComponent(query)}&days=3`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data;
}

// load the city selected
async function showCity() {
  const city = cities[citySelect.value];

  localStorage.setItem("skyline-city", citySelect.value);
  document.body.style.setProperty("--city-photo", `url("/assets/images/${city.photo}")`);
  currentBox.classList.add("is-loading");
  statusBox.hidden = true;

  try {
    weather = await getWeather(city.query);
    selectedDay = 0;
    render();
  } catch (error) {
    statusBox.textContent = `Couldn't load the weather: ${error.message}`;
    statusBox.classList.add("status-error");
    statusBox.hidden = false;
  }

  currentBox.classList.remove("is-loading");
}

// put all the weather on the page
function render() {
  renderCurrent();
  renderHours();
  renderDays();
  document.body.classList.toggle("is-night", weather.current.is_day === 0);
  document.body.dataset.sky = getSky(weather.current.condition.text);
}

// turn the description into one word the css uses to tint the photo
function getSky(text) {
  text = text.toLowerCase();

  if (text.includes("thunder")) {
    return "storm";
  } else if (text.includes("snow") || text.includes("sleet") || text.includes("ice")) {
    return "snow";
  } else if (text.includes("rain") || text.includes("drizzle")) {
    return "rain";
  } else if (text.includes("cloud") || text.includes("overcast") || text.includes("mist") || text.includes("fog")) {
    return "cloudy";
  }

  return "clear";
}

// the current weather and more details
function renderCurrent() {
  const now = weather.current;
  const today = weather.forecast.forecastday[0];

  cityRegion.textContent = weather.location.region || weather.location.country;
  bigIcon.src = "https:" + now.condition.icon.replace("64x64", "128x128");
  bigIcon.alt = now.condition.text;
  bigIcon.hidden = false;

  sunrise.textContent = today.astro.sunrise;
  sunset.textContent = today.astro.sunset;

  nowDate.textContent = formatDateTime(weather.location.localtime);
  nowTemp.textContent = formatTemp(now.temp_c, now.temp_f) + unit.toUpperCase();
  nowFeels.textContent = "Feels like " + formatTemp(now.feelslike_c, now.feelslike_f);
  nowSummary.textContent = `${today.day.condition.text}. ${today.day.daily_chance_of_rain}% chance of rain.`;

  if (unit === "c") {
    wind.textContent = `${Math.round(now.wind_kph)} km/h ${now.wind_dir}`;
    pressure.textContent = `${now.pressure_mb} hPa`;
  } else {
    wind.textContent = `${Math.round(now.wind_mph)} mph ${now.wind_dir}`;
    pressure.textContent = `${now.pressure_in} inHg`;
  }

  humidity.textContent = `${now.humidity}%`;
  precip.textContent = `${today.day.daily_chance_of_rain}%`;
}

// every third hour of the selected day
function renderHours() {
  const hours = weather.forecast.forecastday[selectedDay].hour;
  hourList.innerHTML = "";

  for (let i = 0; i < 24; i += 3) {
    const hour = hours[i];

    hourList.innerHTML += `
      <li class="hour">
        <img src="https:${hour.condition.icon}" alt="${hour.condition.text}">
        <span class="hour-temp">${formatTemp(hour.temp_c, hour.temp_f)}</span>
        <span class="hour-time">${i}:00</span>
      </li>
    `;
  }
}

// one button for each forecast day
function renderDays() {
  dayList.innerHTML = "";

  weather.forecast.forecastday.forEach(function (forecastDay, index) {
    const day = forecastDay.day;
    const item = document.createElement("li");

    item.innerHTML = `
      <button class="day-btn" type="button" aria-pressed="${index === selectedDay}">
        <span class="day-name">${index === 0 ? "Today" : formatDate(forecastDay.date, { weekday: "long" })}</span>
        <span class="day-date">${formatDate(forecastDay.date, { day: "numeric", month: "long" })}</span>
        <span class="day-range">
          min. <strong>${formatTemp(day.mintemp_c, day.mintemp_f)}</strong><br>
          max. <strong>${formatTemp(day.maxtemp_c, day.maxtemp_f)}</strong>
        </span>
        <img src="https:${day.condition.icon}" alt="">
        <span class="day-text">${day.condition.text}</span>
      </button>
    `;

    // clicking a day shows its hours
    item.querySelector("button").addEventListener("click", function () {
      selectedDay = index;
      renderHours();
      renderDays();
    });

    dayList.append(item);
  });
}

// 12.3 -> "+12°" in the chosen unit
function formatTemp(celsius, fahrenheit) {
  const value = Math.round(unit === "c" ? celsius : fahrenheit) || 0;
  return value > 0 ? `+${value}°` : `${value}°`;
}

// "2026-10-15" -> "Thursday" or "October 15", depending on the options
function formatDate(date, options) {
  return new Date(date + "T12:00").toLocaleDateString("en-US", options);
}

// "2026-10-15 15:05" -> "Thursday, October 15 at 3:05 PM"
function formatDateTime(localTime) {
  return new Date(localTime.replace(" ", "T")).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

// switch between celsius and fahrenheit
function setUnit(newUnit) {
  unit = newUnit;
  unitC.setAttribute("aria-pressed", unit === "c");
  unitF.setAttribute("aria-pressed", unit === "f");

  if (weather) {
    render();
  }
}

citySelect.addEventListener("change", showCity);

unitC.addEventListener("click", function () {
  setUnit("c");
});

unitF.addEventListener("click", function () {
  setUnit("f");
});

// start with the last city picked, or the first one in the list
const savedCity = localStorage.getItem("skyline-city");

if (cities[savedCity]) {
  citySelect.value = savedCity;
}

showCity();