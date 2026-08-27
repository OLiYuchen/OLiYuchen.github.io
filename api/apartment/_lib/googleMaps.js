const { fetchJson } = require("./util");

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";
const PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby";

function apiKey() {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY || "";
}

function ensureKey() {
  const key = apiKey();
  if (!key) {
    const error = new Error("Missing GOOGLE_MAPS_API_KEY");
    error.code = "MISSING_GOOGLE_MAPS_API_KEY";
    error.status = 500;
    throw error;
  }
  return key;
}

function locationFromGeocode(result) {
  const loc = result.geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

async function geocodeAddress(address) {
  const key = ensureKey();
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("address", address);
  url.searchParams.set("components", "administrative_area:WA|country:US");
  url.searchParams.set("key", key);

  const payload = await fetchJson(url.toString(), {}, 10_000);
  if (payload.status !== "OK" || !payload.results?.length) {
    const error = new Error(payload.error_message || "Address could not be geocoded");
    error.code = "GEOCODE_FAILED";
    error.googleStatus = payload.status;
    error.status = 422;
    throw error;
  }

  const best = payload.results[0];
  return {
    formattedAddress: best.formatted_address,
    placeId: best.place_id,
    location: locationFromGeocode(best),
  };
}

function waypointFromLocation(location) {
  return {
    location: {
      latLng: {
        latitude: location.lat,
        longitude: location.lng,
      },
    },
  };
}

function waypointFromAddress(address) {
  return { address };
}

function parseTransitLine(step) {
  const details = step.transitDetails;
  if (!details?.transitLine) return null;
  const line = details.transitLine;
  const name = line.nameShort || line.name || "";
  const vehicle = line.vehicle?.name?.text || line.vehicle?.type || "";
  return [name, vehicle].filter(Boolean).join(" ");
}

function parseRoute(route, mode) {
  if (!route) return null;
  const legs = route.legs || [];
  const steps = legs.flatMap((leg) => leg.steps || []);
  const transitSteps = steps.filter((step) => step.travelMode === "TRANSIT");
  const walkSeconds = steps
    .filter((step) => step.travelMode === "WALK")
    .reduce((total, step) => total + Number((step.staticDuration || step.localizedValues?.staticDuration?.text || "0s").replace("s", "")), 0);

  const lines = transitSteps.map(parseTransitLine).filter(Boolean);
  return {
    mode,
    duration: route.duration || null,
    durationText: route.localizedValues?.duration?.text || null,
    staticDurationText: route.localizedValues?.staticDuration?.text || null,
    distanceMeters: route.distanceMeters || null,
    distanceText: route.localizedValues?.distance?.text || null,
    walkMinutes: walkSeconds ? Math.round(walkSeconds / 60) : null,
    transfers: Math.max(0, transitSteps.length - 1),
    lines: [...new Set(lines)].slice(0, 6),
    summary: route.description || null,
    warnings: route.routeLabels || [],
  };
}

async function computeRoute({ origin, destinationAddress, travelMode, departureTime }) {
  const key = ensureKey();
  const body = {
    origin: waypointFromLocation(origin),
    destination: waypointFromAddress(destinationAddress),
    travelMode,
    languageCode: "en-US",
    units: "IMPERIAL",
    computeAlternativeRoutes: false,
  };

  if (travelMode === "TRANSIT") {
    body.departureTime = departureTime;
    body.transitPreferences = {
      allowedTravelModes: ["BUS", "SUBWAY", "TRAIN", "LIGHT_RAIL", "RAIL"],
      routingPreference: "FEWER_TRANSFERS",
    };
  }

  const payload = await fetchJson(
    ROUTES_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": [
        "routes.duration",
        "routes.staticDuration",
        "routes.distanceMeters",
        "routes.description",
        "routes.routeLabels",
          "routes.localizedValues.distance",
          "routes.localizedValues.duration",
          "routes.localizedValues.staticDuration",
          "routes.legs.steps.travelMode",
          "routes.legs.steps.staticDuration",
          "routes.legs.steps.transitDetails.transitLine.name",
          "routes.legs.steps.transitDetails.transitLine.nameShort",
          "routes.legs.steps.transitDetails.transitLine.vehicle",
        ].join(","),
      },
      body: JSON.stringify(body),
    },
    14_000
  );

  return parseRoute(payload.routes?.[0], travelMode);
}

async function nearbyTransit(origin) {
  const key = ensureKey();
  const payload = await fetchJson(
    PLACES_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types",
      },
      body: JSON.stringify({
        includedTypes: ["transit_station"],
        maxResultCount: 10,
        rankPreference: "DISTANCE",
        locationRestriction: {
          circle: {
            center: { latitude: origin.lat, longitude: origin.lng },
            radius: 900,
          },
        },
        languageCode: "en-US",
      }),
    },
    10_000
  );

  return (payload.places || []).slice(0, 6).map((place) => ({
    id: place.id,
    name: place.displayName?.text || "Transit station",
    address: place.formattedAddress || "",
    location: place.location ? { lat: place.location.latitude, lng: place.location.longitude } : null,
    types: place.types || [],
  }));
}

module.exports = { computeRoute, geocodeAddress, nearbyTransit };
