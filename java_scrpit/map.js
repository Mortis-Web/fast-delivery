const searchInput = document.getElementById("search-input");
const locationBtn = document.getElementById("location-btn");
const searchBtn = document.getElementById("final-search-btn");
const mapModal = document.getElementById("mapModal");
const mapContent = document.querySelector(".map-content");
const closeMapBtn = document.getElementById("closeMapModal");
const confirmLocationBtn = document.getElementById("confirmLocationBtn");

let map;
let selectedLocation = null;

// Egypt bounds (Prevents leaving Egypt on map)
const egyptBounds = [
  [21.7, 24.7],
  [31.7, 37.3],
];

// ✅ Open Map Modal
locationBtn.addEventListener("click", () => {
  mapModal.style.display = "flex";
  if (!map) initLeafletMap();

  setTimeout(() => {
    map.invalidateSize();
    map.fitBounds(egyptBounds);
  }, 200);
});

// ✅ Close Map Modal
closeMapBtn.addEventListener("click", () => {
  mapModal.style.display = "none";
});

// ✅ Initialize Map
function initLeafletMap() {
  map = L.map("map", {
    minZoom: 6,
    maxZoom: 19,
    maxBounds: egyptBounds,
    maxBoundsViscosity: 1,
  }).setView([26.8, 30.8], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // Center Pin Indicator
  const centerIndicator = document.createElement("div");
  centerIndicator.id = "map-center-indicator";
  centerIndicator.innerHTML = `
    <div class="pin"></div>
    <span id="deliverToText">حرّك الخريطة لتحديد الموقع...</span>
  `;
  mapContent.appendChild(centerIndicator);

  // ✅ When user stops dragging the map
  map.on("moveend", getLocationFromMap);
}

// ✅ Reverse Geocode from Center of Map
async function getLocationFromMap() {
  const { lat, lng } = map.getCenter();
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar&zoom=18`
    );
    const data = await res.json();
    const address = data.address;

    // Check for Egypt only
    if (!address || address.country_code !== "eg") {
      document.getElementById("deliverToText").textContent = "❌ خارج مصر";
      selectedLocation = null;
      return;
    }

    const placeName =
      address.road ||
      address.neighbourhood ||
      address.suburb ||
      address.village ||
      address.city_district ||
      address.city ||
      address.town;

    const stateName = address.state || address.county;

    if (!stateName) {
      document.getElementById("deliverToText").textContent =
        "⚠️ موقع غير معروف";
      selectedLocation = null;
      return;
    }

    let finalName = stateName;
    if (placeName && placeName !== stateName)
      finalName = `${stateName}, ${placeName}`;

    selectedLocation = { lat, lng, name: finalName };
    searchInput.value = finalName;
    mapSearchInput.value = finalName;
    document.getElementById(
      "deliverToText"
    ).textContent = `📍 التوصيل إلى: ${finalName}`;
  } catch {
    document.getElementById("deliverToText").textContent =
      "⚠️ خطأ في تحديد الموقع";
  }
}

// ✅ Confirm Location Button
confirmLocationBtn.addEventListener("click", () => {
  if (!selectedLocation) {
    Swal.fire("⚠️", "من فضلك حرك الخريطة لاختيار موقع صالح", "warning");
    return;
  }
  mapModal.style.display = "none";
  searchInput.value = selectedLocation.name;
  localStorage.setItem("selectedLocation", JSON.stringify(selectedLocation));

  console.log("✅ Selected & Saved:", selectedLocation);
});

// ✅ Search Function
function performSearch() {
  // ✅ If user typed manually & didn't select from map:
  if (!selectedLocation && searchInput.value.trim() !== "") {
    selectedLocation = {
      name: searchInput.value.trim(),
      lat: null,
      lng: null,
    };
    localStorage.setItem("selectedLocation", JSON.stringify(selectedLocation));
    console.log("🔹 Manually entered location saved:", selectedLocation);
  }

  if (selectedLocation) {
    console.log("Searching near:", selectedLocation);
  } else {
    Swal.fire("⚠️", "من فضلك اختر موقعك أولًا", "warning");
  }
}

searchBtn.addEventListener("click", performSearch);
searchInput.addEventListener(
  "keydown",
  (e) => e.key === "Enter" && performSearch()
);
searchInput.addEventListener("focus", () => {
  if (searchInput.value.trim() !== "") {
    showSuggestions(searchInput.value);
  }
});

// ✅ Autocomplete Suggestions
// === ✅ Autocomplete Suggestions ===
const suggestionsBox = document.createElement("ul");
suggestionsBox.id = "suggestionsBox";
suggestionsBox.style.cssText = `
  position: absolute;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  z-index: 9999;
  max-height: 180px;          /* 👈 show only 4 items */
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
  display: none;
`;
searchInput.parentElement.style.position = "relative";
searchInput.parentElement.appendChild(suggestionsBox);

// ✅ Function to fetch & show suggestions
async function showSuggestions(query) {
  if (!query.trim()) {
    suggestionsBox.style.display = "none";
    return;
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&countrycodes=eg&format=json&addressdetails=1&limit=10&accept-language=ar`
  );
  const places = await res.json();

  suggestionsBox.innerHTML = "";

  if (places.length === 0) {
    suggestionsBox.innerHTML = `<li class="no-result" style="padding:8px;color:#777">❌ لا توجد نتائج</li>`;
    suggestionsBox.style.display = "block";
    return;
  }

  places.slice(0, 10).forEach((place) => {
    const li = document.createElement("li");
    li.textContent = place.display_name;
    li.style.cssText =
      "padding:8px;cursor:pointer;border-bottom:1px solid #eee";

    li.addEventListener("click", (e) => {
      e.stopPropagation();
      searchInput.value = place.display_name;
      selectedLocation = {
        lat: place.lat,
        lng: place.lon,
        name: place.display_name,
      };

      // ✅ If map not initialized → initialize it automatically
      if (!map) {
        initLeafletMap();
      }

      // ✅ Set the view safely
      map.setView([place.lat, place.lon], 14);

      // ✅ Save to LocalStorage
      localStorage.setItem(
        "selectedLocation",
        JSON.stringify(selectedLocation)
      );

      suggestionsBox.style.display = "none";
    });

    suggestionsBox.appendChild(li);
  });

  suggestionsBox.style.display = "block";
}

