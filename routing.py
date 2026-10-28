
import os
import requests
from dotenv import load_dotenv

load_dotenv()

GRAPHHOPPER_API_KEY = os.getenv("GRAPHHOPPER_API_KEY")
GRAPHHOPPER_URL = "https://graphhopper.com/api/1/route"


def calculate_routes(start_lat, start_lon, dest_lat, dest_lon):
    if not GRAPHHOPPER_API_KEY:
        raise RuntimeError(
            "GraphHopper API key is missing. Check your .env file."
        )

    params = [
        ("point", f"{start_lat},{start_lon}"),
        ("point", f"{dest_lat},{dest_lon}"),
        ("profile", "car"),
        ("points_encoded", "false"),
        ("instructions", "false"),
        ("key", GRAPHHOPPER_API_KEY),
        ("algorithm", "alternative_route"),
        ("alternative_route.max_paths", "3"),
        ("alternative_route.max_weight_factor", "1.4"),
        ("alternative_route.max_share_factor", "0.6"),
    ]

    response = requests.get(
        GRAPHHOPPER_URL,
        params=params,
        timeout=30
    )

    if not response.ok:
        print("GraphHopper status:", response.status_code)
        print("GraphHopper response:", response.text[:1000])
        response.raise_for_status()

    data = response.json()
    paths = data.get("paths", [])

    if not paths:
        raise ValueError(
            data.get("message", "GraphHopper returned no routes.")
        )

    routes = []

    for index, path in enumerate(paths, start=1):
        coordinates = path.get("points", {}).get("coordinates", [])

        if not coordinates:
            continue

        routes.append({
            "route_number": index,
            "distance_km": round(path["distance"] / 1000, 2),
            "duration_minutes": round(path["time"] / 60000),
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates
            }
        })

    if not routes:
        raise ValueError("No route geometry was returned.")

    routes.sort(key=lambda route: route["duration_minutes"])

    for index, route in enumerate(routes, start=1):
        route["route_number"] = index

    print("Routing provider: GraphHopper")
    print("Number of routes returned:", len(routes))

    for route in routes:
        print(
            f"Route {route['route_number']}: "
            f"{route['distance_km']} km, "
            f"{route['duration_minutes']} minutes"
        )

    return {
        "routes": routes,
        "source": "GraphHopper",
        "traffic_note": "Travel times are estimates, not live traffic data."
    }
