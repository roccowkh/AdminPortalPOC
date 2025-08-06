# Booking Admin Portal

A modern booking management system built with React, Node.js, and Prisma. Perfect for managing appointments and bookings with a beautiful calendar interface.

## Features

- 📅 **Interactive Calendar** - Visual booking management with React Big Calendar
- 👥 **User Management** - Create, edit, and manage users
- 🔧 **Service Management** - Configure services with duration and pricing
- 📊 **Dashboard** - Overview statistics and recent bookings
- 🔐 **Authentication** - JWT-based authentication system
- 📱 **Responsive Design** - Works on desktop and mobile
- ⚡ **Real-time Updates** - React Query for efficient data fetching

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- React Big Calendar for calendar interface
- React Query for data management
- React Hook Form for form handling
- React Router for navigation

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- SQLite (development) / PostgreSQL (production)
- JWT authentication
- Express validation

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Go back to root
cd ..
```

2. **Set up the database:**
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with sample data
npm run db:seed
```

3. **Start the development servers:**
```bash
# Start both frontend and backend
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend client on `http://localhost:5173`

### Default Login Credentials

- **Email:** `admin@example.com`
- **Password:** `admin123`

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run install:all` - Install dependencies for all packages
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio (database GUI)

### Server Only
- `cd server && npm run dev` - Start backend server
- `cd server && npm run build` - Build for production
- `cd server && npm run start` - Start production server

### Client Only
- `cd client && npm run dev` - Start frontend development server
- `cd client && npm run build` - Build for production
- `cd client && npm run preview` - Preview production build

## Project Structure

```
booking-admin-portal/
├── server/                 # Backend API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth & validation
│   │   └── index.ts       # Server entry point
│   ├── prisma/            # Database schema & migrations
│   └── package.json
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── main.tsx       # App entry point
│   └── package.json
└── package.json           # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/calendar` - Get calendar view
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

## Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=5000
NODE_ENV=development

# Client URL for CORS
CLIENT_URL="http://localhost:5173"
```

## Database Schema

The application uses the following main entities:

- **Users** - System users (admin/regular users)
- **Services** - Available services with duration and pricing
- **Bookings** - Appointments linking users and services
- **BookingsOnUsers** - Many-to-many relationship for bookings and users
- **BookingsOnServices** - Many-to-many relationship for bookings and services

## Features in Detail

### Calendar Interface
- Week, month, and day views
- Drag and drop booking creation
- Color-coded booking status
- Click to edit existing bookings

### Booking Management
- Create bookings with multiple users and services
- Set booking status (Pending, Confirmed, Cancelled, Completed, No Show)
- Add notes to bookings
- Conflict detection for overlapping time slots

### User Management
- Create and manage users
- Assign roles (Admin/User)
- Search and filter users

### Service Management
- Configure services with duration and pricing
- Activate/deactivate services
- Prevent deletion of services used in bookings

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Ensure you've run `npm run db:migrate`
   - Check that the `.env` file exists in the server directory

2. **Port already in use:**
   - Change the PORT in server `.env` file
   - Update CLIENT_URL accordingly

3. **CORS errors:**
   - Ensure CLIENT_URL in server `.env` matches your frontend URL

4. **Prisma errors:**
   - Run `npm run db:generate` to regenerate Prisma client
   - Run `npm run db:migrate` to apply migrations

### Development Tips

- Use `npm run db:studio` to inspect and edit database data visually
- Check the browser console and server logs for detailed error messages
- The frontend automatically proxies API calls to the backend during development

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a production database (PostgreSQL recommended)
3. Set a strong JWT_SECRET
4. Build the frontend: `cd client && npm run build`
5. Build the backend: `cd server && npm run build`
6. Deploy both to your hosting platform

## License

MIT License - feel free to use this project for your own booking management needs! 