// ✅ Typing triggers suggestions
searchInput.addEventListener("input", () => showSuggestions(searchInput.value));

// ✅ Pressing ENTER or SPACE also triggers suggestions
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault(); // prevent space from inserting if you want
    showSuggestions(searchInput.value);
  }
});

// ✅ Click outside → hide box
document.addEventListener("click", (e) => {
  if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
    suggestionsBox.style.display = "none";
  }
});

const currentLocationBtn = document.getElementById("goToCurrentLocation");

currentLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    Swal.fire("⚠️", "المتصفح لا يدعم تحديد الموقع", "error");
    return;
  }

  currentLocationBtn.textContent = "⏳ جاري تحديد موقعك...";

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;

      // ✅ Move map to user's location
      map.setView([latitude, longitude], 15);

      // ✅ Reverse geocode to get name
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar&zoom=18`
        );
        const data = await res.json();
        const address = data.address;

        if (!address || address.country_code !== "eg") {
          document.getElementById("deliverToText").textContent = "❌ خارج مصر";
          selectedLocation = null;
          return;
        }

        const placeName =
          address.road ||
          address.neighbourhood ||
          address.suburb ||
          address.village ||
          address.city ||
          address.town;

        const stateName = address.state || address.county;
        let finalName = stateName;
        if (placeName && placeName !== stateName)
          finalName = `${stateName}, ${placeName}`;

        selectedLocation = { lat: latitude, lng: longitude, name: finalName };
        searchInput.value = finalName;
        mapSearchInput.value = finalName;
        document.getElementById(
          "deliverToText"
        ).textContent = `📍 التوصيل إلى: ${finalName}`;
        localStorage.setItem(
          "selectedLocation",
          JSON.stringify(selectedLocation)
        );
      } catch {
        Swal.fire("⚠️", "حدث خطأ أثناء تحديد الموقع", "error");
      }

      currentLocationBtn.textContent = "📍 موقعي الحالي";
    },

    () => {
      Swal.fire("⚠️", "لم نتمكن من تحديد موقعك، تأكد من تفعيل GPS", "warning");
      currentLocationBtn.textContent = "📍 موقعي الحالي";
    }
  );
});

window.addEventListener("load", () => {
  const savedLocation = localStorage.getItem("selectedLocation");
  if (savedLocation) {
    selectedLocation = JSON.parse(savedLocation);
    searchInput.value = selectedLocation.name; // ✅ يظهر في خانة البحث تلقائياً
    console.log("📍 Restored from LocalStorage:", selectedLocation);
  }
});
// === ✅ Map Modal Search (Same behavior as main search) ===
const mapSearchInput = document.getElementById("map-search-input");
const mapSearchBtn = document.getElementById("map-search-btn");

// Suggestions box for map search
const mapSuggestionBox = document.createElement("ul");
mapSuggestionBox.className = "mapSuggestionBox";
mapSuggestionBox.style.cssText = `
  position: absolute;
  left: 10px;
  right: 10px;
  background: white;
  border: 1px solid #ccc;
  z-index: 99999;
  max-height: 180px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
  display: none;
