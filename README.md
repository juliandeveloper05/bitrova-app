# 📋 Task List App

> **Version 2.2** - Recurring Tasks Update

A modern, feature-rich task management application built with React Native and Expo. Designed with premium glassmorphism aesthetics and a focus on user experience.

![Status](https://img.shields.io/badge/status-active-success)
![React Native](https://img.shields.io/badge/React%20Native-0.76.6-blue)
![Expo](https://img.shields.io/badge/Expo-~52.0-000020?logo=expo)

## ✨ Key Features

### 🎨 Design & UI
- **Glassmorphism Design** - Modern frosted glass aesthetic with blur effects
- **Dark/Light Theme** - Seamless theme switching with persistent preference
- **Smooth Animations** - Powered by React Native Reanimated for 60fps interactions
- **Responsive Layout** - Optimized for iOS, Android, and Web platforms

### 📝 Task Management
- **Smart Categories** - Organize tasks by Work, Personal, Shopping, Health
- **Priority Levels** - High, Medium, Low priority with visual indicators
- **Due Dates** - Set deadlines with calendar picker and overdue alerts
- **Quick Actions** - Swipe-to-delete gesture for efficient task removal
- **Completion Tracking** - Toggle tasks with animated checkboxes

### 🔄 Recurring Tasks (NEW!)
- **Flexible Patterns** - Daily, Weekly, Monthly, or Custom recurrence
- **Day Selection** - Choose specific days of the week for weekly tasks
- **Frequency Control** - Set "every X days/weeks/months"
- **Series Management** - View and manage all instances of a recurring series
- **Scoped Actions** - Edit/delete single instance, future, or entire series
- **Skip Instances** - Skip individual occurrences without deleting
- **Auto-Generation** - Instances generated automatically for next 30 days
- **Smart Notifications** - Automatic notification scheduling per instance
- **Statistics** - Completion rate and breakdown in stats screen

### ✏️ Advanced Editing
- **Unsaved Changes Protection** - Modal confirmation when navigating away
- **Field Validation** - Real-time title validation with error feedback
- **Save State Indicator** - Visual feedback (saving, success, error)
- **Description/Notes** - Multiline text with 500 character counter
- **Inline Subtask Editing** - Double-tap to edit subtasks inline
- **Drag & Drop Subtasks** - Long-press and drag to reorder
- **Undo/Redo** - Header buttons + keyboard shortcuts (Ctrl+Z/Y)
- **Auto-Save** - Optional debounced auto-save (configurable in settings)
- **Modification History** - "Modified X ago" timestamp display

### 📋 Subtasks
- **Nested Tasks** - Break down tasks into manageable subtasks
- **Progress Tracking** - Visual progress bar for subtask completion
- **Inline Editing** - Double-tap to edit, Enter to save
- **Reorderable** - Drag and drop to reorganize

### 🔔 Notifications
- **Local Reminders** - Get notified at 9:00 AM on task due dates
- **Smart Scheduling** - Automatic notification management
- **Permission Handling** - Graceful permission requests

### 🔍 Search & Filter
- **Real-time Search** - Find tasks instantly by title
- **Category Filters** - View tasks by specific categories
- **Completion Status** - Separate views for pending and completed

### 📊 Statistics
- **Progress Tracking** - Visual completion rate with circular indicator
- **Task Analytics** - Overview of completed, pending, and urgent tasks
- **Category Insights** - Task distribution across categories
- **Recurring Stats** - Series count, completion rate, and instance breakdown

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React Native | Cross-platform framework |
| Expo (v52) | Development toolchain |
| Expo Router | File-based navigation |
| React Context | State management |
| Reanimated 3 | Animations |
| Gesture Handler | Touch gestures |
| AsyncStorage | Persistent storage |
| Expo Notifications | Local reminders |

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/juliandeveloper05/tasklist-app.git

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

## 📁 Project Structure

```
tasklist-app/
├── app/                      # Expo Router screens
│   ├── index.js             # Home screen
│   ├── add-task.js          # Add task modal
│   ├── task-details.js      # Task details & editing
│   └── settings.js          # App settings
├── components/              # Reusable components
│   ├── TaskCard.js          # Task item card
│   ├── SubtaskItem.js       # Subtask with inline edit
│   ├── DraggableSubtaskList.js # Drag & drop subtasks
│   ├── DiscardChangesModal.js  # Unsaved changes modal
│   ├── SaveIndicator.js     # Save state feedback
│   ├── TaskDescriptionEditor.js # Notes editor
│   └── ...
├── context/                 # React Context providers
│   ├── TaskContext.js       # Task state & methods
│   └── ThemeContext.js      # Theme management
├── hooks/                   # Custom hooks
│   ├── useAutoSave.js       # Debounced auto-save
│   └── useHistory.js        # Undo/redo stack
├── utils/                   # Utilities
│   ├── storage.js           # AsyncStorage helpers
│   ├── notifications.js     # Notification service
│   └── dateHelpers.js       # Date formatting
└── constants/               # Configuration
    └── theme.js             # Design tokens
```

## 🗺️ Roadmap

### ✅ Phase 1: Core Features (Complete)
- [x] Basic task CRUD operations
- [x] Category system
- [x] Priority levels
- [x] Dark/Light theme
- [x] Local notifications
- [x] Search functionality
- [x] Task editing improvements
- [x] Subtasks support

### ✅ Phase 2: Enhanced Features (Complete)
- [x] Recurring tasks with patterns (daily, weekly, monthly, custom)
- [x] Series management (view, edit, delete with scope)
- [x] Skip/unskip instances
- [x] Recurring task statistics
- [ ] Attachments (images, files)
- [ ] Task sharing
- [ ] Export/Import data (JSON, CSV)
- [ ] Cloud backup integration

### 📋 Phase 3: Advanced Features (Planned)
- [ ] Collaboration features
- [ ] Calendar view
- [ ] Time tracking
- [ ] Productivity analytics
- [ ] Widgets support
- [ ] Voice input
- [ ] AI-powered suggestions

### 🎯 Phase 4: Polish & Optimization
- [ ] Performance optimizations
- [ ] Accessibility (WCAG compliance)
- [ ] Comprehensive testing
- [ ] Internationalization (i18n)
- [ ] App Store deployment

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Julian Javier Soto**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/full-stack-julian-soto/)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=flat&logo=instagram&logoColor=white)](https://www.instagram.com/palee_0x71/?hl=es-la)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/juliandeveloper05)

---

⭐ If you found this project interesting, feel free to star it!