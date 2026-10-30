# 🚦 TrafficPulse AI

### Smart City Traffic Assistance and Emergency Awareness Platform



---

## 📌 1. Project Overview

TrafficPulse AI is a smart-city web application designed to help citizens plan routes, view reported traffic incidents, and access traffic and road-safety guidance from a single dashboard.

The project aims to improve traffic awareness, support informed travel decisions, and demonstrate how technology can contribute to smarter urban mobility.

## ❗ 2. Problem Statement

Traffic congestion and road incidents can cause delays, disrupt daily travel, and affect emergency response.

Citizens may need to use different services to check routes, understand reported incidents, and obtain road-safety information.

TrafficPulse AI addresses this challenge by bringing route planning, incident awareness, and traffic assistance together in one web application.

## 💡 3. Proposed Solution

TrafficPulse AI provides an interactive dashboard where users can:

* View a map of their surrounding region.
* Enter a starting location and destination.
* View a route when the routing service is available.
* Check traffic incidents reported to the application.
* Ask a chatbot-style assistant questions about traffic and road safety.
* Receive general emergency guidance.

## ✨ 4. Key Features

### 🗺️ Interactive Map

Displays map information using Leaflet and OpenStreetMap.

### 🚗 Route Planning

Allows users to enter a starting point and destination and view an available route.

### 🚦 Traffic Incident Overview

Displays available incident information through the dashboard.

### 🤖 TrafficPulse AI Assistant

Provides predefined responses to common questions about:

* Route planning
* Traffic congestion
* Traffic incidents
* Road safety
* Emergency guidance
* Traffic police assistance

### 🚑 Emergency Awareness

Provides general emergency guidance. In India, users can call **112** for emergency assistance.

### 👮 Traffic Management Support

Demonstrates how route information and incident awareness could support citizens and traffic-management workflows.

## 🛠️ 5. Technologies Used

| Technology         | Purpose                            |
| ------------------ | ---------------------------------- |
| Python             | Backend programming                |
| Flask              | Web application and API            |
| HTML               | Web page structure                 |
| CSS                | User interface styling             |
| JavaScript         | Frontend interaction               |
| Leaflet            | Interactive maps                   |
| OpenStreetMap      | Map tiles                          |
| Routing API        | Route calculation, when configured |
| Visual Studio Code | Development environment            |

## 🏗️ 6. System Architecture

The application follows this general workflow:

1. The user interacts with the web dashboard.
2. The frontend sends requests to the Flask backend.
3. The backend processes supported requests.
4. The routing service provides route information when available.
5. The application displays available traffic incidents.
6. The chatbot returns guidance for supported questions.
7. Results are displayed on the dashboard.

**Workflow:**

User → Web Dashboard → Flask Backend → Routing and Incident Logic → Map and Chatbot Responses

## ⚙️ 7. Installation and Setup

### Prerequisites

Install the following:

* Python
* Visual Studio Code
* A modern web browser
* Internet connection for online map tiles and external services

### Step 1: Open the Project

Open the `TrafficPulse` project folder in Visual Studio Code.

### Step 2: Open the Terminal

In VS Code, select:

**Terminal → New Terminal**

### Step 3: Install Dependencies

If your project contains a `requirements.txt` file, run:

```bash
python -m pip install -r requirements.txt
```

If there is no requirements file, install the packages required by your project. For example:

```bash
python -m pip install flask requests
```

For the optional Gemini integration, install:

```bash
python -m pip install google-genai python-dotenv
```

### Step 4: Configure Environment Variables

If your application requires API keys, create a `.env` file in the project root.

Example:

```dotenv
GRAPHHOPPER_API_KEY=your_graphhopper_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Replace the example values with your own keys only if those services are used by your code.

**Security:** Never publish your real API keys or upload your `.env` file to GitHub.

### Step 5: Run the Application

In the VS Code terminal, execute:

```bash
python app.py
```

### Step 6: Open the Dashboard

Open your browser and visit:

http://127.0.0.1:5000/

Keep the terminal running while using the application.

To stop the server, press:

```text
Ctrl + C
```

## 🧪 8. Testing the Application

Use these checks before presenting the project:

1. Confirm that the dashboard loads.
2. Check that the map displays correctly.
3. Enter a starting location and destination.
4. Verify that route planning works.
5. Check whether incident information appears.
6. Open the TrafficPulse AI Assistant.
7. Test questions such as:

   * What can TrafficPulse AI do?
   * How can I find an alternative route?
   * What should I do if I encounter an accident?
   * How can I improve road safety?
   * What should I do if an ambulance is stuck in traffic?

## 🎯 9. Expected Benefits

* Makes route information easier to access.
* Improves awareness of reported traffic incidents.
* Provides basic road-safety guidance.
* Demonstrates a unified traffic-assistance dashboard.
* Provides a foundation for future smart-city improvements.

## ⚠️ 10. Current Limitations

* This is a hackathon prototype, not a production traffic-management system.
* Incident information may be simulated or limited to data available to the application.
* The current chatbot fallback uses predefined responses rather than a live generative AI model.
* External routing and map services may require an internet connection and may occasionally be unavailable.
* Live traffic prediction and verified ambulance or police dispatch are not guaranteed features of the current prototype.

## 🚀 11. Future Enhancements

* Integrate a reliable live traffic data source.
* Improve route recommendations using verified traffic conditions.
* Add validated citizen incident reporting.
* Integrate a generative AI assistant with robust error handling.
* Develop verified ambulance and traffic police workflows with authorized partners.
* Add user authentication and secure data management.
* Test the application with real users and measure its effectiveness.

## 👥 12. Team Details

**Team Name:** Twin Sparks
**Team ID:** MSC26
**Project:** TrafficPulse AI
**Domain:** Smart City

**Team Members:**

* Gagana M G
* Kala S P

## 📌 13. Disclaimer

TrafficPulse AI is an educational and hackathon prototype. It does not replace official traffic updates, professional judgment, or emergency services.

Do not assume an ambulance or police unit has been dispatched unless an authorized system confirms it. In India, call **112** for emergency assistance.

---

### Built by Team Twin Sparks 🚦

**TrafficPulse AI — Towards Safer and Smarter Urban Mobility**
