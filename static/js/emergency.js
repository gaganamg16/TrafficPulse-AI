let emergencyRoutes = [];
let emergencyRouteLayers = [];

const emergencyButton = document.getElementById("routeBtn");

if (emergencyButton) {
    emergencyButton.addEventListener("click", function () {
        findEmergencyRoutes();
    });
}

async function emergencyGeocode(place) {
const url = new URL(
"https://nominatim.openstreetmap.org/search"
);

url.search = new URLSearchParams({
    q: `${place}, Karnataka, India`,
    format: "jsonv2",
    countrycodes: "in",
    limit: "1"
});

const response = await fetch(url);

if (!response.ok) {
    throw new Error("Location search failed. Please try again.");
}

const results = await response.json();

if (!results.length) {
    throw new Error(
        `Could not find "${place}". Try a different location name.`
    );
}

return {
    latitude: Number(results[0].lat),
    longitude: Number(results[0].lon),
    name: results[0].display_name
};


}

async function findEmergencyRoutes() {
const startText =
document.getElementById("startLocation").value.trim();


const destinationText =
    document.getElementById("destination").value.trim();

const message = document.getElementById("message");
const routesList = document.getElementById("routesList");

if (!startText || !destinationText) {
    message.textContent =
        "Enter both the ambulance location and hospital destination.";
    return;
}

emergencyButton.disabled = true;
routesList.replaceChildren();
message.textContent = "Locating the ambulance and hospital...";

try {
    const start = await emergencyGeocode(startText);
    const destination = await emergencyGeocode(destinationText);

    message.textContent = "Calculating emergency driving routes...";

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
        throw new Error(
            result.error || "Emergency route calculation failed."
        );
    }

    if (!result.routes || result.routes.length === 0) {
        throw new Error("No driving routes were returned.");
    }

    emergencyRoutes = result.routes.slice().sort(
        (a, b) =>
            Number(a.simulated_eta_minutes ?? a.duration_minutes) -
            Number(b.simulated_eta_minutes ?? b.duration_minutes)
    );

    emergencyRouteLayers.forEach(layer => map.removeLayer(layer));
    emergencyRouteLayers = [];

    const colors = ["#16a34a", "#2563eb", "#9333ea", "#ea580c"];
    const boundsLayers = [];

    emergencyRoutes.forEach((route, index) => {
        const layer = L.geoJSON(route.geometry, {
            style: {
                color: colors[index % colors.length],
                weight: index === 0 ? 8 : 5,
                opacity: index === 0 ? 1 : 0.7
            }
        }).addTo(map);

        emergencyRouteLayers.push(layer);
        boundsLayers.push(layer);

        layer.bindPopup(
            `Route ${index + 1}<br>` +
            `Distance: ${route.distance_km} km<br>` +
            `Estimated time: ${
                route.simulated_eta_minutes ??
                route.duration_minutes
            } minutes`
        );

        const card = document.createElement("div");
        card.className =
            index === 0 ? "route-card selected" : "route-card";

        const title = document.createElement("h4");
        title.textContent = index === 0
            ? "Ambulance recommended route"
            : `Alternative route ${index + 1}`;

        const distance = document.createElement("p");
        distance.textContent =
            `Distance: ${route.distance_km} km`;

        const duration = document.createElement("p");
        duration.textContent =
            `Estimated driving time: ${
                route.simulated_eta_minutes ??
                route.duration_minutes
            } minutes`;

        const selectButton = document.createElement("button");
        selectButton.textContent =
            index === 0 ? "Selected route" : "Select route";

        selectButton.addEventListener("click", () => {
            emergencyRouteLayers.forEach((routeLayer, layerIndex) => {
                routeLayer.setStyle({
                    weight: layerIndex === index ? 8 : 5,
                    opacity: layerIndex === index ? 1 : 0.7
                });
            });

            document.querySelectorAll(".route-card").forEach(
                (routeCard, cardIndex) => {
                    routeCard.classList.toggle(
                        "selected",
                        cardIndex === index
                    );
                });

            layer.openPopup();
        });

        card.append(title, distance, duration, selectButton);
        routesList.appendChild(card);
    });

    if (boundsLayers.length > 0) {
        map.fitBounds(
            L.featureGroup(boundsLayers).getBounds(),
            { padding: [25, 25] }
        );
    }

    message.textContent =
        "Emergency routes calculated. Travel times are estimates; " +
        "traffic factors may be simulated, not live.";

} catch (error) {
    console.error("Emergency routing error:", error);
    message.textContent = error.message;
} finally {
    emergencyButton.disabled = false;
}


}
