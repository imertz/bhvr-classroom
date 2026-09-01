# 📚 Classroom Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue)
![React](https://img.shields.io/badge/React-19-blue)
![Bun](https://img.shields.io/badge/Bun-latest-black)

A comprehensive full-stack classroom management system built with modern TypeScript technologies, featuring complete CRUD operations for all educational entities.

![Dashboard Preview](https://github.com/user-attachments/assets/a29de6b0-d4a8-4380-a921-8a07c1778ff8)

## 🌟 Features

This classroom management system provides a complete solution for educational institutions to manage teachers, students, classes, assignments, announcements, submissions, enrollments, attendance, and grades. Built as a type-safe monorepo with shared types between client and server.

### Core Modules

- **👨‍🏫 Teachers**: Manage teacher profiles, departments, and contact information
- **👨‍🎓 Students**: Handle student registration, profiles, and academic records
- **🏛️ Classes**: Create and manage class schedules, subjects, and room assignments
- **📝 Assignments**: Create assignments with due dates, point values, and detailed descriptions
- **📢 Announcements**: Broadcast important information to classes with expiration dates
- **📤 Submissions**: Track student assignment submissions with status monitoring
- **📋 Enrollments**: Manage student enrollments in classes with status tracking
- **📅 Attendance**: Record and track student attendance with multiple status options
- **🎯 Grades**: Comprehensive grading system with feedback and automatic calculations

### Technical Features

- **Full-Stack TypeScript**: End-to-end type safety between client and server
- **Shared Types**: Common type definitions ensure consistency across the entire application
- **JWT Authentication**: Secure authentication with refresh token rotation
- **Role-Based Access Control**: Admin, Teacher, and Student roles
- **Monorepo Structure**: Organized workspaces for easy development and deployment
- **Modern Stack**: Built with the latest technologies for performance and developer experience
- **RESTful API**: Well-structured API endpoints for all CRUD operations
- **Responsive UI**: Modern React interface that works on all devices
- **Real-time Updates**: Optimistic updates and automatic data refresh

## 🛠️ Tech Stack

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

## 📋 Prerequisites

- [Bun](https://bun.sh) installed on your system
- Node.js (for the client development)
- Basic knowledge of TypeScript and React

### TypeScript 7 compatibility

The repository uses TypeScript 7 for builds through the `@typescript/native` alias. `typescript-eslint` still requires the TypeScript 6 compiler API, so the `typescript` dependency intentionally points to `@typescript/typescript6`; this keeps TypeScript 7's `tsc` and ESLint's compatible API installed side by side.

## 🚀 Quick Start

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/classroom-management.git
   cd classroom-management
   ```

2. **Install dependencies for all workspaces:**

   ```bash
   bun install
   ```

3. **Start the development servers:**

   In separate terminals:

   ```bash
   # Terminal 1 - Start the server
   cd server && bun run dev

   # Terminal 2 - Start the client
   cd client && npm run dev
   ```

4. **Open your browser:**

   - Client: [http://localhost:5173](http://localhost:5173)
   - Server API: [http://localhost:3000](http://localhost:3000)

5. **Default Admin Credentials:**
   - The system will create an admin user on first run
   - Check the server console for the generated password
   - Email: `admin@classroom.com`

## 📁 Project Structure

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

## 🔌 API Endpoints

The server provides complete REST API coverage for all entities:

### Public Endpoints

- `GET /api/{entity}` - List all entities
- `GET /api/{entity}/:id` - Get entity by ID

### Protected Endpoints (Require Authentication)

- `POST /api/{entity}` - Create new entity
- `PUT /api/{entity}/:id` - Update entity
- `DELETE /api/{entity}/:id` - Delete entity

### Authentication Endpoints

- `POST /auth/teacher/login` - Teacher login
- `POST /auth/teacher/register` - Teacher registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

## 📊 Database Schema

The system uses SQLite with the following main entities:

- **Teachers**: Profile information, department, contact details, role (teacher/admin)
- **Students**: Personal information, enrollment status, contact details
- **Classes**: Course information, schedule, teacher assignment
- **Assignments**: Title, description, due dates, point values
- **Announcements**: Class communications with expiration
- **Submissions**: Student work submissions with status tracking
- **Enrollments**: Student-class relationships with status
- **Attendance**: Daily attendance records with status options
- **Grades**: Assignment grades with feedback and scoring

## 🎯 Usage Guide

### Initial Setup

1. **Setup Admin**: The system creates an admin user automatically on first run
2. **Add Teachers**: Login as admin and add teacher profiles to the system
3. **Create Classes**: Set up classes and assign teachers
4. **Add Students**: Register students in the system
5. **Manage Enrollments**: Enroll students in appropriate classes

### Daily Operations

1. **Create Assignments**: Teachers set up assignments with due dates and point values
2. **Make Announcements**: Teachers communicate important information to students
3. **Track Submissions**: Monitor student assignment submissions
4. **Record Attendance**: Teachers track daily student attendance
5. **Grade Work**: Evaluate submissions and provide feedback

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
ADMIN_EMAIL=admin@classroom.com
ADMIN_PASSWORD=your-admin-password
NODE_ENV=development
```

Create a `.env` file in the client directory:

```env
VITE_SERVER_URL=http://localhost:3000
```

## 🏗️ Building for Production

```bash
# Build all workspaces
bun run build

# Or build individually
cd server && bun run build
cd client && npm run build
```

## 🧪 Development

### Adding New Features

1. **Types**: Add new types in `shared/src/types/`
2. **Server**: Create routes in `server/src/routes/`
3. **Client**: Add stores in `client/src/stores/` and pages in `client/src/pages/`
4. **UI**: Update navigation and add new pages to the router

### Database Migrations

- Modify `server/src/db/schema.sql` for schema changes
- Update `server/src/db/database.ts` for new operations
- The system handles migrations automatically on startup

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the existing code structure and naming conventions
4. Ensure type safety across all new features
5. Add proper error handling for all operations
6. Update documentation for any new functionality
7. Test both client and server integration
8. Commit your changes (`git commit -m 'Add amazing feature'`)
9. Push to the branch (`git push origin feature/amazing-feature`)
10. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using the modern TypeScript ecosystem
- Inspired by the needs of educational institutions
- Thanks to all the open-source projects that made this possible

## 🐛 Known Issues

- Browser storage APIs (localStorage, sessionStorage) are not supported in Claude.ai artifacts
- Refresh token rotation requires secure HTTP-only cookies

## 📞 Support

- Create an issue for bug reports or feature requests
- Check existing issues before creating new ones
- Provide detailed information for bug reports

---

Built with the modern full-stack TypeScript development stack.
