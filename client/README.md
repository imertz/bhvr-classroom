# Classroom Management System - Client

A modern React-based client application for the Classroom Management System.

## Features

The client application provides a complete interface for managing all aspects of a classroom:

### Core Management
- **Teachers**: Manage teacher profiles, information, and assignments
- **Students**: Handle student registration, profiles, and academic records
- **Classes**: Create and manage class schedules, subjects, and room assignments

### Academic Features
- **Assignments**: Create assignments with due dates, point values, and descriptions
- **Submissions**: Track student assignment submissions with status tracking
- **Grades**: Manage grading with feedback and automatic percentage calculations
- **Announcements**: Create and manage class announcements with expiration dates

### Administrative Features
- **Enrollments**: Manage student enrollments in classes with status tracking
- **Attendance**: Record and track student attendance with multiple status options

## Technology Stack

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Radix UI** - Accessible component primitives

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or
   bun run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Environment Configuration

Create a `.env` file in the client directory:

```env
VITE_SERVER_URL=http://localhost:3000
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, etc.)
│   ├── Layout.tsx      # Main layout wrapper
│   └── Navigation.tsx  # Navigation bar
├── pages/              # Page components
│   ├── HomePage.tsx    # Dashboard overview
│   ├── TeachersPage.tsx
│   ├── StudentsPage.tsx
│   ├── ClassesPage.tsx
│   ├── AssignmentsPage.tsx
│   ├── AnnouncementsPage.tsx
│   ├── SubmissionsPage.tsx
│   ├── EnrollmentsPage.tsx
│   ├── AttendancePage.tsx
│   └── GradesPage.tsx
├── stores/             # Zustand state management
│   ├── teacherStore.ts
│   ├── studentStore.ts
│   ├── classStore.ts
│   ├── assignmentStore.ts
│   ├── announcementStore.ts
│   ├── submissionStore.ts
│   ├── enrollmentStore.ts
│   ├── attendanceStore.ts
│   ├── gradeStore.ts
│   └── types.ts        # Store type definitions
└── lib/                # Utility functions
    └── utils.ts
```

## Key Features

### State Management
- Uses Zustand for efficient state management
- Each entity has its own store with CRUD operations
- Automatic error handling and loading states
- Type-safe API calls to the backend

### UI/UX
- Responsive design that works on all devices
- Consistent design system with Tailwind CSS
- Accessible components using Radix UI primitives
- Real-time feedback for user actions

### Data Relationships
- Smart relationship handling between entities
- Dropdown selectors with proper data fetching
- Automatic data refresh after mutations
- Efficient data caching and updates

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## API Integration

The client communicates with the backend server through RESTful APIs:

- Automatic API endpoint discovery based on environment
- Consistent error handling across all API calls
- Type-safe request/response handling using shared types
- Optimistic updates for better user experience

## Contributing

1. Follow the existing code structure and naming conventions
2. Use TypeScript for all new code
3. Ensure responsive design for all new components
4. Add proper error handling for API calls
5. Update this README for any new features
    ...reactDom.configs.recommended.rules,
  },
})
```
