// =======================
// Element Selectors
// =======================
document.addEventListener("DOMContentLoaded", () => {
  let isEditing = false;
  let editIndex = null;
  const locationBtn = document.getElementById("location-btn");
  const mapModal = document.getElementById("mapModal");
  const mapContent = document.getElementById("map-figure");
  const closeMapBtn = document.getElementById("closeMapModal");
  const confirmLocationBtn = document.getElementById("confirmLocationBtn");
  const userLocationBtn = document.getElementById("userLocationBtn");
  const currentLocationBtn = document.getElementById("goToCurrentLocation");
  const mapSearchInput = document.getElementById("map-search-input");
  const mapSearchBtn = document.getElementById("map-search-btn");
  const mapShower = document.getElementById("map-shower");
  const locationFormShower = document.getElementById("locationFormShower");
  const locationForm = document.getElementById("locationDetails");

  let map;
  let selectedLocation =
    JSON.parse(localStorage.getItem("selectedLocation")) || null;

  // =======================
  // Egypt Bounds (Map Limits)
  // =======================
  const egyptBounds = [
    [21.7, 24.7],
    [31.7, 37.3],
  ];

  // =======================
  // Open Map Modal
  // =======================

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

  if (locationBtn) locationBtn.addEventListener("click", openMapModal);
  if (userLocationBtn) userLocationBtn.addEventListener("click", openMapModal);

  // =======================
  // Close Map Modal
  // =======================
  // ✅ Close Modal Button
  closeMapBtn.addEventListener("click", () => {
    closeModalProperly();
  });

  // ✅ Close When Clicking Outside Modal Content
  if (mapModal && mapContent) {
    mapModal.addEventListener("click", (e) => {
      if (!mapContent.contains(e.target)) {
        closeModalProperly();
      }
    });
  }

  // ✅ Unified Close Function (Fixes All Bugs!)
  function closeModalProperly() {
    mapModal.classList.remove("is-visible");
    document.body.style.overflow = "";
    if (maptitle) {
      maptitle.textContent = "إضافة عنوان جديد";
    }

    // If user was editing, keep data — just close form & return to map
    if (isEditing) {
      isEditing = false;
      editIndex = null;
      showMapView(); // ⬅ only show the map, not full form reset
    } else {
      // If user was adding a new location, reset form
      showMapView();
    }
  }

  // =======================
  // Initialize Leaflet Map
  // =======================

  const CAIRO_COORDS = [30.0444, 31.2357];
  const CAIRO_DEFAULT_ZOOM = 9;

  // ============ Initialize Map ============
  function initLeafletMap() {
    if (map) return; // ✅ Prevent creating multiple maps

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

    // ✅ Restore saved chosen location if exists
    if (selectedLocation) {
      map.setView([selectedLocation.lat, selectedLocation.lng], 14);
      L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(map);
    }

    // ✅ Add Pin Indicator (prevent duplicates)
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

  // ============ Map Modal Open ============
  function openMapModal() {
    mapModal.classList.add("is-visible");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      initLeafletMap();
      map.invalidateSize(); // ✅ Fix empty/gray map when opening
    }, 150);
  }

  // ============ Close Modal (Don't destroy map) ============
  function closeMapModal() {
    mapModal.classList.remove("is-visible");
    document.body.style.overflow = "auto";
  }


  // ============ Auto Init on Page Load ============
  window.addEventListener("DOMContentLoaded", initLeafletMap);

  // =======================
  // Reverse Geocode from Map Center
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
      if (placeName && placeName !== stateName) {
        finalName = `${stateName}, ${placeName}`;
      }

      selectedLocation = { lat, lng, name: finalName };

      document.getElementById(
        "deliverToText"
      ).textContent = `📍 التوصيل إلى: ${finalName}`;
    } catch {
      document.getElementById("deliverToText").textContent =
        "⚠️ خطأ في تحديد الموقع";
    }
  }

  // =======================
  // Confirm Location (Save)
  // =======================

  confirmLocationBtn.addEventListener("click", () => {
    // Always update search input if elements exist
    if (mapSearchInput) mapSearchInput.value = selectedLocation?.name || "";

    // If no selectedLocation, just show warning and stop here
    if (!selectedLocation) {
      Swal.fire("⚠️", "من فضلك حرك الخريطة لاختيار موقع صالح", "warning");
      return;
    }

    // Save selection for later use
    localStorage.setItem("selectedLocation", JSON.stringify(selectedLocation));

    // Only try to populate the form if it exists
    if (locationForm) {
      const stateName =
        selectedLocation.state ||
        selectedLocation.address ||
        selectedLocation.region ||
        "";
      const cityName =
        selectedLocation.city ||
        selectedLocation.town ||
        selectedLocation.village ||
        selectedLocation.suburb ||
        "";
      const streetName = selectedLocation.road || selectedLocation.street || "";

      // Set state select
      if (locationForm.state && govData[stateName]) {
        locationForm.state.value = stateName;

        // Populate cities for that state & select city
        if (locationForm.landmark) {
          locationForm.landmark.innerHTML =
            '<option value="">اختر المدينة</option>';
          govData[stateName].forEach((city) => {
            const option = document.createElement("option");
            option.value = city;
            option.textContent = city;
            if (city === cityName) option.selected = true;
            locationForm.landmark.appendChild(option);
          });
        }
      }

      // Set street input
      if (locationForm.street) locationForm.street.value = streetName;

      // Show form view if elements exist
      if (mapShower && locationFormShower) {
        mapShower.classList.add("hidden");
        locationFormShower.classList.add("is-visible");
      } else {
        mapModal?.classList.remove("is-visible");
        document.body.style.overflow = "";
      }
    }

    console.log("✅ Location synced:", {
      name: selectedLocation.name,
      state: selectedLocation.state,
      city: selectedLocation.city,
      street: selectedLocation.road,
    });
  });

  // =======================
  // ✅ Current Location (GPS Button)
  // =======================

  // ======== Confirm Location Button ========
  confirmLocationBtn.addEventListener("click", async () => {
    if (!selectedLocation || !locationForm) {
      Swal.fire("⚠️", "من فضلك حرك الخريطة لاختيار موقع صالح", "warning");
      return;
    }

    // Reverse geocode to get state/city/street if not already present
    if (
      !selectedLocation.state ||
      !selectedLocation.city ||
      !selectedLocation.street
    ) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${selectedLocation.lat}&lon=${selectedLocation.lng}&format=json&accept-language=ar&zoom=18`
        );
        const data = await res.json();
        const address = data.address;

        selectedLocation.state = address.state || address.county || "";
        selectedLocation.city =
          address.city ||
          address.town ||
          address.village ||
          address.suburb ||
          address.municipality ||
          "";
        selectedLocation.street =
          address.road ||
          address.neighbourhood ||
          address.suburb ||
          selectedLocation.name ||
          "";
      } catch (err) {
        console.error("Reverse geocode error:", err);
        selectedLocation.street = selectedLocation.name || "";
      }
    }

    const stateName = selectedLocation.state || "";
    const cityName = selectedLocation.city || "";
    const streetName = selectedLocation.street || "";

    // ✅ Set state select
    if (locationForm.state) locationForm.state.value = stateName;

    // ✅ Populate city select with all cities from govData[state]
    if (locationForm.landmark) {
      locationForm.landmark.innerHTML =
        '<option value="">اختر المدينة</option>';

      if (govData[stateName]) {
        govData[stateName].forEach((city) => {
          const opt = document.createElement("option");
          opt.value = city;
          opt.textContent = city;
          if (city === cityName) opt.selected = true;
          locationForm.landmark.appendChild(opt);
        });
      }
    }

    // ✅ Set street input
    if (locationForm.street) locationForm.street.value = streetName;

    // ✅ Show form view
    mapShower?.classList.add("hidden");
    locationFormShower?.classList.add("is-visible");

    // ✅ Save selection
    localStorage.setItem("selectedLocation", JSON.stringify(selectedLocation));

    console.log("✅ Location synced to form:", selectedLocation);
  });

  // ======== Current Location Button ========
  currentLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      Swal.fire("⚠️", "المتصفح لا يدعم تحديد الموقع", "error");
      return;
    }

    currentLocationBtn.textContent = "⏳ جاري تحديد موقعك...";

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 15);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar&zoom=18`
          );

          if (!res.ok) throw new Error("Failed to fetch location");

          const data = await res.json();
          const address = data.address || {};

          // Check country
          if (address.country_code && address.country_code !== "eg") {
            Swal.fire("❌ خارج مصر", "الموقع خارج مصر", "error");
            selectedLocation = null;
            return;
          }

          // Safe defaults
          const placeName =
            address.road ||
            address.neighbourhood ||
            address.suburb ||
            address.village ||
            address.city ||
            address.town ||
            "";

          const stateName = address.state || address.county || "";
          const finalName = placeName
            ? `${stateName}, ${placeName}`
            : stateName;

          selectedLocation = {
            lat: latitude,
            lng: longitude,
            address,
            name: finalName,
          };

          // Update inputs
          if (mapSearchInput) mapSearchInput.value = finalName;

          const deliverTextEl = document.getElementById("deliverToText");
          if (deliverTextEl)
            deliverTextEl.textContent = `📍 التوصيل إلى: ${finalName}`;

          // Save
          localStorage.setItem(
            "selectedLocation",
            JSON.stringify(selectedLocation)
          );
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          Swal.fire("⚠️", "حدث خطأ أثناء تحديد الموقع", "error");
        } finally {
          currentLocationBtn.textContent = "📍 موقعي الحالي";
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        Swal.fire(
          "⚠️",
          "لم نتمكن من تحديد موقعك، تأكد من تفعيل GPS",
          "warning"
        );
        currentLocationBtn.textContent = "📍 موقعي الحالي";
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  // =======================
  // Gender Selection (UI Toggle) + Show Inputs Based on Type
  // =======================
  const labels = document.querySelectorAll(".gender-selection label");
  const radios = document.querySelectorAll(
    '.gender-selection input[type="radio"]'
  );

  // Default active

  // Handle click selection
  if (labels && radios) {
    // ✅ Only update UI when type is switched (no form reset!)
    document.querySelectorAll("input[name='locationType']").forEach((radio) => {
      radio.addEventListener("change", () => {
        // Update active class only
        document
          .querySelectorAll(".gender-selection label")
          .forEach((label) => {
            label.classList.toggle(
              "active",
              label.getAttribute("for") === radio.id
            );
          });

        // Show correct input fields
        toggleInputs(radio.value);
      });
    });
  }

  // =======================
  // Show / Hide Inputs Based on Selected Type
  // =======================
  function toggleInputs(type) {
    const building = document.getElementById("building");
    const floorNumber = document.getElementById("floorNumber");
    const apartmentNumber = document.getElementById("apartmentNumber");
    const departmentNumber = document.getElementById("departmentNumber");
    const house = document.getElementById("house");

    // Hide all fields
    [building, floorNumber, apartmentNumber, departmentNumber, house].forEach(
      (el) => {
        el.style.display = "none";
        el.required = false; // remove required for hidden fields
      }
    );

    // Show relevant fields and mark them required
    if (type === "apartment") {
      [building, floorNumber, apartmentNumber].forEach((el) => {
        el.style.display = "block";
        el.required = true;
      });
    } else if (type === "office") {
      [building, floorNumber, departmentNumber].forEach((el) => {
        el.style.display = "block";
        el.required = true;
      });
    } else if (type === "house") {
      [house].forEach((el) => {
        el.style.display = "block";
        el.required = true;
      });
    }
  }

  // Listen for location type change
  document.querySelectorAll('input[name="locationType"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      toggleInputs(e.target.value);
    });
  });

  // Initialize on page load
  const initialType = document.querySelector(
    'input[name="locationType"]:checked'
  ).value;
  toggleInputs(initialType);

  const governorateSelect = document.getElementById("state");
  const citySelect = document.getElementById("landmark");

  // ✅ Hardcoded Egyptian Governorates
  // ✅ Unified object containing governorates and dummy cities
  const govData = {
    القاهرة: ["مدينة نصر", "مصر الجديدة", "المعادي"],
    الجيزة: ["الدقي", "المهندسين", "6 أكتوبر"],
    الإسكندرية: ["محرم بك", "سيدي جابر", "العصافرة"],
    الدقهلية: ["المنصورة"],
    "البحر الأحمر": ["الغردقة"],
    البحيرة: ["دمنهور"],
    الفيوم: ["الفيوم الجديدة"],
    الغربية: ["طنطا"],
    الإسماعيلية: ["فايد"],
    المنوفية: ["شبين الكوم"],
    المنيا: ["ملوي"],
    القليوبية: ["بنها"],
    "الوادي الجديد": ["الخارجة"],
    سوهاج: ["سوهاج"],
    أسيوط: ["أسيوط"],
    دمياط: ["دمياط"],
    بورسعيد: ["بورفؤاد"],
    السويس: ["حي الأربعين"],
    "شمال سيناء": ["العريش"],
    "جنوب سيناء": ["شرم الشيخ"],
    "كفر الشيخ": ["كفر الشيخ"],
    مطروح: ["مرسى مطروح"],
    الأقصر: ["الأقصر"],
    قنا: ["قنا"],
    أسوان: ["أسوان"],
  };

  function populateCityOptions(state, selectedCity = "") {
    const citySelect = locationForm.landmark;
    citySelect.innerHTML = '<option value="">اختر المدينة</option>';

    if (!state || !govData[state]) return;

    govData[state].forEach((city) => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      if (city === selectedCity) opt.selected = true;
      citySelect.appendChild(opt);
    });
  }

  confirmLocationBtn.addEventListener("click", () => {
    if (!selectedLocation || !locationForm) {
      Swal.fire("⚠️", "من فضلك حرك الخريطة لاختيار موقع صالح", "warning");
      return;
    }

    const stateName = selectedLocation.state || selectedLocation.address || "";
    const cityName = selectedLocation.city || selectedLocation.town || "";
    const streetName = selectedLocation.street || selectedLocation.road || "";

    // ✅ Set state select
    if (locationForm.state) {
      locationForm.state.value = stateName;

      // ✅ Populate cities for that state
      populateCityOptions(stateName, cityName);
    }

    // ✅ Set street input
    if (locationForm.street) locationForm.street.value = streetName;

    // ✅ Show form view
    mapShower?.classList.add("hidden");
    locationFormShower?.classList.add("is-visible");

    // ✅ Save selection for later
    localStorage.setItem("selectedLocation", JSON.stringify(selectedLocation));

    console.log("✅ Location synced to form:", {
      stateName,
      cityName,
      streetName,
    });
  });

  function loadGovernorates() {
    governorateSelect.innerHTML = `<option value="">اختر المحافظة</option>`;

    Object.keys(govData).forEach((gov) => {
      const option = document.createElement("option");
      option.value = gov;
      option.textContent = gov;
      governorateSelect.appendChild(option);
    });
  }
  loadGovernorates();

  governorateSelect.addEventListener("change", () => {
    const selectedGov = governorateSelect.value;
    citySelect.innerHTML = `<option value="">اختر المدينة</option>`;

    if (govData[selectedGov]) {
      govData[selectedGov].forEach((city) => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
    }
  });

  const locationList = document.createElement("figure");

  const emptyLocations = document.getElementById("emptyLocations");

  // ✅ Utility: Get locations from localStorage
  function getLocations() {
    return JSON.parse(localStorage.getItem("userLocations") || "[]");
  }

  // ✅ Utility: Save locations to localStorage
  function saveLocations(locations) {
    localStorage.setItem("userLocations", JSON.stringify(locations));
  }

  // ✅ Populate form for editing
  function populateForm(location) {
    if (!location) {
      console.warn("⚠ Tried to populateForm with undefined location!");
      return;
    }

    const {
      state = "",
      landmark = "",
      address = "",
      street = "",
      building = "",
      floorNumber = "",
      apartmentNumber = "",
      house = "",
      departmentNumber = "",
      mobile = "",
      phone = "",
      instructions = "",
      locationType = "apartment",
    } = location;

    // ✅ Fill all form fields as before
    locationForm.state.value = state;
    locationForm.landmark.value = landmark;
    locationForm.address.value = address;
    locationForm.street.value = street;
    locationForm.building.value = building;
    locationForm.floorNumber.value = floorNumber;
    locationForm.apartmentNumber.value = apartmentNumber;
    locationForm.house.value = house;
    locationForm.departmentNumber.value = departmentNumber;
    locationForm.mobile.value = mobile;
    locationForm.phone.value = phone;
    locationForm.instructions.value = instructions;

    // ✅ Handle radio buttons and related inputs
    const radio = document.querySelector(
      `.gender-selection input[value="${locationType}"]`
    );
    if (radio) {
      radio.checked = true;
      toggleInputs(locationType);
    }

    // ✅ Smooth scroll into view
    locationForm.scrollIntoView({ behavior: "smooth" });
  }

  const backToMap = document.getElementById("backToMap");
  if (backToMap) {
    backToMap.addEventListener("click", () => {
      if (mapShower && locationFormShower) {
        mapShower.classList.remove("hidden");
        locationFormShower.classList.remove("is-visible");
      }
      showMapView();
    });
  }
  // ✅ Render locations in the figure
  function renderLocations() {
    const locations = getLocations();
    locationList.innerHTML = "";

    if (locations.length === 0) {
      emptyLocations.style.display = "flex";
      if (locationList.parentNode) locationList.remove();
      return;
    }

    emptyLocations.style.display = "none";

    // ✅ Add "إضافة عنوان جديد" button if locations exist
    let addNewBtn = document.createElement("button");

    addNewBtn.innerHTML = `<i class="fa-solid fa-circle-plus"></i> إضافة عنوان جديد`;

    addNewBtn.className = "addLocationBtn";
    addNewBtn.addEventListener("click", () => {
      isEditing = false;
      editIndex = null;

      maptitle.textContent = "إضافة عنوان جديد"; // ✅ Set correct title

      mapModal.classList.add("is-visible");
      document.body.style.overflow = "hidden";

      mapShower.classList.remove("hidden");
      locationFormShower.classList.remove("is-visible");
    });

    // 🟡 When clicking "تعديل"
    document.querySelectorAll(".editLocationBtn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const clickedBtn = e.target.closest(".editLocationBtn");
        editIndex = clickedBtn?.dataset.index;
        isEditing = true;

        populateForm(getLocations()[editIndex]);

        maptitle.textContent = "تعديل عنوان محفوظ"; // ✅ Change title properly

        mapModal.classList.add("is-visible");
        document.body.style.overflow = "hidden";

        mapShower?.classList.add("hidden");
        locationFormShower?.classList.add("is-visible");

        setTimeout(() => map?.invalidateSize(), 300);
      });
    });

    locationList.appendChild(addNewBtn);

    emptyLocations.insertAdjacentElement("afterend", locationList);
    locations.forEach((loc, index) => {
      const div = document.createElement("div");
      div.className = "user-location";

      // Build lines dynamically
      let addressLine = loc.address ? `العنوان: ${loc.address}` : "";

      let streetLineParts = [];
      if (loc.street) streetLineParts.push(`الشارع: ${loc.street}`);
      if (loc.locationType === "apartment") {
        if (loc.building) streetLineParts.push(`البناية: ${loc.building}`);
        if (loc.floorNumber) streetLineParts.push(`الطابق: ${loc.floorNumber}`);
        if (loc.apartmentNumber)
          streetLineParts.push(`الشقة: ${loc.apartmentNumber}`);
      } else if (loc.locationType === "office") {
        if (loc.building) streetLineParts.push(`البناية: ${loc.building}`);
        if (loc.floorNumber) streetLineParts.push(`الطابق: ${loc.floorNumber}`);
        if (loc.departmentNumber)
          streetLineParts.push(`المكتب: ${loc.departmentNumber}`);
      } else if (loc.locationType === "house") {
        if (loc.house) streetLineParts.push(`المنزل: ${loc.house}`);
      }

      let phoneLineParts = [];
      if (loc.mobile) phoneLineParts.push(loc.mobile);
      if (loc.phone) phoneLineParts.push(loc.phone);

      div.innerHTML = `
  <h4>${loc.state} - ${loc.landmark}</h4>
  ${addressLine ? `<p>${addressLine}</p>` : ""}
  ${streetLineParts.length ? `<p>${streetLineParts.join(" | ")}</p>` : ""}
  ${phoneLineParts.length ? `<p>الهاتف: ${phoneLineParts.join(" | ")}</p>` : ""}
  <p>نوع المكان: ${loc.locationType}</p>
  ${loc.instructions ? `<p>ارشادات: ${loc.instructions}</p>` : ""}
  <button class="editLocationBtn" data-index="${index}">
    <i class="fa-solid fa-pen"></i> تعديل
  </button>
  <button class="deleteLocationBtn" data-index="${index}">
    <i class="fa-solid fa-trash"></i> حذف
  </button>
`;

      locationList.appendChild(div);
    });

    // Attach delete & edit listeners (keep your existing code)
    document.querySelectorAll(".deleteLocationBtn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = e.target.dataset.index;
        const updated = getLocations();
        updated.splice(idx, 1);
        saveLocations(updated);
        renderLocations();
      });
    });
    // 🟡 When clicking "تعديل"
    document.querySelectorAll(".editLocationBtn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const clickedBtn = e.target.closest(".editLocationBtn");
        editIndex = clickedBtn?.dataset.index;
        isEditing = true;

        populateForm(getLocations()[editIndex]);

        maptitle.textContent = "تعديل عنوان محفوظ"; // ✅ Change title properly

        mapModal.classList.add("is-visible");
        document.body.style.overflow = "hidden";

        mapShower?.classList.add("hidden");
        locationFormShower?.classList.add("is-visible");

        setTimeout(() => map?.invalidateSize(), 300);
      });
    });
  }

  // ✅ Handle form submission
  locationForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(locationForm);

    // ✅ Ensure locationType always exists
    const locationTypeFromForm = formData.get("locationType");
    const checkedRadioValue = document.querySelector(
      '.gender-selection input[type="radio"]:checked'
    )?.value;
    const finalLocationType =
      locationTypeFromForm || checkedRadioValue || "apartment";

    const newLocation = {
      state: formData.get("state") || "",
      landmark: formData.get("landmark") || "",
      address: formData.get("address") || "",
      street: formData.get("street") || "",
      building: formData.get("building") || "",
      floorNumber: formData.get("floorNumber") || "",
      apartmentNumber: formData.get("apartmentNumber") || "",
      house: formData.get("house") || "",
      departmentNumber: formData.get("departmentNumber") || "",
      mobile: formData.get("mobile") || "",
      phone: formData.get("phone") || "",
      locationType: finalLocationType,
      instructions: formData.get("instructions") || "",
    };

    const locations = getLocations();

    // ✅ Prevent saving empty or corrupted locations
    if (!newLocation || !newLocation.state) {
      console.warn("⚠ Attempted to save a location without state! Skipping...");
      return; // Do not proceed further
    }

    if (isEditing && editIndex !== null) {
      // Update existing
      locations[editIndex] = newLocation;
    } else {
      // Add new
      locations.push(newLocation);
    }

    saveLocations(locations);
    renderLocations();

    // ✅ Close modal without resetting form if editing
    mapModal.classList.remove("is-visible");
    document.body.style.overflow = "";

    if (!isEditing) {
      // Only reset if it was a new form, not edit
      locationForm.reset();
      toggleInputs("apartment");
      document
        .querySelectorAll(".gender-selection label")
        .forEach((l) => l.classList.remove("active"));
      document
        .querySelector(".gender-selection label[for='apartmentType']")
        ?.classList.add("active");
      document.getElementById("apartmentType").checked = true;
    }

    // Reset editing state
    isEditing = false;
    editIndex = null;
    document.body.style.overflow = "";
    showMapView(); // 👈 bring back map properly
    mapModal.classList.remove("is-visible");
    document.body.style.overflow = "";

    if (mapShower && locationFormShower) {
      mapShower.classList.remove("hidden");
      locationFormShower.classList.remove("is-visible");
    }
  });

  // ✅ Initial render
  renderLocations();

  // ✅ Optional: Show form when clicking "إضافة عنوان جديد"
  document.getElementById("userLocationBtn").addEventListener("click", () => {
    locationForm.scrollIntoView({ behavior: "smooth" });
  });

  function showMapView() {
    if (mapShower) mapShower.classList.remove("hidden");
    if (locationFormShower) locationFormShower.classList.remove("is-visible");

    // Fix Leaflet white map issue
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 300);
  }

  function showFormView() {
    if (mapShower) mapShower.classList.add("hidden");
    if (locationFormShower) locationFormShower.classList.add("is-visible");

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 300);
  }

  // ✅ Attach edit event listeners
  document.querySelectorAll(".editLocationBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = e.target.closest(".editLocationBtn").dataset.index;
      const locationToEdit = getLocations()[index];

      if (!locationToEdit) return;

      isEditing = true;
      editIndex = index;

      populateForm(locationToEdit);
      mapModal.classList.add("is-visible");
      document.body.style.overflow = "hidden";

      // 👇 Open form view (hide map)
      showFormView();
    });
  });
});
