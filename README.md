# NucleonTime

Build your schedule like puzzles! NucleonTime is a personal time planner and social scheduling application designed to help you manage your time effectively while incorporating gamification and social features.

## Features

- **Puzzle-like Scheduling:** Build your daily schedule using drag-and-drop time blocks, categorizing activities like Sleep, School/Work, Exercise, and more.
- **Analytics Dashboard:** Visualize your time allocation with detailed analytics, including pie charts and personal categorization based on your daily routine.
- **Gamification & Points:** Earn points by completing tasks and interacting with the app. Unlock achievements, build your profile level, and maintain streaks.
- **Virtual Economy & Business:** Manage a virtual business, grow a sapling into a golden apple tree, and earn in-game currency.
- **Social & Chat:** Connect with friends, share your schedule, and chat directly within the application.
- **Authentication:** Secure Google Sign-In integration powered by Firebase Authentication to save your progress across devices.

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, and JavaScript (ES6+).
- **Backend/Database:** Firebase Firestore (NoSQL database).
- **Authentication:** Firebase Auth (Google Sign-in).
- **Architecture:** Modular JavaScript components dynamically rendering HTML elements, relying on custom DOM events and `localStorage` for state management and view navigation.

## Setup & Installation

NucleonTime is a static frontend application that can be run easily on a local development server.

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Start a local development server:
   ```bash
   python3 -m http.server 8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Project Structure

- `index.html`: The main entry point of the application, containing the login screen and the main app shell.
- `styles.css`: The primary stylesheet containing all CSS variables, layouts, and component styles.
- `js/`: Contains all JavaScript modules:
  - `state.js`: Manages global application state, categories, points, and localStorage persistence.
  - `auth.js`: Handles Firebase authentication and user sessions.
  - `blocks.js`: Logic for managing time blocks and puzzle-like scheduling.
  - `analytics.js`: Generates charts and insights based on your schedule.
  - `chat.js`: Messaging and social features.
  - `business.js` & `currency.js`: Manages the virtual economy and business mechanics.
  - `points.js`: Gamification, task management, and point distribution.
  - `ui.js`: General UI rendering, profile management, and navigation logic.
  - `categories.js`: Definitions for schedule categories.

## Contributing

Guidelines for contributing to NucleonTime.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License.
