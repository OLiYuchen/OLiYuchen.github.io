const { computeRoute, geocodeAddress, nearbyTransit } = require("./_lib/googleMaps");
const { readJson, send, setCors } = require("./_lib/util");

const DESTINATIONS = {
  microsoftB92: {
    label: "Microsoft Building 92",
    address: "15010 NE 36th St, Redmond, WA 98052",
  },
  uwMainCampus: {
    label: "UW Main Campus",
    address: "1410 NE Campus Pkwy, Seattle, WA 98195",
  },
};

function seattleParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const out = {};
  for (const part of parts) out[part.type] = part.value;
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    weekday: out.weekday,
  };
}

function zonedTimeToUtcIso({ year, month, day, hour, minute }, timeZone = "America/Los_Angeles") {
  let utc = Date.UTC(year, month - 1, day, hour, minute);
  for (let i = 0; i < 2; i += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(utc));
    const got = {};
    for (const part of parts) got[part.type] = Number(part.value);
    const asIfUtc = Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute);
    const desired = Date.UTC(year, month - 1, day, hour, minute);
    utc += desired - asIfUtc;
  }
  return new Date(utc).toISOString();
}

function nextCommuteWindow() {
  const now = new Date();
  const today = seattleParts(now);
  const todayUtcNoon = Date.UTC(today.year, today.month - 1, today.day, 12);
  const todayDay = new Date(todayUtcNoon).getUTCDay();
  const targetDay = todayDay <= 2 ? 2 : 3; // Tuesday first, otherwise Wednesday.
  let daysAhead = (targetDay - todayDay + 7) % 7;

  const morningToday = new Date(zonedTimeToUtcIso({ ...today, hour: 8, minute: 30 })).getTime();
  if (daysAhead === 0 && now.getTime() > morningToday) daysAhead = 7;

  const target = new Date(todayUtcNoon + daysAhead * 24 * 60 * 60 * 1000);
  const base = {
    year: target.getUTCFullYear(),
    month: target.getUTCMonth() + 1,
    day: target.getUTCDate(),
  };
  return {
    label: "weekday commute",
    morningDeparture: zonedTimeToUtcIso({ ...base, hour: 8, minute: 30 }),
    eveningDeparture: zonedTimeToUtcIso({ ...base, hour: 17, minute: 30 }),
  };
}

async function routePair(origin, destination, departureTime) {
  const [transit, walking] = await Promise.allSettled([
    computeRoute({ origin, destinationAddress: destination.address, travelMode: "TRANSIT", departureTime }),
    computeRoute({ origin, destinationAddress: destination.address, travelMode: "WALK" }),
  ]);

  return {
    label: destination.label,
    address: destination.address,
    transit: transit.status === "fulfilled" ? transit.value : null,
    walking: walking.status === "fulfilled" ? walking.value : null,
    errors: [
      transit.status === "rejected" ? `Transit: ${transit.reason.message}` : null,
      walking.status === "rejected" ? `Walking: ${walking.reason.message}` : null,
    ].filter(Boolean),
  };
}

function straightLineMeters(a, b) {
  const radius = 6_371_000;
  const toRad = (n) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * radius * Math.asin(Math.sqrt(h)));
}

async function enrichNearby(origin) {
  const places = await nearbyTransit(origin);
  const walkRoutes = await Promise.allSettled(
    places.slice(0, 3).map((place) =>
      computeRoute({
        origin,
        destinationAddress: place.address || place.name,
        travelMode: "WALK",
      })
    )
  );

  return places.map((place, index) => {
    const route = index < 3 && walkRoutes[index].status === "fulfilled" ? walkRoutes[index].value : null;
    return {
      ...place,
      distanceMeters: place.location ? straightLineMeters(origin, place.location) : null,
      walk: route,
      walkMinutes: route?.durationText || null,
    };
  });
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch (error) {
    send(res, 400, { ok: false, error: "Invalid request body" });
    return;
  }

  const address = String(payload.address || "").trim();
  if (address.length < 6) {
    send(res, 400, { ok: false, error: "请输入更完整的公寓地址。" });
    return;
  }

  try {
    const commuteWindow = nextCommuteWindow();
    const origin = await geocodeAddress(address);
    const [microsoft, uw, transitNearby] = await Promise.allSettled([
      routePair(origin.location, DESTINATIONS.microsoftB92, commuteWindow.morningDeparture),
      routePair(origin.location, DESTINATIONS.uwMainCampus, commuteWindow.morningDeparture),
      enrichNearby(origin.location),
    ]);

    send(res, 200, {
      ok: true,
      query: address,
      origin,
      commuteWindow,
      destinations: {
        microsoftB92: microsoft.status === "fulfilled" ? microsoft.value : null,
        uwMainCampus: uw.status === "fulfilled" ? uw.value : null,
      },
      nearbyTransit: transitNearby.status === "fulfilled" ? transitNearby.value : [],
      warnings: [
        microsoft.status === "rejected" ? `Microsoft route failed: ${microsoft.reason.message}` : null,
        uw.status === "rejected" ? `UW route failed: ${uw.reason.message}` : null,
        transitNearby.status === "rejected" ? `Nearby transit failed: ${transitNearby.reason.message}` : null,
      ].filter(Boolean),
    });
  } catch (error) {
    const status = error.status || 500;
    const message =
      error.code === "MISSING_GOOGLE_MAPS_API_KEY"
        ? "服务器还没有配置 GOOGLE_MAPS_API_KEY。"
        : error.message || "分析失败，请稍后再试。";
    send(res, status, { ok: false, error: message, code: error.code || "ANALYZE_FAILED" });
  }
};
