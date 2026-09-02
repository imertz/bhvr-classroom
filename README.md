# 📚 Classroom Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Bun](https://img.shields.io/badge/Bun-1.4+-black?logo=bun)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0%20%7C%206.0-blue?logo=typescript)
![Effect](https://img.shields.io/badge/Effect-4.0-purple)
![Hono](https://img.shields.io/badge/Hono-4.13-E36002?logo=hono)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwindcss)

A comprehensive, production-grade full-stack classroom management system built with modern TypeScript, Bun, Hono, React 19, and the Effect TS library. Designed as a type-safe monorepo featuring end-to-end schema validation, functional service layers, role-based access control, and complete CRUD operations across all educational entities.

![Dashboard Preview](https://github.com/user-attachments/assets/a29de6b0-d4a8-4380-a921-8a07c1778ff8)

---

## 🌟 Key Highlights

- **Functional Architecture with Effect**: Domain repositories and business logic are modeled as typed Effect services (`Context.Service`, `Layer`, and `ManagedRuntime`) with typed error channels (`NotFoundError`, `DatabaseError`, `UnauthorizedError`) and safe resource management.
- **End-to-End Type Safety**: Shared Effect schemas (`Schema.Class`, `Schema.TaggedError`) unify runtime validation between SQLite, Hono RPC endpoints, and the React frontend.
- **Hono RPC Client Integration**: Fully typed API client (`hc`) with custom fetch interceptors that queue requests during automatic JWT token refreshes, seamlessly decoding responses via Effect Schema.
- **Robust Role-Based Access Control (RBAC)**: Enforced across both API routes and client interfaces for three distinct roles: `admin`, `teacher`, and `student`.
- **JWT Authentication with Token Rotation**: Short-lived access tokens (15 minutes) paired with cryptographically hashed, rotatable refresh tokens stored in SQLite with HTTP-only cookie support.
- **Observability & Sensitive Data Redaction**: Structured JSON logging in production (colorized in development) featuring request-id tracing (`X-Request-Id`) and automatic redaction of sensitive credentials (passwords, tokens, cookies).
- **Modern React 19 Frontend**: Built with Vite 8, Tailwind CSS v4, TanStack React Query v5 for caching and optimistic updates, Zustand for auth state, Lucide icons, and accessible Radix UI primitives.
- **Custom Linting & Anti-Slop**: Enforces code quality with dual Oxlint AST plugins (`anti-slop` and `anti-slop-effect`) prohibiting unsafe type widening and ensuring strict Effect service conventions.

---

## 🛠️ Tech Stack

### Backend & Core
- **Runtime & Package Manager**: [Bun](https://bun.sh) (native SQLite driver, `Bun.password` Argon2id/bcrypt hashing, UUIDv7 generation)
- **Web Framework**: [Hono v4](https://hono.dev) (lightweight, modular router, CORS, request IDs, RPC support)
- **Functional Framework**: [Effect TS v4](https://effect.website) (`Context`, `Layer`, `ManagedRuntime`, `Schema`, `TaggedError`)
- **Database**: [SQLite](https://sqlite.org) (`bun:sqlite` with WAL mode enabled and strict foreign key enforcement)
- **Validation**: [Effect Schema](https://effect.website/docs/schema/introduction) & [Zod](https://zod.dev)

### Frontend
- **Framework**: [React 19](https://react.dev)
- **Build Tool**: [Vite 8](https://vitejs.dev)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- **Server State**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Client State**: [Zustand v5](https://zustand.surge.sh)
- **Routing**: [React Router v7](https://reactrouter.com)
- **UI Components**: [Radix UI](https://radix-ui.com) & [Lucide React](https://lucide.dev)

### Tooling & Quality
- **TypeScript**: Dual compiler setup — `@typescript/native` (TypeScript 7) for builds and `@typescript/typescript6` for ESLint compatibility
- **Linters**: [Oxlint](https://oxc.rs) with custom AST anti-slop rules + [ESLint](https://eslint.org)

---

## 📦 Core Domain Modules

| Module | Description | Access Rules |
| :--- | :--- | :--- |
| **👨‍🏫 Teachers** | Profiles, department data, and teacher/admin accounts. | Public read; Admin write |
| **👨‍🎓 Students** | Registration, academic profiles, grade levels, and login accounts. | Public read; Admin & Teacher write |
| **🏛️ Classes** | Class schedules, subjects, room assignments, and detailed aggregates. | Public read; Admin & Teacher write |
| **📋 Enrollments** | Student enrollment status (`active`, `dropped`, `completed`). | Authenticated read; Admin & Teacher write |
| **📝 Assignments** | Coursework, quizzes, tests, points possible, and deadlines. | Public read; Admin & Teacher write |
| **📤 Submissions** | Student assignment submissions with status tracking (`submitted`, `graded`, `returned`). | Authenticated read/write; Students can only submit for themselves |
| **🎯 Grades** | Point grading, submission assessment, and teacher feedback. | Authenticated read; Admin & Teacher write; Students view own grades |
| **📅 Attendance** | Daily tracking (`present`, `absent`, `tardy`, `excused`) with notes. | Authenticated read; Admin & Teacher write; Students view own attendance |
| **📢 Announcements** | Class-wide updates and time-sensitive broadcast notices with expiration dates. | Public read; Admin & Teacher write |

---

## 📁 Project Structure

```
.
├── client/                     # React 19 single-page application
│   ├── src/
│   │   ├── components/         # UI layout, ProtectedRoute, RecordTable system
│   │   ├── hooks/
│   │   │   ├── queries/        # TanStack Query hooks (useTeachers, useClasses, etc.)
│   │   │   └── usePermissions  # Role-based UI permission helpers
│   │   ├── lib/                # Hono RPC client (`hc`), JWT refresh interceptor, unwrapJsonEffect
│   │   ├── pages/              # Views: Dashboard, ClassDetails, Form pages, Entity tables, Auth
│   │   ├── services/           # Client authentication services
│   │   └── stores/             # Zustand stores (authStore)
│   ├── public/                 # Static assets
│   └── package.json
├── server/                     # Hono API server powered by Bun & Effect
│   ├── src/
│   │   ├── config/             # JWT and authentication configuration
│   │   ├── db/                 # SQLite schema (schema.sql), migration and seed logic
│   │   ├── middleware/         # Auth, logging, error handling, Effect request validation
│   │   ├── routes/             # Hono REST/RPC route handlers
│   │   ├── services/           # Effect domain services & repositories (AppRuntime, TeacherRepo, etc.)
│   │   ├── tests/              # 45+ integration test suite (auth, routes, database, logger)
│   │   ├── utils/              # Structured logger with redaction, JWT sign/verify
│   │   ├── client.ts           # Shared Hono RPC client type exports (AppType, hcWithType)
│   │   └── index.ts            # Server entrypoint and route mounting
│   └── package.json
├── shared/                     # Shared TypeScript library
│   ├── src/
│   │   └── types/              # Effect Schemas, Class definitions, and TaggedErrors for all entities
│   └── package.json
├── tools/                      # Repository developer tools
│   └── oxlint/anti-slop/       # Custom AST anti-slop plugins for Oxlint
├── oxlint.config.ts            # Oxlint configuration
├── package.json                # Root monorepo workspace configuration
└── AGENTS.md                   # Guidance on Effect TypeScript library usage
```

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.1+ or v1.4+ recommended) installed on your system.

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/classroom-management.git
   cd classroom-management
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

   > **Note:** `bun install` automatically triggers the `postinstall` script to build the `shared` and `server` packages.

### Running Development Servers

You can run all services simultaneously using the root orchestrator:

```bash
bun run dev
```

This starts the following concurrently:
- **Shared Watcher**: Watches and compiles `shared/src` to `shared/dist`
- **Backend API**: Runs `server/src/index.ts` with Bun hot-reloading on [http://localhost:3000](http://localhost:3000)
- **Frontend App**: Starts the Vite dev server on [http://localhost:5173](http://localhost:5173)

Or start each workspace individually:

```bash
# Terminal 1 - Shared types watcher
bun run dev:shared

# Terminal 2 - Server API
bun run dev:server

# Terminal 3 - Client UI
bun run dev:client
```

### Initial Admin Credentials

On first run, the server automatically initializes SQLite in WAL mode and creates an administrator account if one does not already exist:

- **Email**: `admin@classroom.com` (or value of `ADMIN_EMAIL`)
- **Password**: If `ADMIN_PASSWORD` is not set in `.env`, a secure 12-character password will be printed to the server console upon startup.

---

## ⚙️ Environment Configuration

Create a `.env` file in the `server` directory:

```env
# Server & Logging
PORT=3000
NODE_ENV=development
LOG_LEVEL=info # debug | info | warn | error | silent

# JWT Secrets
JWT_ACCESS_SECRET=your-secure-access-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret

# Admin Account Seed (optional)
ADMIN_EMAIL=admin@classroom.com
ADMIN_PASSWORD=your-admin-password
```

Create a `.env` file in the `client` directory:

```env
VITE_SERVER_URL=http://localhost:3000
```

---

## 🔌 API Reference

### Authentication Endpoints

| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Unified login (auto-detects teacher/admin vs. student) | Public |
| `POST` | `/auth/teacher/login` | Teacher & administrator login | Public |
| `POST` | `/auth/student/login` | Student login | Public |
| `POST` | `/auth/teacher/register` | Teacher self-registration | Public |
| `POST` | `/auth/refresh` | Rotate and issue new access token via HTTP-only cookie | Public |
| `POST` | `/auth/logout` | Revoke active refresh token in database | Authenticated |
| `GET` | `/auth/me` | Fetch profile for currently authenticated user | Authenticated |

### Entity Endpoints

All entities (`teachers`, `students`, `classes`, `assignments`, `announcements`, `enrollments`, `submissions`, `grades`, `attendance`) follow consistent RESTful patterns:

```
GET    /api/{entity}      List all records
GET    /api/{entity}/:id  Retrieve record by ID
POST   /api/{entity}      Create new record
PUT    /api/{entity}/:id  Update existing record
DELETE /api/{entity}/:id  Delete record
```

#### Notable Special Endpoints:
- `GET /api/classes/:id` — Aggregates full class details including assigned teacher, enrolled student profiles, assignments, and class announcements.
- `GET /api/classes/student/:studentId` — Retrieves all classes for a specific enrolled student.
- `GET /api/grades/student/:studentId` — Retrieves all grade records for a specific student.
- `GET /api/attendance/student/:studentId` — Retrieves attendance history for a student.
- `GET /api/announcements/class/:classId` — Retrieves all active announcements for a specific class.

---

## 🧪 Testing & Code Quality

### Running Tests

The test suite exercises end-to-end authentication, role-based authorization, database constraints, and sensitive data redaction:

```bash
bun test
```

### Linting & Anti-Slop Rules

The repository includes both Oxlint and ESLint configurations:

```bash
# Run all linters
bun run lint

# Run Oxlint with custom anti-slop rules
bun run lint:oxlint

# Run ESLint on the client
bun run lint:eslint
```

#### Custom Oxlint Anti-Slop Features:
- **`anti-slop/require-safety-comment-for-type-assertion`**: Mandates explicit `// SAFETY:` justifications on all type assertions.
- **`anti-slop/no-chained-type-assertions`**: Prohibits double assertions (`x as unknown as Y`).
- **`anti-slop/no-known-value-widening`**: Enforces strict literal and narrowing types.
- **`anti-slop-effect/no-service-constructor-imports`**: Protects Effect service layer boundaries.

### Building for Production

```bash
# Build all workspaces
bun run build:shared && bun run build:server && bun run build:client
```

---

## ℹ️ TypeScript Compatibility Notice

This project utilizes TypeScript 7 native features through the `@typescript/native` package for optimized compilation. To maintain complete compatibility with the ESLint and typescript-eslint compiler APIs, `@typescript/typescript6` is installed alongside it.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Ensure all tests pass (`bun test`) and lints are clean (`bun run lint`)
4. Commit your changes with conventional commit messages (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
