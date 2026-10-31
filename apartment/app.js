const $ = (selector, root = document) => root.querySelector(selector);

const form = $("#searchForm");
const input = $("#addressInput");
const submitBtn = $("#submitBtn");
const statusEl = $("#status");
const resultsEl = $("#results");

const LAST_ADDRESS_KEY = "apartment.lastAddress.v1";

function showStatus(message, type = "info") {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.classList.toggle("is-error", type === "error");
}

function clearStatus() {
  statusEl.hidden = true;
  statusEl.textContent = "";
  statusEl.classList.remove("is-error");
}

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function metersToMiles(meters) {
  if (!Number.isFinite(meters)) return "";
  const miles = meters / 1609.344;
  return `${miles.toFixed(miles < 1 ? 1 : 0)} mi`;
}

function routeHtml(route, label) {
  if (!route) {
    return `<div class="empty-route">${label} route 暂时没有返回结果。</div>`;
  }
  const lines = route.lines?.length
    ? `<div class="line-list">${route.lines.map((line) => `<span class="line-pill">${esc(line)}</span>`).join("")}</div>`
    : `<span class="route-meta">无线路信息</span>`;
  const meta = [
    route.distanceText,
    route.walkMinutes ? `walk ${route.walkMinutes} min` : null,
    route.transfers != null && label === "公交" ? `${route.transfers} transfer${route.transfers === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return `<div class="route-row">
    <div class="route-mode">
      <strong>${label}</strong>
      <span class="route-time">${esc(route.durationText || route.staticDurationText || "--")}</span>
    </div>
    <div class="route-details">
      ${lines}
      <span class="route-meta">${esc(meta || "Route detail unavailable")}</span>
    </div>
  </div>`;
}

function renderDestination(target, mount) {
  if (!target) {
    mount.innerHTML = `<div class="empty-route">这个目的地暂时没有返回结果。</div>`;
    return;
  }
  mount.innerHTML = [
    routeHtml(target.transit, "公交"),
    routeHtml(target.walking, "步行"),
    ...(target.errors || []).map((error) => `<div class="empty-route">${esc(error)}</div>`),
  ].join("");
}

function renderNearby(list) {
  const mount = $("#nearbyList");
  if (!list?.length) {
    mount.innerHTML = `<div class="empty-route">900m 内没有找到 Google 标记的 transit station。</div>`;
    return;
  }
  mount.innerHTML = list
    .map((place) => {
      const walk = place.walk?.durationText || place.walkMinutes || "未计算";
      const distance = place.walk?.distanceText || metersToMiles(place.distanceMeters);
      return `<div class="nearby-item">
        <div>
          <div class="nearby-name">${esc(place.name)}</div>
          <div class="nearby-address">${esc(place.address || place.types?.join(", ") || "Transit station")}</div>
        </div>
        <div class="nearby-metric">
          <strong>${esc(walk)}</strong>
          <span class="route-meta">${esc(distance)}</span>
        </div>
      </div>`;
    })
    .join("");
}

function renderWarnings(warnings) {
  const mount = $("#warnings");
  if (!warnings?.length) {
    mount.hidden = true;
    mount.innerHTML = "";
    return;
  }
  mount.hidden = false;
  mount.innerHTML = warnings.map((warning) => `<p>${esc(warning)}</p>`).join("");
}

function renderResults(data) {
  $("#originAddress").textContent = data.origin?.formattedAddress || data.query;
  const mapsUrl = new URL("https://www.google.com/maps/search/");
  mapsUrl.searchParams.set("api", "1");
  mapsUrl.searchParams.set("query", data.origin?.formattedAddress || data.query);
  $("#mapsLink").href = mapsUrl.toString();

  renderDestination(data.destinations?.microsoftB92, $("#microsoftResult"));
  renderDestination(data.destinations?.uwMainCampus, $("#uwResult"));
  renderNearby(data.nearbyTransit);
  renderWarnings(data.warnings);

  resultsEl.hidden = false;
}

async function analyze(address) {
  clearStatus();
  resultsEl.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "分析中";
  showStatus("正在解析地址、计算公交和步行路线...");

  try {
    const response = await fetch("/api/apartment/analyze", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "分析失败");
    localStorage.setItem(LAST_ADDRESS_KEY, address);
    clearStatus();
    renderResults(data);
  } catch (error) {
    showStatus(error.message || "分析失败，请稍后再试。", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "分析";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const address = input.value.trim();
  if (!address) return;
  analyze(address);
});

input.value = localStorage.getItem(LAST_ADDRESS_KEY) || "";
input.focus();
