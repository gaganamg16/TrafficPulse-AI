const map = L.map("map").setView([12.9716, 77.5946], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let currentLocationMarker = null;
let startMarker = null;
let destinationMarker = null;
let routeLayers = [];
let incidentMarkers = [];
let trafficIncidents = [];

function showMessage(message, isError = false) {
    const element = document.getElementById("message");

    element.textContent = message;
    element.style.color = isError ? "#b42318" : "#087f5b";
}

function clearRouteLayers() {
    routeLayers.forEach(layer => map.removeLayer(layer));
    routeLayers = [];
}

function displayRoute(route, selected = false) {
    const layer = L.geoJSON(route.geometry, {
        style: {
            color: selected ? "#087f5b" : "#3979d8",
            weight: selected ? 7 : 5,
            opacity: selected ? 0.9 : 0.55
        }
    }).addTo(map);

    routeLayers.push(layer);
    return layer;
}

function setStartMarker(latitude, longitude, label = "Start Location") {
    if (startMarker) {
        startMarker.setLatLng([latitude, longitude]);
    } else {
        startMarker = L.marker([latitude, longitude]).addTo(map);
    }

    startMarker.bindPopup(label);
}

function setDestinationMarker(latitude, longitude) {
    if (destinationMarker) {
        destinationMarker.setLatLng([latitude, longitude]);
    } else {
        destinationMarker = L.marker([latitude, longitude]).addTo(map);
    }

    destinationMarker.bindPopup("Destination");
}

function locateUser() {
    if (!navigator.geolocation) {
        showMessage("Your browser does not support location services.", true);
        return;
    }

    showMessage("Finding your current location...");

    navigator.geolocation.getCurrentPosition(
        position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            if (currentLocationMarker) {
                currentLocationMarker.setLatLng([latitude, longitude]);
            } else {
                currentLocationMarker = L.marker([latitude, longitude])
                    .addTo(map);
            }

            currentLocationMarker.bindPopup("Your Current Location");
            setStartMarker(latitude, longitude, "Your Current Location");

            map.setView([latitude, longitude], 15);

            // Reverse geocode coordinates into a readable place name.
            reverseGeocode(latitude, longitude)
                .then(place => {
                    document.getElementById("startLocation").value =
                        place || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

                    showMessage("Current location selected.");
                })
                .catch(() => {
                    document.getElementById("startLocation").value =
                        `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

                    showMessage("Location found. You can now select a destination.");
                });
        },
        error => {
            const messages = {
                1: "Location permission denied. Allow access in your browser.",
                2: "Your current location is unavailable.",
                3: "Location request timed out. Try again."
            };

            showMessage(messages[error.code] || "Could not get your location.", true);
        }, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000
        }
    );
}

async function reverseGeocode(latitude, longitude) {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");

    url.search = new URLSearchParams({
        format: "jsonv2",
        lat: latitude,
        lon: longitude
    });

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Could not identify the place.");
    }

    const result = await response.json();
    return result.display_name || "";
}

function escapeHTML(value) {
    var text = String(value || "");


    return text.replace(/[&<>"']/g, function(character) {
        switch (character) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case '"':
                return "&quot;";
            case "'":
                return "&#39;";
            default:
                return character;
        }
    });


}







function displayIncidents(incidents) {
    incidentMarkers.forEach(marker => map.removeLayer(marker));
    incidentMarkers = [];

    incidents.forEach(incident => {
        const marker = L.circleMarker(
            [incident.latitude, incident.longitude], {
                radius: 8,
                color: ["high", "critical"].includes(incident.severity) ?
                    "#c62828" : "#ed8b00",
                fillOpacity: 0.8
            }
        ).addTo(map);

        marker.bindPopup(
            `<strong>${escapeHTML(incident.type)}</strong><br>` +
            `Severity: ${escapeHTML(incident.severity)}<br>` +
            `Status: ${escapeHTML(incident.status)}<br>` +
            escapeHTML(incident.description)
        );

        incidentMarkers.push(marker);
    });
}

async function loadIncidents() {
try {
const response = await fetch("/api/incidents");


    if (!response.ok) {
        throw new Error("Incident API unavailable.");
    }

    const incidents = await response.json();

// Validate the API response before processing it.
if (!Array.isArray(incidents)) {
    throw new Error("Invalid incident data.");
}

// Share active incidents with the route planner.
trafficIncidents = incidents.filter(incident =>
    String(incident.status || "").toLowerCase() !== "resolved" &&
    incident.latitude !== null &&
    incident.latitude !== undefined &&
    incident.longitude !== null &&
    incident.longitude !== undefined &&
    Number.isFinite(Number(incident.latitude)) &&
    Number.isFinite(Number(incident.longitude))
);

    // Update incident markers on the map.
    displayIncidents(incidents);

    // Update the Traffic Overview statistics.
    const totalElement = document.getElementById("totalIncidents");
    const activeElement = document.getElementById("activeIncidents");
    const resolvedElement = document.getElementById("resolvedIncidents");

    const resolvedCount = incidents.filter(incident =>
        String(incident.status || "").toLowerCase() === "resolved"
    ).length;

    const activeCount = incidents.length - resolvedCount;

    if (totalElement) {
        totalElement.textContent = incidents.length;
    }

    if (activeElement) {
        activeElement.textContent = activeCount;
    }

    if (resolvedElement) {
        resolvedElement.textContent = resolvedCount;
    }

    // Update the incident list.
    const container = document.getElementById("incidentsList");

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (incidents.length === 0) {
        container.textContent = "No incidents reported.";
        return;
    }

    incidents.forEach(incident => {
        const card = document.createElement("div");
        card.className = "incident-card";

        const heading = document.createElement("h4");
        heading.textContent =
            `${incident.type || "Incident"} — ${incident.severity || "Unknown"}`;

        const description = document.createElement("p");
        description.textContent =
            incident.description || "No description provided.";

        const status = document.createElement("p");
        status.textContent =
            `Status: ${incident.status || "Unknown"}`;

        card.append(heading, description, status);
        container.appendChild(card);
    });

} catch (error) {
    console.error("Failed to load incidents:", error);

    const container = document.getElementById("incidentsList");

    if (container) {
        container.textContent = "Could not load incidents. Please try again.";
    }
}


}


const locateButton = document.getElementById("locateBtn");

if (locateButton) {
locateButton.addEventListener("click", locateUser);
}

if (document.getElementById("incidentsList")) {
loadIncidents();
setInterval(loadIncidents, 10000);
}
