
// ============================================
// TRAFFICPULSE AI - SMART ROUTE RECOMMENDATION
// ============================================

const INCIDENT_NEAR_ROUTE_METERS = 300;

function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371000;

    const toRadians = degrees => degrees * Math.PI / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return earthRadius * 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );
}

// Measure how close each reported incident is to a route.
// GeoJSON coordinates use [longitude, latitude].
function analyzeRouteIncidents(route) {
    const coordinates = route.geometry?.coordinates || [];

    const incidents = Array.isArray(trafficIncidents)
        ? trafficIncidents
        : [];

    const nearbyIncidents = [];

    for (const incident of incidents) {
        const incidentLat = Number(incident.latitude);
        const incidentLon = Number(incident.longitude);

        let minimumDistance = Infinity;

        for (const coordinate of coordinates) {
            const longitude = Number(coordinate[0]);
            const latitude = Number(coordinate[1]);

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {
                continue;
            }

            const distance = getDistanceMeters(
                latitude,
                longitude,
                incidentLat,
                incidentLon
            );

            minimumDistance = Math.min(minimumDistance, distance);
        }

        if (minimumDistance <= INCIDENT_NEAR_ROUTE_METERS) {
            nearbyIncidents.push({
                ...incident,
                distanceFromRouteMeters: Math.round(minimumDistance)
            });
        }
    }

    return nearbyIncidents;
}

// Rank routes by estimated time, distance, and incident risk.
// This is a transparent rule-based score, not a trained AI model.
function rankRoutes(routes) {
    if (!routes.length) {
        return [];
    }

    const analyzedRoutes = routes.map(route => {
        const nearbyIncidents = analyzeRouteIncidents(route);

        const incidentRisk = nearbyIncidents.reduce((total, incident) => {
            const severity = String(
                incident.severity || ""
            ).toLowerCase();

            const riskPoints = {
                critical: 10,
                high: 6,
                medium: 3,
                low: 1
            };

            return total + (riskPoints[severity] || 2);
        }, 0);

        return {
            ...route,
            nearbyIncidents,
            incidentRisk
        };
    });

    const maxTime = Math.max(
        1,
        ...analyzedRoutes.map(route =>
            Number(route.duration_minutes) || 0
        )
    );

    const maxDistance = Math.max(
        1,
        ...analyzedRoutes.map(route =>
            Number(route.distance_km) || 0
        )
    );

    analyzedRoutes.forEach(route => {
        const time = Number(route.duration_minutes) || 0;
        const distance = Number(route.distance_km) || 0;

        // Lower values mean a better route.
        route.recommendationScore =
            (time / maxTime) * 40 +
            (distance / maxDistance) * 20 +
            Math.min(route.incidentRisk, 20) * 2;
    });

    analyzedRoutes.sort(
        (a, b) => a.recommendationScore - b.recommendationScore
    );

    return analyzedRoutes;
}

function getIncidentWarning(route) {
    if (!route.nearbyIncidents?.length) {
        return "No reported active incidents detected near this route.";
    }

    const count = route.nearbyIncidents.length;

    return `Warning: ${count} reported active incident(s) detected within approximately 300 metres of this route.`;
}
let availableRoutes = [];

const routeButton = document.getElementById("routeBtn");

if (routeButton) {
    routeButton.addEventListener("click", findRoutes);
} else {
    console.error('Button with id "routeBtn" was not found.');
}

async function geocodePlace(place) {
    const url = new URL(
        "https://nominatim.openstreetmap.org/search"
    );

    url.search = new URLSearchParams({
        q: `${place}, Karnataka, India`,
        format: "jsonv2",
        countrycodes: "in",
        limit: "1",
        addressdetails: "1"
    });

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            "Location search failed. Please try again."
        );
    }

    const results = await response.json();

    if (!results.length) {
        throw new Error(
            `Could not find ${place}, Karnataka. Try another place name.`
        );
    }

    const result = results[0];

    const location = {
        latitude: Number(result.lat),
        longitude: Number(result.lon),
        name: result.display_name
    };

    console.log("Location found:", location);

    return location;
}

