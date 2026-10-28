
def ask_gemini(question, incidents=None):
    question = question.lower().strip()

    if not question:
        return "Please enter a question."

    if any(word in question for word in ["hello", "hi", "hey"]):
        return (
            "Hello! I am TrafficPulse AI. "
            "I can help you with route planning, traffic incidents, "
            "road safety, and emergency guidance."
        )

    if any(word in question for word in ["ambulance", "emergency", "112"]):
        return (
            "If there is a medical or road emergency in India, call 112. "
            "Give the operator your location and explain the situation. "
            "TrafficPulse AI can provide guidance, but it cannot dispatch "
            "an ambulance unless an actual dispatch service is connected."
        )

    if any(word in question for word in ["accident", "crash", "collision"]):
        return (
            "If you encounter an accident, keep a safe distance, "
            "avoid blocking emergency vehicles, and contact emergency "
            "services if anyone is injured. In India, call 112 for "
            "emergency assistance. Do not put yourself in danger."
        )

    if any(word in question for word in ["police", "traffic officer"]):
        return (
            "TrafficPulse AI can help explain reported incidents and "
            "traffic-management options. Traffic police should verify "
            "reports and coordinate their response through official channels."
        )

    if any(word in question for word in ["route", "destination", "navigate"]):
        return (
            "Enter your starting point and destination on the TrafficPulse "
            "map, then use the route-planning feature. Check the displayed "
            "route before travelling. I cannot confirm live congestion "
            "unless live traffic data is connected."
        )

    if any(word in question for word in ["traffic", "congestion", "jam", "busy road"]):
        return (
            "To manage congestion, check reported incidents on the map, "
            "consider an available alternative route, and follow traffic "
            "signs and police instructions. Reported or simulated incidents "
            "may not represent current road conditions."
        )

    if any(word in question for word in ["flood", "waterlogged", "heavy rain"]):
        return (
            "Avoid driving through flooded roads because water depth and "
            "road damage can be difficult to judge. Follow official warnings "
            "and choose a safe alternative route."
        )

    if any(word in question for word in ["feature", "what can you do", "about trafficpulse"]):
        return (
            "TrafficPulse AI is designed to support route planning, "
            "traffic-incident awareness, road safety, and emergency guidance. "
            "Available functions depend on the features actually connected "
            "to your application."
        )

    return (
        "I can help with route planning, traffic congestion, reported "
        "incidents, road safety, ambulance emergencies, and traffic police. "
        "Try asking: 'How can I find an alternative route?'"
    )

