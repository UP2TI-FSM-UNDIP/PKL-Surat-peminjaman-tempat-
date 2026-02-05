# Booking System - Document Workflow Management

Complete document booking and workflow management system with multi-step approval process.

## 🚀 Features

### Backend (Laravel 11 API)

- **Authentication** - Sanctum-based JWT authentication
- **User Management** - Complete CRUD with role-based access control
- **Role Management** - Custom roles with slug-based permissions
- **Unit Management** - Hierarchical organizational units (7 categories)
- **Workflow Engine** - Dynamic multi-step approval workflows
- **Document Management** - Create, review, sign documents
- **Access Control** - Role and unit-based document visibility

### Frontend (React + TypeScript)

- **Admin Panel** - Comprehensive admin dashboard
- **Users Management** - Full CRUD with role/unit assignment
- **Roles Management** - Role creation with auto-slug generation
- **Units Management** - Hierarchical unit structure with categories
- **Workflows Management** - Create workflows with multi-step configuration
- **Real-time Updates** - TanStack Query for optimistic updates
- **Type Safety** - Full TypeScript coverage

## 📁 Project Structure

```
peminjaman-tempat/
├── booking-api/          # Laravel 11 Backend API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── DocumentController.php
│   │   │   ├── WorkflowController.php
│   │   │   ├── UserController.php
│   │   │   ├── RoleController.php
│   │   │   └── UnitController.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Role.php
│   │   │   ├── Unit.php
│   │   │   ├── Document.php
│   │   │   ├── Workflow.php
│   │   │   └── WorkflowStep.php
│   │   └── Services/
│   │       └── WorkflowEngine.php
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
│       └── api.php
│
└── booking-web/          # React Frontend
    ├── src/
    │   ├── components/
    │   │   └── admin/
    │   │       ├── UsersManagement.tsx
    │   │       ├── RolesManagement.tsx
    │   │       ├── UnitsManagement.tsx
    │   │       └── WorkflowsManagement.tsx
    │   ├── services/
    │   │   ├── api.ts
    │   │   ├── authService.ts
    │   │   ├── userService.ts
    │   │   ├── roleService.ts
    │   │   ├── unitService.ts
    │   │   └── workflowService.ts
    │   └── routes/
    │       └── admin.tsx
    └── package.json
```

## 🛠️ Tech Stack

### Backend

- Laravel 11
- PHP 8.2+
- Sanctum (Authentication)
- PostgreSQL/MySQL
- RESTful API

### Frontend

- React 18
- TypeScript
- Vite
- TanStack Router (Type-safe routing)
- TanStack Query (Server state)
- Axios (HTTP client)
- shadcn/ui (UI components)
- Tailwind CSS

## 🚦 Quick Start

### Backend Setup

1. Navigate to API folder:

```bash
cd booking-api
```

2. Install dependencies:

```bash
composer install
```

3. Setup environment:

```bash
copy .env.example .env
php artisan key:generate
```

4. Configure database in `.env`:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=booking_db
DB_USERNAME=root
DB_PASSWORD=
```

5. Run migrations and seeders:

```bash
php artisan migrate
php artisan db:seed
```

6. Start development server:

```bash
php artisan serve
```

API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to web folder:

```bash
cd booking-web
```

2. Install dependencies:

```bash
npm install
```

3. Setup environment:

```bash
copy .env.example .env
```

Configure `.env`:

```
VITE_API_URL=http://localhost:8000/api
```

4. Start development server:

```bash
npm run dev
```

App will be available at `http://localhost:5173`

## 🔑 Default Credentials

After seeding the database:

| Role       | Email                     | Password |
| ---------- | ------------------------- | -------- |
| Admin      | admin@example.com         | password |
| Kadep      | kadep.ti@example.com      | password |
| Sekretaris | sekretaris.ti@example.com | password |
| Ketua HIMA | ketua.hima-if@example.com | password |

⚠️ **Change these passwords in production!**

## 📚 API Endpoints

### Authentication

```
POST   /api/login
POST   /api/logout
GET    /api/user
```

### Users

