# DriveThruVisualizer

## 1. Overview

This document provides technical details and instructions for setting up and running the DriveThruVisualizer application. This application is designed to visualize lane data, including vertices and paths, transformed from real-world coordinates to a screen-displayable format. It leverages Angular's reactive programming capabilities for efficient data handling and display.

## 2. Key Features

* **Lane Visualization**: Renders complex lane geometries (vertices and paths) on a scalable viewport.
* **Dynamic Lane Loading**: Loads and displays different lanes based on route parameters, ensuring real-time updates without full page reloads.
* **Coordinate Transformation**: Automatically scales and positions real-world coordinate data to fit a specified viewport, handling Y-axis flipping for correct display.
* **Fade-in/Fade-out Transitions**: Provides visual cues during lane loading for a smoother user experience.
* **Service Point Labeling**: *(To be implemented/verified)* Displays `SERVICE_POINT` names next to markers for enhanced readability.

## 3. Technology Stack

* **Framework**: Angular (19.2.12)
* **Language**: TypeScript
* **Reactive Programming**: RxJS
* **Routing**: Angular Router
* **HTTP Client**: Angular HttpClient (configured via `provideHttpClient`)
* **Styling**: CSS/SCSS
* **Build Tool**: [Angular CLI](https://github.com/angular/angular-cli) version 19.2.12.


## 4. Setup and Local Development (Run Instructions)

### 4.1 Prerequisites

Ensure you have the following installed:

* **Node.js**: Version 18.x or higher
* **npm**: Comes with Node.js
* **Angular CLI**: Install globally via:

```bash
npm install -g @angular/cli
```

### 4.2 Installation Steps

Clone the repository:

```bash
git clone https://github.com/sarangasony/drive-thru-visualizer.git
cd drive-thru-visualizer
```

Install dependencies:

```bash
npm install
```

### 4.3 Running the Application Locally

Start the development server:

```bash
ng start
```

Then open your browser at `http://localhost:4200/`. The app will auto-reload upon source changes.

### 4.4 Running Tests

* Run unit tests (Karma):

```bash
ng test
```

* Run end-to-end tests (e.g., Cypress or Playwright if configured):

```bash
ng e2e
```

## 5. Building for Production

To compile the app for production:

```bash
ng build --configuration production
```

## 6. Deployment Notes

* Ensure production builds are served properly.
* Configure proper API base URLs via `environment.ts`.
* Use HTTPS in production.

