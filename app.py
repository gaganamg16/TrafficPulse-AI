from ai_assistant import ask_gemini
from flask import Flask, render_template, request, jsonify
from routing import calculate_routes
from database import init_db, get_incidents, add_incident, update_incident
from traffic_engine import simulate_traffic

app = Flask(__name__)

init_db()


# ---------------- PAGES ----------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/emergency")
def emergency():
    return render_template("emergency.html")


@app.route("/police")
def police():
    return render_template("police.html")


# ---------------- ROUTING API ----------------

@app.route("/api/routes", methods=["POST"])
def routes():
    data = request.get_json(silent=True) or {}

    try:
        start = data["start"]
        destination = data["destination"]

        start_lat = float(start["latitude"])
        start_lon = float(start["longitude"])
        dest_lat = float(destination["latitude"])
        dest_lon = float(destination["longitude"])

        for lat, lon in [
            (start_lat, start_lon),
            (dest_lat, dest_lon)
        ]:
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                raise ValueError("Coordinates out of range")

    except (KeyError, TypeError, ValueError):
        return jsonify({
            "error": "Provide valid start and destination coordinates"
        }), 400

    try:
        result = calculate_routes(
            start_lat, start_lon, dest_lat, dest_lon
        )

        result["routes"] = simulate_traffic(result["routes"])
        result["traffic_note"] = (
            "Traffic factors and adjusted ETAs are simulated demo data. "
            "They do not represent live traffic."
        )

        return jsonify(result)

    except Exception as e:
        app.logger.exception("Gemini assistant request failed")
        return jsonify({
            "error": f"{type(e).__name__}: {str(e)[:500]}" 
        }), 502


# ---------------- INCIDENT API ----------------

@app.route("/api/incidents", methods=["GET"])
def incidents_list():
    return jsonify(get_incidents())


@app.route("/api/incidents", methods=["POST"])
def incidents_create():
    data = request.get_json(silent=True) or {}

    required = [
        "type", "latitude", "longitude",
        "severity", "description"
    ]

    if any(field not in data for field in required):
        return jsonify({
            "error": "Missing required incident fields"
        }), 400

    try:
        latitude = float(data["latitude"])
        longitude = float(data["longitude"])
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid coordinates"}), 400

    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        return jsonify({"error": "Coordinates are out of range"}), 400

    if data["severity"] not in ["low", "medium", "high", "critical"]:
        return jsonify({"error": "Invalid severity"}), 400

    incident = {
        "type": str(data["type"]),
        "latitude": latitude,
        "longitude": longitude,
        "severity": data["severity"],
        "description": str(data["description"]),
        "status": "reported"
    }

    new_id = add_incident(incident)

    return jsonify({
        "message": "Incident reported successfully",
        "id": new_id,
        "incident": incident
    }), 201


@app.route("/api/incidents/<int:incident_id>", methods=["PATCH"])
def incidents_update(incident_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")

    if status not in ["reported", "in_progress", "resolved"]:
        return jsonify({"error": "Invalid incident status"}), 400

    success = update_incident(incident_id, status)

    if not success:
        return jsonify({"error": "Incident not found"}), 404

    return jsonify({"message": "Incident status updated"})

# ---------------- GEMINI AI ASSISTANT ----------------

@app.route("/api/assistant", methods=["POST"])
def ai_assistant():
    data = request.get_json(silent=True) or {}

    question = data.get("message", "")

    if not isinstance(question, str) or not question.strip():
        return jsonify({
            "error": "Please enter a question."
        }), 400

    if len(question) > 2000:
        return jsonify({
            "error": "Please keep your question under 2000 characters."
        }), 400

    try:
        # Supply the current incident data to the AI.
        incidents = get_incidents()

        # Do not send unnecessary database fields to the AI.
        safe_incidents = []

        for incident in incidents:
            safe_incidents.append({
                "type": incident.get("type"),
                "latitude": incident.get("latitude"),
                "longitude": incident.get("longitude"),
                "severity": incident.get("severity"),
                "description": incident.get("description"),
                "status": incident.get("status"),
            })

        answer = ask_gemini(
            question=question.strip(),
            incidents=safe_incidents,
        )

        return jsonify({
            "answer": answer
        })

    except Exception:
        app.logger.exception("Gemini assistant request failed")

        return jsonify({
            "error": (
                "The AI assistant could not respond. "
                "Check your API key, model access, and internet connection."
            )
        }), 502
# ---------------- START APPLICATION ----------------

if __name__ == "__main__":
    app.run(debug=True)

@app.route("/api/assistant", methods=["POST"])
def ai_assistant_api():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")

    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "Please enter a message."}), 400

    try:
        answer = ask_gemini(message.strip())
        return jsonify({"answer": answer})

    except Exception:
        app.logger.exception("AI assistant error")
        return jsonify({
            "error": "The AI assistant failed. Check the VS Code terminal for details."
        }), 500