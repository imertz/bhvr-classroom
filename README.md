# Classroom Management System 🏫

![bhvr-classroom](https://cdn.stevedylan.dev/ipfs/bafybeievx27ar5qfqyqyud7kemnb5n2p4rzt2matogi6qttwkpxonqhra4)

A comprehensive full-stack classroom management system built with modern TypeScript technologies, featuring complete CRUD operations for all educational entities.

## Overview

This classroom management system provides a complete solution for educational institutions to manage teachers, students, classes, assignments, announcements, submissions, enrollments, attendance, and grades. Built as a type-safe monorepo with shared types between client and server.

## Features

### 🎯 Complete Educational Management
- **Teachers**: Manage teacher profiles, departments, and contact information
- **Students**: Handle student registration, profiles, and academic records
- **Classes**: Create and manage class schedules, subjects, and room assignments
- **Assignments**: Create assignments with due dates, point values, and detailed descriptions
- **Announcements**: Broadcast important information to classes with expiration dates
- **Submissions**: Track student assignment submissions with status monitoring
- **Enrollments**: Manage student enrollments in classes with status tracking
- **Attendance**: Record and track student attendance with multiple status options
- **Grades**: Comprehensive grading system with feedback and automatic calculations

### 🛠️ Technical Features
- **Full-Stack TypeScript**: End-to-end type safety between client and server
- **Shared Types**: Common type definitions ensure consistency across the entire application
- **Monorepo Structure**: Organized workspaces for easy development and deployment
- **Modern Stack**: Built with the latest technologies for performance and developer experience
- **RESTful API**: Well-structured API endpoints for all CRUD operations
- **Responsive UI**: Modern React interface that works on all devices
- **Real-time Updates**: Optimistic updates and automatic data refresh

## Technology Stack

### Backend
- [Bun](https://bun.sh) - Fast JavaScript runtime and package manager
- [Hono](https://hono.dev) - Lightweight and fast web framework
- [SQLite](https://sqlite.org) - Embedded database for data persistence
- [Zod](https://zod.dev) - TypeScript-first schema validation

### Frontend
- [React 19](https://react.dev) - Modern React with latest features
- [Vite](https://vitejs.dev) - Fast build tool and development server
- [TypeScript](https://typescriptlang.org) - Type-safe development
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Zustand](https://zustand.surge.sh) - Lightweight state management
- [React Router](https://reactrouter.com) - Client-side routing
- [Radix UI](https://radix-ui.com) - Accessible component primitives

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) installed on your system
- Node.js (for the client development)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd bhvr-classroom
   ```

2. Install dependencies for all workspaces:
   ```bash
   bun install
   ```

3. Start both client and server:
   ```bash
   # Option 1: Use VS Code tasks (Ctrl+Shift+P -> "Tasks: Run Task" -> "Start Both")
   
   # Option 2: Start manually in separate terminals
   # Terminal 1 - Server
   cd server && bun run dev
   
   # Terminal 2 - Client
   cd client && npm run dev
   ```

4. Open your browser:
   - Client: [http://localhost:5173](http://localhost:5173)
   - Server API: [http://localhost:3000](http://localhost:3000)

## Project Structure

```
.
├── client/               # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components for each entity
│   │   ├── stores/       # Zustand state management
│   │   └── lib/          # Utility functions
│   ├── public/           # Static assets
│   └── package.json      # Client dependencies
├── server/               # Hono backend API
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── db/           # Database setup and operations
│   │   └── middleware/   # Express-style middleware
│   └── package.json      # Server dependencies
├── shared/               # Shared TypeScript definitions
│   └── src/types/        # Type definitions for all entities
└── package.json          # Root workspace configuration
```

## API Endpoints

The server provides complete REST API coverage for all entities:

### Core Entities
- `GET|POST /teachers` - Manage teachers
- `GET|POST /students` - Manage students  
- `GET|POST /classes` - Manage classes
- `GET|POST /assignments` - Manage assignments
- `GET|POST /announcements` - Manage announcements
- `GET|POST /submissions` - Manage submissions
- `GET|POST /enrollments` - Manage enrollments
- `GET|POST /attendance` - Manage attendance records
- `GET|POST /grades` - Manage grades

### Individual Operations
Each entity supports full CRUD operations:
- `GET /{entity}/:id` - Get by ID
- `PUT /{entity}/:id` - Update by ID
- `DELETE /{entity}/:id` - Delete by ID

## Database Schema

The system uses SQLite with the following main entities:

- **Teachers**: Profile information, department, contact details
- **Students**: Personal information, enrollment status, contact details
- **Classes**: Course information, schedule, teacher assignment
- **Assignments**: Title, description, due dates, point values
- **Announcements**: Class communications with expiration
- **Submissions**: Student work submissions with status tracking
- **Enrollments**: Student-class relationships with status
- **Attendance**: Daily attendance records with status options
- **Grades**: Assignment grades with feedback and scoring

## Getting Started - Usage Flow

### For Administrators
1. **Setup Teachers**: Add teacher profiles to the system
2. **Create Classes**: Set up classes and assign teachers
3. **Add Students**: Register students in the system
4. **Manage Enrollments**: Enroll students in appropriate classes

### For Teachers
1. **Create Assignments**: Set up assignments with due dates and point values
2. **Make Announcements**: Communicate important information to students
3. **Track Submissions**: Monitor student assignment submissions
4. **Record Attendance**: Track daily student attendance
5. **Grade Work**: Evaluate submissions and provide feedback

## Development

### Adding New Features
1. **Types**: Add new types in `shared/src/types/`
2. **Server**: Create routes in `server/src/routes/`
3. **Client**: Add stores in `client/src/stores/` and pages in `client/src/pages/`
4. **UI**: Update navigation and add new pages to the router

### Database Changes
- Modify `server/src/db/schema.sql` for schema changes
- Update `server/src/db/database.ts` for new operations
- Rebuild the database by deleting `server/src/db/classroom.sqlite`

### Building for Production
```bash
# Build server
cd server && bun run build

# Build client
cd client && npm run build
```

## Contributing

1. Follow the existing code structure and naming conventions
2. Ensure type safety across all new features
3. Add proper error handling for all operations
4. Update documentation for any new functionality
5. Test both client and server integration

## License

This project is licensed under the MIT License.

---

Built with ❤️ using the bhvr stack for modern full-stack TypeScript development.
