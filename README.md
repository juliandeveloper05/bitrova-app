# 📋 Task List App

> ⚠️ **Work in Progress** - This project is currently under active development

A modern, feature-rich task management application built with React Native and Expo. Designed with premium glassmorphism aesthetics and a focus on user experience.

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![React Native](https://img.shields.io/badge/React%20Native-0.76.6-blue)
![Expo](https://img.shields.io/badge/Expo-~52.0-000020?logo=expo)

## ✨ Key Features

### 🎨 Design & UI
- **Glassmorphism Design** - Modern frosted glass aesthetic with blur effects
- **Dark/Light Theme** - Seamless theme switching with persistent user preference
- **Smooth Animations** - Powered by React Native Reanimated for 60fps interactions
- **Responsive Layout** - Optimized for iOS, Android, and Web platforms

### 📝 Task Management
- **Smart Categories** - Organize tasks by Work, Personal, Shopping, Health, or custom categories
- **Priority Levels** - High, Medium, Low priority with visual indicators
- **Due Dates** - Set deadlines with calendar picker and overdue alerts
- **Quick Actions** - Swipe-to-delete gesture for efficient task removal
- **Completion Tracking** - Toggle tasks with animated checkboxes

### 🔔 Notifications
- **Local Reminders** - Get notified at 9:00 AM on task due dates
- **Smart Scheduling** - Automatic notification management for incomplete tasks
- **Permission Handling** - Graceful permission requests for iOS and Android

### 🔍 Search & Filter
- **Real-time Search** - Find tasks instantly by title or description
- **Category Filters** - View tasks by specific categories
- **Completion Status** - Separate views for pending and completed tasks

### 📊 Statistics
- **Progress Tracking** - Visual completion rate with circular progress indicator
- **Task Analytics** - Quick overview of completed, pending, and urgent tasks
- **Category Insights** - See task distribution across categories

## 🛠️ Tech Stack

- **Framework:** React Native with Expo
- **Navigation:** Expo Router (file-based routing)
- **State Management:** React Context API
- **Animations:** React Native Reanimated 3
- **Gestures:** React Native Gesture Handler
- **Storage:** AsyncStorage for persistent data
- **Notifications:** Expo Notifications
- **UI Components:** Custom components with Ionicons

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tasklist-app.git

# Navigate to project directory
cd tasklist-app

# Install dependencies
npm install

# Start the development server
npx expo start
```

## 🚀 Running the App

```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Web Browser
npx expo start --web
```

## 📱 Project Structure

```
tasklist-app/
├── app/                    # Expo Router screens
│   ├── index.js           # Home screen
│   ├── add-task.js        # Add task modal
│   ├── task-details.js    # Task details screen
│   └── settings.js        # Settings screen
├── components/            # Reusable components
│   ├── TaskCard.js        # Task item component
│   ├── CategoryFilter.js  # Category chips
│   ├── StatsWidget.js     # Statistics display
│   └── ...
├── context/               # React Context providers
│   ├── TaskContext.js     # Task state management
│   └── ThemeContext.js    # Theme management
├── utils/                 # Utility functions
│   ├── storage.js         # AsyncStorage helpers
│   └── notifications.js   # Notification service
└── constants/             # Theme and configuration
    └── theme.js           # Design tokens
```

## 🗺️ Roadmap

### Phase 1: Core Features (In Progress)
- [x] Basic task CRUD operations
- [x] Category system
- [x] Priority levels
- [x] Dark/Light theme
- [x] Local notifications
- [x] Search functionality
- [ ] Task editing improvements
- [ ] Better error handling

### Phase 2: Enhanced Features (Planned)
- [ ] Recurring tasks
- [ ] Subtasks support
- [ ] Task notes/descriptions
- [ ] Attachments (images, files)
- [ ] Task sharing
- [ ] Export/Import data (JSON, CSV)
- [ ] Cloud backup integration

### Phase 3: Advanced Features (Future)
- [ ] Collaboration features
- [ ] Calendar view
- [ ] Time tracking
- [ ] Productivity analytics
- [ ] Widgets support
- [ ] Voice input
- [ ] AI-powered suggestions

### Phase 4: Polish & Optimization
- [ ] Performance optimizations
- [ ] Accessibility improvements (WCAG compliance)
- [ ] Comprehensive testing suite
- [ ] Internationalization (i18n)
- [ ] App Store deployment

## 🎯 Current Focus

Right now, I'm working on:
1. **Notification System** - Refining the reminder scheduling logic
2. **Task Editing** - Improving the edit task flow
3. **Data Persistence** - Ensuring all changes are properly saved
4. **Bug Fixes** - Addressing known issues in the issue tracker

## 🐛 Known Issues

- [ ] Date picker modal doesn't close properly on Android in some cases
- [ ] Notification permissions need better error messages
- [ ] Search bar keyboard doesn't dismiss on scroll
- [ ] Theme toggle animation could be smoother

## 🤝 Contributing

This is a personal learning project, but I'm open to suggestions! Feel free to:
- Open an issue to report bugs
- Suggest new features
- Share feedback on the code structure

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Julian Javier Soto**

- LinkedIn: [linkedin.com/in/full-stack-julian-soto](https://www.linkedin.com/in/full-stack-julian-soto/)
- Instagram: [@palee_0x71](https://www.instagram.com/palee_0x71/?hl=es-la)
- GitHub: [@juliandeveloper05](https://github.com/juliandeveloper05)

---

⭐ If you found this project interesting, feel free to star it!

**Note:** This app is under active development. Features and implementation details are subject to change.