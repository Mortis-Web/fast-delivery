const locationBtn = document.getElementById("location-btn");
const mapModal = document.getElementById("mapModal");
const searchBtn = document.getElementById("final-search-btn");
const mapContent = document.getElementById("map-figure");
const closeMapBtn = document.getElementById("closeMapModal");
const confirmLocationBtn = document.getElementById("confirmLocationBtn");
const searchInput = document.getElementById("search-input");
const currentLocationBtn = document.getElementById("goToCurrentLocation");

let map;
let selectedLocation = null;

const egyptBounds = [
  [21.7, 24.7],
  [31.7, 37.3],
];

// =======================
// ✅ Restore saved location on reload
// =======================
window.addEventListener("load", () => {
  const saved = localStorage.getItem("selectedLocation");
  if (saved) {
    selectedLocation = JSON.parse(saved);
    if (searchInput) searchInput.value = selectedLocation.name;
    console.log("📍 Restored location:", selectedLocation);
  }
});

if (locationBtn) locationBtn.addEventListener("click", openMapModal);

// =======================
// ✅ Close Map
// =======================
function closeMap() {
  mapModal.classList.remove("is-visible");
  document.body.style.overflow = "";
}
closeMapBtn.addEventListener("click", closeMap);
mapModal.addEventListener("click", (e) => {
  if (!mapContent.contains(e.target)) closeMap();
});

// =======================
// ✅ Init Leaflet Map
// =======================
// Cairo coords and preferred default zoom (change zoom to 10/11/12 as you like)
const CAIRO_COORDS = [30.0444, 31.2357];
const CAIRO_DEFAULT_ZOOM = 9; // <- less zoomed; use 10 for wider, 13 for tighter

function initLeafletMap() {
  // create map centered on Cairo (so it's exactly on Cairo even before opening)
  map = L.map("map", {
    minZoom: 6,
    maxZoom: 19,
    maxBounds: egyptBounds,
    maxBoundsViscosity: 1,
  }).setView(CAIRO_COORDS, CAIRO_DEFAULT_ZOOM);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // ensure we don't append the center indicator multiple times
  const existing = document.getElementById("map-center-indicator");
  if (existing) existing.remove();

  const centerIndicator = document.createElement("div");
  centerIndicator.id = "map-center-indicator";
  centerIndicator.innerHTML = `
    <div class="pin"></div>
    <span id="deliverToText">حرّك الخريطة لتحديد الموقع...</span>`;
  mapContent.appendChild(centerIndicator);

  map.on("moveend", getLocationFromMap);
}

function openMapModal() {
  mapModal.classList.add("is-visible");
  document.body.style.overflow = "hidden";

  if (!map) initLeafletMap();

  setTimeout(() => {
    map.invalidateSize();

    if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
      // user had a saved selection → focus it (keep a tighter zoom)
      map.setView([selectedLocation.lat, selectedLocation.lng], 10);
    } else {
      // No saved selection → center exactly on Cairo with less zoom
      map.setView(CAIRO_COORDS, CAIRO_DEFAULT_ZOOM);
    }
  }, 200);
}

