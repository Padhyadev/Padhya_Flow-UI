# PadhyaFlow Admin Panel

## Overview
This is a comprehensive **User Role Management System** with **Menu-based Permissions**. The application provides a complete admin panel for managing users, roles, and menu access controls.

## Features

### ✅ Core Features
- **User Management**: Create, read, update, and delete users
- **Role Management**: Define and manage user roles with custom permissions
- **Menu Management**: Configure menu items and assign role-based access
- **Role-based Menu Permissions**: Dynamic menu rendering based on user roles
- **Authentication**: Secure login/logout with JWT tokens
- **Profile Management**: Users can view and edit their profiles
- **Settings**: System configuration (admin only)

### 🔐 Security
- JWT-based authentication
- Role-based access control (RBAC)
- Protected routes
- Permission guards for sensitive operations

## Project Structure

```
PadhyaFlow/
├── public/
│   ├── index.html
│   └── ...
├── src/
│   ├── admin/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx    # Route protection
│   │   │   ├── RoleGuard.tsx         # Role-based access guard
│   │   │   └── PermissionGuard.tsx   # Permission-based guard
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Authentication state
│   │   │   ├── PermissionContext.tsx # Permission state
│   │   │   └── ToastContext.tsx      # Toast notifications
│   │   ├── hooks/
│   │   │   ├── usePermission.ts      # Permission hooks
│   │   │   └── usePermissions.ts
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx       # Main layout
│   │   │   ├── AdminSidebar.tsx      # Dynamic sidebar
│   │   │   └── AdminNavbar.tsx       # Top navigation
│   │   ├── pages/
│   │   │   ├── Login.tsx             # Login page
│   │   │   ├── Dashboard.tsx         # Main dashboard
│   │   │   ├── users/                # User management pages
│   │   │   ├── roles/                # Role management pages
│   │   │   ├── menus/                # Menu management pages
│   │   │   ├── Profile.tsx           # User profile
│   │   │   └── Settings.tsx          # System settings
│   │   ├── services/
│   │   │   └── api/
│   │   │       ├── authApi.ts        # Authentication API
│   │   │       ├── userApi.ts        # User API
│   │   │       ├── roleApi.ts        # Role API
│   │   │       ├── menuApi.ts        # Menu API
│   │   │       └── menuAccessApi.ts  # Menu access API
│   │   ├── styles/                   # CSS files
│   │   ├── types/                    # TypeScript types
│   │   └── utils/                    # Utility functions
│   ├── App.tsx                       # Main app component
│   └── index.tsx                     # Entry point
├── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

3. **Open your browser**
   Navigate to `http://localhost:3000`
   - You will be redirected to `/admin/login`

## Usage

### Default Login
The application will redirect to the login page. Use your credentials to log in.

### User Roles
The system supports multiple roles with different permissions:
- **SA Admin / Admin**: Full access to all features
- **Custom Roles**: Configurable access based on menu permissions

### Managing Users
1. Navigate to **Users** from the sidebar
2. Click **Add User** to create a new user
3. Assign a role to the user
4. Save the user

### Managing Roles
1. Navigate to **Roles** from the sidebar
2. Click **Add Role** to create a new role
3. Configure permissions for the role
4. Save the role

### Managing Menus
1. Navigate to **Menus** from the sidebar
2. Click **Add Menu** to create a new menu item
3. Assign roles that can access this menu
4. Save the menu

### Menu Permissions
The sidebar menu is dynamically generated based on:
- User's role
- Menu permissions stored in the database
- Role-based access control

## API Integration

The application expects a backend API with the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Roles
- `GET /api/roles` - Get all roles
- `GET /api/roles/:id` - Get role by ID
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

### Menus
- `GET /api/menus` - Get all menus
- `GET /api/menus/:id` - Get menu by ID
- `POST /api/menus` - Create menu
- `PUT /api/menus/:id` - Update menu
- `DELETE /api/menus/:id` - Delete menu

### Menu Access
- `GET /api/menu-access/role/:roleId` - Get menu access for a role
- `POST /api/menu-access` - Grant menu access
- `DELETE /api/menu-access/:id` - Revoke menu access

## Configuration

### API Base URL
Update the API base URL in `src/admin/services/apiService.ts`:

```typescript
const API_BASE_URL = 'http://your-api-url.com/api';
```

### Environment Variables
Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://your-api-url.com/api
```

## Build for Production

```bash
npm run build
```

This will create an optimized production build in the `build/` directory.

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router v6** - Routing
- **Context API** - State management
- **CSS3** - Styling
- **Font Awesome** - Icons
- **Bootstrap 5** - UI components

## Key Features Explained

### Dynamic Sidebar
The sidebar menu is dynamically generated based on:
1. User's role from authentication
2. Menu permissions from the database
3. Controller mapping in `AdminSidebar.tsx`

### Permission System
- **PermissionContext**: Provides permission state across the app
- **PermissionGuard**: Component-level permission checking
- **RoleGuard**: Route-level role checking
- **usePermission**: Hook for checking permissions in components

### Protected Routes
All admin routes are wrapped with `ProtectedRoute` component that:
- Checks if user is authenticated
- Redirects to login if not authenticated
- Provides authentication context to child components

## Troubleshooting

### Build Errors
If you encounter build errors:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear cache: `npm cache clean --force`

### Login Issues
- Ensure the API is running
- Check the API base URL configuration
- Verify CORS settings on the backend

### Menu Not Showing
- Check if the user has the correct role
- Verify menu permissions in the database
- Check the controller mapping in `AdminSidebar.tsx`

## License
This project is proprietary and confidential.

## Support
For support, please contact the development team.
