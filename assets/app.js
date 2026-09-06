const destinations = [
  { name: "Beijing", chinese: "北京", coordinates: [39.9042, 116.4074], days: 4, region: "Northern China", theme: "Power, ritual and the monumental capital", layer: "Imperial geography", note: "Read the capital through its ceremonial axis—from the Temple of Heaven to the Forbidden City and the Olympic Park." },
  { name: "Tianjin", chinese: "天津", coordinates: [39.0851, 117.1994], days: 1, region: "Bohai Rim", theme: "A treaty-port city at the river and sea", layer: "Urban encounters", note: "Trace the unusual coexistence of concession-era architecture, northern food traditions and a vast modern port." },
  { name: "Jinan", chinese: "济南", coordinates: [36.6512, 117.1201], days: 2, region: "Shandong", theme: "The city of springs", layer: "Water and landscape", note: "Consider how natural springs shaped an inland provincial capital connected to the Grand Canal system." },
  { name: "Suzhou", chinese: "苏州", coordinates: [31.2989, 120.5853], days: 2, region: "Jiangnan", theme: "Gardens, canals and cultivated space", layer: "Designed nature", note: "Explore the classical garden as a miniature world and the canal as both infrastructure and urban memory." },
  { name: "Shanghai", chinese: "上海", coordinates: [31.2304, 121.4737], days: 4, region: "Yangtze Delta", theme: "Modernity at the water’s edge", layer: "Global China", note: "End with the city that compresses commercial history, colonial encounters and futuristic urban ambition into one skyline." }
];

const defaultTasks = [
  "Confirm entry requirements",
  "Set up Alipay and WeChat Pay",
  "Reserve intercity trains",
  "Download offline maps and translation",
  "Save accommodation addresses in Chinese",
  "Arrange travel insurance"
];

let selectedIndex = 0;

function setupMap() {
  if (!window.L) {
    document.querySelector("#map").textContent = "The route map could not load. Check your internet connection.";
    return;
  }

  const map = L.map("map", { scrollWheelZoom: false, zoomControl: true }).setView([35.6, 119], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const route = destinations.map(({ coordinates }) => coordinates);
  L.polyline(route, { color: "#a72820", weight: 4, opacity: .82, dashArray: "7 9" }).addTo(map);

  destinations.forEach((place, index) => {
    const icon = L.divIcon({ className: "route-marker", html: String(index + 1), iconSize: [28, 28] });
    L.marker(place.coordinates, { icon }).addTo(map).on("click", () => selectPlace(index));
  });

  map.fitBounds(route, { padding: [45, 45] });
}

function renderRouteTabs() {
  const tabs = document.querySelector("#route-tabs");
  tabs.innerHTML = destinations.map((place, index) => `<li><button type="button" data-index="${index}"><strong>${place.chinese}</strong><br>${place.name}</button></li>`).join("");
  tabs.addEventListener("click", event => {
    const button = event.target.closest("button[data-index]");
    if (button) selectPlace(Number(button.dataset.index));
  });
}

function selectPlace(index) {
  selectedIndex = index;
  const place = destinations[index];
  document.querySelector("#route-number").textContent = `${String(index + 1).padStart(2, "0")} / ${String(destinations.length).padStart(2, "0")}`;
  document.querySelector("#place-chinese").textContent = place.chinese;
  document.querySelector("#place-name").textContent = place.name;
  document.querySelector("#place-theme").textContent = place.theme;
  document.querySelector("#place-days").textContent = `Suggested: ${place.days} ${place.days === 1 ? "day" : "days"}`;
  document.querySelector("#place-region").textContent = place.region;
  document.querySelectorAll("#route-tabs button").forEach((button, buttonIndex) => button.classList.toggle("active", buttonIndex === index));
}

function renderAtlas() {
  document.querySelector("#city-count").textContent = destinations.length;
  document.querySelector("#atlas-grid").innerHTML = destinations.slice(0, 3).map((place, index) => `
    <article class="atlas-card">
      <span class="index">0${index + 1}</span>
      <h3>${place.layer}</h3>
      <p>${place.note}</p>
    </article>`).join("");
}

function setupChecklist() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem("destinoChinaTasks")); } catch { saved = null; }
  let tasks = Array.isArray(saved) ? saved : defaultTasks.map((label, index) => ({ id: index + 1, label, done: false }));
  const container = document.querySelector("#checklist");

  function saveAndRender() {
    localStorage.setItem("destinoChinaTasks", JSON.stringify(tasks));
    container.innerHTML = tasks.map(task => `<div class="check-item"><input type="checkbox" id="task-${task.id}" data-id="${task.id}" ${task.done ? "checked" : ""}><label for="task-${task.id}">${escapeHTML(task.label)}</label></div>`).join("");
    const done = tasks.filter(task => task.done).length;
    document.querySelector("#check-progress").textContent = `${done} / ${tasks.length}`;
    document.querySelector("#progress-bar").style.width = `${tasks.length ? (done / tasks.length) * 100 : 0}%`;
  }

  container.addEventListener("change", event => {
    const task = tasks.find(item => item.id === Number(event.target.dataset.id));
    if (task) { task.done = event.target.checked; saveAndRender(); }
  });

  document.querySelector("#add-task-form").addEventListener("submit", event => {
    event.preventDefault();
    const input = document.querySelector("#new-task");
    const label = input.value.trim();
    if (!label) return;
    tasks.push({ id: Date.now(), label, done: false });
    input.value = "";
    saveAndRender();
  });

  saveAndRender();
}

function setupBudget() {
  const inputs = [...document.querySelectorAll("[data-budget]")];
  const rate = document.querySelector("#exchange-rate");
  function calculate() {
    const euros = inputs.reduce((sum, input) => sum + Math.max(0, Number(input.value) || 0), 0);
    const cny = euros * Math.max(0, Number(rate.value) || 0);
    document.querySelector("#total-eur").textContent = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(euros);
    document.querySelector("#total-cny").textContent = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 }).format(cny);
  }
  [...inputs, rate].forEach(input => input.addEventListener("input", calculate));
  calculate();
}

function escapeHTML(value) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

renderRouteTabs();
renderAtlas();
setupMap();
setupChecklist();
setupBudget();
selectPlace(0);
document.querySelector("#next-stop").addEventListener("click", () => selectPlace((selectedIndex + 1) % destinations.length));