// =======================
// ✅ Get location from map center
// =======================
async function getLocationFromMap() {
  const { lat, lng } = map.getCenter();
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar&zoom=18`
    );
    const data = await res.json();
    const address = data.address;

    if (!address || address.country_code !== "eg") {
      document.getElementById("deliverToText").textContent = "❌ خارج مصر";
      selectedLocation = null;
      return;
    }

    const state = address.state || address.county;
    const place =
      address.road ||
      address.suburb ||
      address.city ||
      address.village ||
      address.town;

    const name = place ? `${state}, ${place}` : state;
    selectedLocation = { lat, lng, name };

    document.getElementById(
      "deliverToText"
    ).textContent = `📍 التوصيل إلى: ${name}`;
  } catch {
    document.getElementById("deliverToText").textContent =
      "⚠️ خطأ في تحديد الموقع";
  }
}

// =======================
// ✅ Save location & apply to input
// =======================
confirmLocationBtn.addEventListener("click", () => {
  if (!selectedLocation) {
    Swal.fire("⚠️", "من فضلك اختر موقع من الخريطة", "warning");
    return;
  }

  // ✅ Save to localStorage
  localStorage.setItem("selectedLocation", JSON.stringify(selectedLocation));

  // ✅ Update input
  if (searchInput) searchInput.value = selectedLocation.name;

  // ✅ Close modal
  closeMap();

  // ✅ NEW → Navigate to shops page
  window.location.href = "selectedLocationShops.html";
});

// =======================
// ✅ Go to GPS location button
// =======================
currentLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    map.setView([latitude, longitude], 15);
  });
});

// =======================
// ✅ Save location & apply to search input
// =======================
confirmLocationBtn.addEventListener("click", () => {
  if (!selectedLocation) {
    Swal.fire("⚠️", "من فضلك اختر موقع من الخريطة", "warning");
    return;
  }

  // ✅ Save to localStorage
  localStorage.setItem("selectedLocation", JSON.stringify(selectedLocation));

  // ✅ Update search input with selected location
  if (searchInput) {
    searchInput.value = selectedLocation.name; // <— This sets the input value!
  }

  // ✅ Close the map modal
  closeMap();
});

window.addEventListener("load", () => {
  const saved = localStorage.getItem("selectedLocation");
  if (saved) {
    selectedLocation = JSON.parse(saved);
    if (searchInput) searchInput.value = selectedLocation.name;
  }
});

// =======================
// Search Function (Manual & Map)
// =======================
function performSearch() {
  if (!selectedLocation && searchInput.value.trim() !== "") {
    selectedLocation = {
      name: searchInput.value.trim(),
      lat: null,
      lng: null,
    };
    localStorage.setItem("selectedLocation", JSON.stringify(selectedLocation));
  }

  if (selectedLocation) {
    console.log("Searching near:", selectedLocation);
    // ✅ Navigate to the shops page
    window.location.href = "selectedLocationShops.html";
  } else {
    Swal.fire("⚠️", "من فضلك اختر موقعك أولًا", "warning");
  }
}

if (searchBtn) {
  searchBtn.addEventListener("click", performSearch);

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") performSearch();
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim() !== "") showSuggestions(searchInput.value);
  });
}

// =========================
// 🔎 Autocomplete Suggestions (Real API, Smooth & Reliable)
// =========================
const suggestionsBox = document.createElement("ul");
suggestionsBox.id = "suggestionsBox";
suggestionsBox.style.cssText = `
  position: absolute;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  z-index: 9999;
  max-height: 200px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
  display: none;
`;

if (searchInput) {
  searchInput.parentElement.style.position = "relative";
  searchInput.parentElement.appendChild(suggestionsBox);
}

let typingTimer;
const DEBOUNCE_DELAY = 400;
async function showSuggestions(query) {
  if (!query.trim()) {
    suggestionsBox.style.display = "none";
    return;
  }

  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(
        query
      )}&lang=ar&limit=10`
    );
    const data = await res.json();

    suggestionsBox.innerHTML = "";

    if (!data.features || data.features.length === 0) {
      suggestionsBox.innerHTML = `<li style="padding:8px;color:#888">❌ لا توجد نتائج</li>`;
      suggestionsBox.style.display = "block";
      return;
    }

    data.features.forEach((item) => {
      const name = item.properties.name || "";
      const city = item.properties.city || "";
      const state = item.properties.state || "";
      const country = item.properties.country || "";
      const fullName = `${name}, ${city}, ${state}, ${country}`;

      const li = document.createElement("li");
      li.style.cssText =
        "padding:8px;cursor:pointer;border-bottom:1px solid #eee";
      li.textContent = fullName;

      li.addEventListener("click", () => {
        selectedLocation = {
          lat: item.geometry.coordinates[1],
          lng: item.geometry.coordinates[0],
          name: fullName,
        };

        if (map) {
          map.setView([selectedLocation.lat, selectedLocation.lng], 13);
        }

        searchInput.value = fullName;
        localStorage.setItem(
          "selectedLocation",
          JSON.stringify(selectedLocation)
        );
        suggestionsBox.style.display = "none";
      });

      suggestionsBox.appendChild(li);
    });

    suggestionsBox.style.display = "block";
  } catch (error) {
    console.error("❌ Photon API Error:", error);
  }
}

// 🎯 Input listener (with smart delay to prevent spamming API)
if (searchInput) {
  searchInput.addEventListener("input", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      showSuggestions(searchInput.value);
    }, DEBOUNCE_DELAY);
  });

  // Hide suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.style.display = "none";
    }
  });
}
