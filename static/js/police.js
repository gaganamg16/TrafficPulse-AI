const incidentForm = document.getElementById("incidentForm");
const policeMessage = document.getElementById("policeMessage");
const reportButton = document.getElementById("reportButton");
const refreshButton = document.getElementById("refreshButton");

function showPoliceMessage(message, isError = false) {
policeMessage.textContent = message;
policeMessage.style.color = isError ? "#b42318" : "#087f5b";
}

async function geocodeIncidentLocation(place) {
const queries = [
`${place}, Karnataka, India`,
`${place}, India`,
place
];


for (const query of queries) {
    const url = new URL(
        "https://nominatim.openstreetmap.org/search"
    );

    url.search = new URLSearchParams({
        q: query,
        format: "jsonv2",
        countrycodes: "in",
        limit: "1"
    });

    try {
        const response = await fetch(url);

        if (!response.ok) {
            continue;
        }

        const results = await response.json();

        if (results.length > 0) {
            return {
                latitude: Number(results[0].lat),
                longitude: Number(results[0].lon),
                name: results[0].display_name
            };
        }
    } catch (error) {
        console.error("Location search attempt failed:", error);
    }
}

throw new Error(
    `Could not find "${place}". Try a nearby town, landmark, or hospital name.`
);


}

async function loadPoliceIncidents() {
try {
const response = await fetch("/api/incidents");


    if (!response.ok) {
        throw new Error("Could not load incidents.");
    }

    const incidents = await response.json();

    const list = document.getElementById("incidentsList");
    list.replaceChildren();

    document.getElementById("totalCount").textContent =
        incidents.length;

    document.getElementById("activeCount").textContent =
        incidents.filter(
            incident => incident.status !== "resolved"
        ).length;

    document.getElementById("resolvedCount").textContent =
        incidents.filter(
            incident => incident.status === "resolved"
        ).length;

    if (incidents.length === 0) {
        list.textContent = "No incidents reported yet.";
        return;
    }

    incidents.forEach(incident => {
        const card = document.createElement("article");
        card.className = "incident-card";

        const title = document.createElement("h3");
        title.textContent =
            `${incident.type || "Incident"} #${incident.id}`;

        const severity = document.createElement("p");
        severity.className = "severity";
        severity.textContent =
            `Severity: ${incident.severity}`;

        const description = document.createElement("p");
        description.textContent =
            incident.description || "No description provided.";

        const coordinates = document.createElement("p");
        coordinates.textContent =
            `Coordinates: ${Number(incident.latitude).toFixed(5)}, ` +
            `${Number(incident.longitude).toFixed(5)}`;

        const statusLabel = document.createElement("span");
        statusLabel.className = "status-label";
        statusLabel.textContent =
            `Status: ${incident.status}`;

        const statusSelect = document.createElement("select");
        statusSelect.setAttribute(
            "aria-label",
            `Update status of incident ${incident.id}`
        );

        const statuses = [
            ["reported", "Reported"],
            ["in_progress", "In Progress"],
            ["resolved", "Resolved"]
        ];

        statuses.forEach(([value, label]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            statusSelect.appendChild(option);
        });

        statusSelect.value = incident.status;

        const updateButton = document.createElement("button");
        updateButton.type = "button";
        updateButton.textContent = "Update Status";

        updateButton.addEventListener("click", async () => {
            updateButton.disabled = true;

            try {
                const updateResponse = await fetch(
                    `/api/incidents/${incident.id}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            status: statusSelect.value
                        })
                    }
                );

                const result = await updateResponse.json();

                if (!updateResponse.ok) {
                    throw new Error(
                        result.error || "Could not update status."
                    );
                }

                showPoliceMessage(
                    `Incident #${incident.id} status updated.`
                );

                await loadPoliceIncidents();
            } catch (error) {
                showPoliceMessage(error.message, true);
            } finally {
                updateButton.disabled = false;
            }
        });

        card.append(
            title,
            severity,
            description,
            coordinates,
            statusLabel,
            document.createElement("br"),
            statusSelect,
            updateButton
        );

        list.appendChild(card);
    });

} catch (error) {
    console.error("Police incident loading error:", error);

    document.getElementById("incidentsList").textContent =
        "Could not load incidents. Check that Flask is running.";

    showPoliceMessage(error.message, true);
}


}

incidentForm.addEventListener("submit", async event => {
event.preventDefault();


reportButton.disabled = true;

try {
    const type =
        document.getElementById("incidentType").value;

    const locationText =
        document.getElementById("incidentLocation").value.trim();

    const severity =
        document.getElementById("severity").value;

    const description =
        document.getElementById("description").value.trim();

    if (!locationText || !description) {
        throw new Error("Please fill in all the fields.");
    }

    showPoliceMessage("Finding the incident location...");

    const location =
        await geocodeIncidentLocation(locationText);

    showPoliceMessage("Saving incident report...");

    const response = await fetch("/api/incidents", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            type,
            latitude: location.latitude,
            longitude: location.longitude,
            severity,
            description
        })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error || "Could not save the incident."
        );
    }

    incidentForm.reset();

    showPoliceMessage(
        `Incident #${result.id} reported successfully.`
    );

    if (typeof setStartMarker === "function") {
        // Keep existing map markers and center the map on the incident.
        map.setView(
            [location.latitude, location.longitude],
            15
        );
    }

    await loadPoliceIncidents();

} catch (error) {
    console.error("Incident reporting error:", error);
    showPoliceMessage(error.message, true);
} finally {
    reportButton.disabled = false;
}


});

refreshButton.addEventListener("click", loadPoliceIncidents);

loadPoliceIncidents();

setInterval(loadPoliceIncidents, 15000);