```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### Roles

```
GET    /api/roles
POST   /api/roles
GET    /api/roles/:id
PUT    /api/roles/:id
DELETE /api/roles/:id
```

### Units

```
GET    /api/units
POST   /api/units
GET    /api/units/:id
PUT    /api/units/:id
DELETE /api/units/:id
```

### Workflows

```
GET    /api/workflows
POST   /api/workflows
GET    /api/workflows/:id
PUT    /api/workflows/:id
DELETE /api/workflows/:id
POST   /api/workflows/:id/steps
PUT    /api/workflows/:id/steps/:stepId
DELETE /api/workflows/:id/steps/:stepId
```

### Documents

```
GET    /api/documents
POST   /api/documents
GET    /api/documents/:id
PUT    /api/documents/:id
DELETE /api/documents/:id
POST   /api/documents/:id/sign
```

## 🎯 Key Features Explained

### 1. Document Visibility System

**Three Document Categories:**

- `my_documents` - Documents created by user
- `pending_documents` - Documents awaiting user's signature
- `processed_documents` - Documents user has already signed

**Admin Override:**

- Admin users see ALL documents in `all_documents` category
- Useful for system-wide monitoring and auditing

### 2. Document Access Control

Users can view a document if they are:

- The creator of the document
- Current holder (awaiting their signature)
- Have processed the document (signed it)
- Admin role

### 3. Workflow Engine

**Dynamic Routing:**

- Workflows created per unit category
- Steps configured with target roles
- Multiple scope types:
  - `SELF` - Same unit as document creator
  - `PARENT` - Parent unit
  - `FACULTY_LEADER` - Faculty-level leader
  - `SPECIFIC_CATEGORY` - Specific unit category

**Example Workflow:**

1. Ketua HIMA reviews (SELF scope)
2. Kadep approves (PARENT scope)
3. Dekan signs (FACULTY_LEADER scope)

### 4. Unit Hierarchy

**7 Unit Categories:**

- FAKULTAS (Faculty)
- JURUSAN (Department)
- PRODI (Study Program)
- HIMA (Student Association)
- SENAT (Senate)
- BEM (Student Executive Board)
- UKM (Student Activity Unit)

**Hierarchical Structure:**

```
Fakultas Teknik
├── Teknik Informatika (JURUSAN)
│   ├── S1 Teknik Informatika (PRODI)
│   └── HIMA IF (HIMA)
└── Sistem Informasi (JURUSAN)
    └── HIMA SI (HIMA)
```

### 5. Step Management

**Add Step:**

```bash
POST /api/workflows/:id/steps
{
  "step_order": 3,
  "step_name": "Final Review",
  "target_role_slug": "admin",
  "scope_type": "SELF"
}
```

**Update Step:**

```bash
PUT /api/workflows/:id/steps/:stepId
{
  "step_name": "Updated Name"
}
```

**Delete Step:**

```bash
DELETE /api/workflows/:id/steps/:stepId
```

## 🧪 Testing

### Backend Testing

Run all tests:

```bash
cd booking-api
php artisan test
```

### API Testing with Postman

1. Import collection: `booking-api/Booking-API.postman_collection.json`
2. Set environment variable `base_url` to `http://localhost:8000/api`
3. Run "Login" request to get token
4. Token auto-saves for subsequent requests

### Manual Testing

See [TESTING.md](TESTING.md) for comprehensive testing guide.

## 📦 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide.

### Quick Deploy Checklist

Backend:

- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Configure database
- [ ] Run `composer install --optimize-autoloader --no-dev`
- [ ] Run `php artisan migrate --force`
- [ ] Run `php artisan db:seed`
- [ ] Run `php artisan config:cache`
- [ ] Set proper file permissions

Frontend:

- [ ] Update `VITE_API_URL` to production API
- [ ] Run `npm run build`
- [ ] Deploy `dist/` folder to web server
- [ ] Configure web server for SPA routing

## 🐛 Common Issues

### CORS Errors

**Solution:** Update `SANCTUM_STATEFUL_DOMAINS` in backend `.env` to include frontend domain.

### 401 Unauthorized

**Solution:** Check token is being sent in Authorization header. Verify token hasn't expired.

### Token Not Persisting

**Solution:** Check browser localStorage. Ensure token is saved after successful login.

### Documents Not Showing

**Solution:**

- Verify user has correct role and unit assignments
- Check document workflow matches user's unit category
- Ensure user is in workflow step's target role

## 📖 Documentation

- [Frontend README](booking-web/README.md) - Frontend architecture and setup
- [Backend API Documentation](booking-api/README.md) - API endpoints and models
- [Testing Guide](TESTING.md) - Comprehensive testing procedures
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is proprietary and confidential.

## 👥 Support

For support and questions:

- Create an issue in the repository
- Contact the development team

## 🎉 Acknowledgments

- Laravel framework for robust backend
- React ecosystem for modern frontend
- shadcn/ui for beautiful components
- TanStack for excellent state management tools

---

**Built with ❤️ for efficient document workflow management**
