import random


def simulate_traffic(routes):
    """
    Generate DEMO-ONLY congestion factors.
    These values are simulated, not real traffic measurements.
    """

    results = []

    for route in routes:
        factor = random.uniform(1.0, 1.6)

        estimated_minutes = round(
            route["duration_minutes"] * factor
        )

        results.append({
            **route,
            "simulated_congestion_factor": round(factor, 2),
            "simulated_eta_minutes": estimated_minutes,
            "traffic_source": "SIMULATED DEMO DATA"
        })

    return sorted(
        results,
        key=lambda route: route["simulated_eta_minutes"]
    )