`;
document.querySelector(".map-title").appendChild(mapSuggestionBox);

// Fetch & show suggestions inside modal
async function showMapSuggestions(query) {
  if (!query.trim()) {
    mapSuggestionBox.style.display = "none";
    return;
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&countrycodes=eg&format=json&addressdetails=1&limit=10&accept-language=ar`
  );
  const places = await res.json();

  mapSuggestionBox.innerHTML = "";

  if (places.length === 0) {
    mapSuggestionBox.innerHTML = `<li style="padding:8px;color:#777">❌ لا توجد نتائج</li>`;
    mapSuggestionBox.style.display = "block";
    return;
  }

  places.forEach((place) => {
    const li = document.createElement("li");
    li.textContent = place.display_name.replace(/, Egypt|, مصر/gi, ""); // ✅ Remove Egypt
    li.style.cssText =
      "padding:8px;cursor:pointer;border-bottom:1px solid #eee";

    li.addEventListener("click", () => {
      const lat = place.lat;
      const lon = place.lon;
      const name = li.textContent; // name WITHOUT ", Egypt"

      // ✅ Move map to clicked location
      map.setView([lat, lon], 15);

      // ✅ Save location
      selectedLocation = { name, lat, lng: lon };

      // ✅ Update BOTH input fields
      searchInput.value = name; // main search bar
      mapSearchInput.value = name; // modal search bar

      // ✅ Save in LocalStorage
      localStorage.setItem(
        "selectedLocation",
        JSON.stringify(selectedLocation)
      );

      // ✅ Hide suggestions
      mapSuggestionBox.style.display = "none";

      // ✅ Update pin message text
      document.getElementById(
        "deliverToText"
      ).textContent = `📍 التوصيل إلى: ${name}`;
    });

    mapSuggestionBox.appendChild(li);
  });

  mapSuggestionBox.style.display = "block";
}

// Event listeners
mapSearchInput.addEventListener("input", () =>
  showMapSuggestions(mapSearchInput.value)
);
mapSearchBtn.addEventListener("click", () =>
  showMapSuggestions(mapSearchInput.value)
);

// Hide box if clicked outside
document.addEventListener("click", (e) => {
  if (
    !mapSearchInput.contains(e.target) &&
    !mapSuggestionBox.contains(e.target)
  ) {
    mapSuggestionBox.style.display = "none";
  }
});

// ✅ Show suggestions when input is focused
mapSearchInput.addEventListener("focus", () => {
  if (mapSearchInput.value.trim() !== "") {
    showMapSuggestions(mapSearchInput.value);
  }
});

// ✅ Show suggestions on pressing Enter
mapSearchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    showMapSuggestions(mapSearchInput.value);
  }
});