async function findRoutes() {
    const button = document.getElementById("routeBtn");
    const routesContainer = document.getElementById("routesList");

    const startText = document.getElementById("startLocation").value.trim();
    const destinationText = document.getElementById("destination").value.trim();

    if (!startText || !destinationText) {
        showMessage("Enter both a start location and a destination.", true);
        return;
    }

    button.disabled = true;
routesContainer.textContent = "Searching for locations...";

try {
    showMessage("Finding your locations...");
        const start = await geocodePlace(startText);
        const destination = await geocodePlace(destinationText);

        console.log("START LOCATION:", start.name);
console.log(
    "START COORDINATES:",
    start.latitude,
    start.longitude
);

console.log("DESTINATION:", destination.name);
console.log(
    "DESTINATION COORDINATES:",
    destination.latitude,
    destination.longitude
);

        setStartMarker(start.latitude, start.longitude, start.name);
        setDestinationMarker(destination.latitude, destination.longitude);

        showMessage("Locations found. Calculating driving routes...");
        routesContainer.textContent = "Calculating routes...";

        const response = await fetch("/api/routes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                start: {
                    latitude: start.latitude,
                    longitude: start.longitude
                },
                destination: {
                    latitude: destination.latitude,
                    longitude: destination.longitude
                }
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Could not calculate routes.");
        }

        if (!result.routes || result.routes.length === 0) {
            throw new Error("No driving routes found.");
        }

        availableRoutes = result.routes;
        routesContainer.replaceChildren();
        clearRouteLayers();

availableRoutes.forEach((route, index) => {
    const card = document.createElement("div");
    card.className = "route-card";

    const heading = document.createElement("h4");
    heading.textContent = `Route ${index + 1}`;

    const distance = document.createElement("p");
    distance.textContent =
        `Road distance: ${Number(route.distance_km).toFixed(2)} km`;

    const eta = document.createElement("p");
    eta.textContent =
        `Estimated driving time: ${Number(route.duration_minutes)} minutes`;

    card.append(heading, distance, eta);

    card.addEventListener("click", () => selectRoute(index));

    routesContainer.appendChild(card);
});
        displayAllRoutes();
        showMessage("Routes loaded successfully.");
   } catch (error) {
    console.error("Find Best Route error:", error);

    routesContainer.textContent =
        error.message || "Unable to calculate the route.";

    if (typeof showMessage === "function") {
        showMessage(
            error.message || "Unable to calculate the route.",
            true
        );
    }
} finally {
    button.disabled = false;
}
}

function displayAllRoutes() {
    clearRouteLayers();

    const routeColors = [
        "#1677ff",
        "#e67e22",
        "#8e44ad",
        "#16a085"
    ];

    const layers = [];

    availableRoutes.forEach((route, index) => {
        const color = routeColors[index % routeColors.length];

        const layer = L.geoJSON(route.geometry, {
            style: {
                color: color,
                weight: index === 0 ? 7 : 5,
                opacity: index === 0 ? 1 : 0.75
            }
        }).addTo(map);

        // Keep track of each route layer.
        routeLayers.push(layer);
        layers.push(layer);

        layer.bindPopup(
            `Route ${index + 1}<br>` +
            `Distance: ${route.distance_km} km<br>` +
            `Time: ${route.duration_minutes} minutes`
        );

        layer.on("click", () => selectRoute(index));
    });

    document.querySelectorAll(".route-card").forEach((card, index) => {
        card.classList.toggle("selected", index === 0);
    });

    if (layers.length > 0) {
        const group = L.featureGroup(layers);
        map.fitBounds(group.getBounds(), {
            padding: [30, 30]
        });
    }
}

function selectRoute(index) {
    const route = availableRoutes[index];

    if (!route) return;

    // Highlight the selected route and keep the alternatives visible.
    routeLayers.forEach((layer, layerIndex) => {
        layer.setStyle({
            weight: layerIndex === index ? 8 : 5,
            opacity: layerIndex === index ? 1 : 0.65
        });

        layer.bringToFront();
    });

    document.querySelectorAll(".route-card").forEach((card, cardIndex) => {
        card.classList.toggle("selected", cardIndex === index);
    });

    if (routeLayers[index]) {
        routeLayers[index].openPopup();
    }
}

