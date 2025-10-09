# Finance Tracker - Frontend-Backend Integration

## Overview
This document describes the complete integration between the React frontend and Node.js backend for the Finance Tracker application.

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Port**: 5000
- **Database**: MongoDB (using both Mongoose and native driver)
- **Authentication**: JWT tokens
- **APIs**: RESTful endpoints for all financial operations

### Frontend (React)
- **Port**: 3000 (development)
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **State Management**: React Context for authentication

## 🔧 Integration Features

### 1. Authentication System
- **Context Provider**: Centralized auth state management
- **Protected Routes**: Automatic redirect to login for unauthorized users
- **Token Management**: Automatic token injection and refresh handling
- **Logout**: Clean session termination

### 2. API Client Configuration
- **Base URL**: Configured to use proxy for development
- **Interceptors**: Automatic token injection and error handling
- **Error Handling**: Centralized error management with user-friendly messages

### 3. Routing Structure
```
/ (Home) - Public
/login - Public
/register - Public
/upload - Protected (Data Management)
/add-members - Protected (Group Management)
/split-expense - Protected (Expense Splitting)
/invoices - Protected (Invoice Management)
/reports - Protected (Financial Reports)
/logout - Public (Logout handler)
```

## 🚀 Quick Start

### Prerequisites
1. Node.js installed
2. MongoDB database (local or cloud)
3. Backend `.env` file with:
   ```
   MONGO_URI=mongodb://your-connection-string
   JWT_SECRET=your-secret-key
   ```

### Running the Application

#### Option 1: Using the Startup Script
```bash
./start-dev.sh
```

#### Option 2: Manual Setup
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

## 📁 Key Integration Files

### Frontend
- `src/config/api.js` - API client configuration
- `src/contexts/AuthContext.js` - Authentication context
- `src/components/ProtectedRoute.js` - Route protection
- `src/App.js` - Main routing configuration
- `package.json` - Proxy configuration for development

### Backend
- `server.js` - Main server configuration
- `routes/` - API endpoint definitions
- `middleware/auth.js` - JWT authentication middleware
- `models/` - Database schemas

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Data Management
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/search` - Search expenses

### Income Management
- `GET /api/income` - Get all income
- `POST /api/income` - Create income
- `PUT /api/income/:id` - Update income
- `DELETE /api/income/:id` - Delete income
- `GET /api/income/search` - Search income

### File Upload
- `POST /api/upload` - Upload CSV/PDF files

### Groups & Users
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create group
- `GET /api/users` - Get all users

### Reports & Invoices
- `GET /api/reports/*` - Financial reports
- `GET /api/invoices/*` - Invoice management

## 🔐 Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Protected Routes**: Frontend route protection
3. **Token Interceptors**: Automatic token handling
4. **CORS Configuration**: Proper cross-origin setup
5. **Password Hashing**: bcrypt for secure password storage

## 🛠️ Development Tools

### Proxy Configuration
The frontend is configured to proxy API requests to the backend during development:
```json
{
  "proxy": "http://localhost:5000"
}
```

### Environment Variables
- Backend: Uses `.env` file for configuration
- Frontend: Can use `REACT_APP_*` prefixed variables

## 📊 Data Flow

1. **User Authentication**:
   - Login/Register → Backend validates → JWT token returned
   - Token stored in localStorage
   - All subsequent requests include token

2. **Data Operations**:
   - Frontend makes API calls through configured client
   - Backend validates token and processes request
   - Response returned with appropriate status codes

3. **Error Handling**:
   - Centralized error handling in API client
   - User-friendly error messages
   - Automatic logout on token expiration

## 🧪 Testing the Integration

1. **Start both servers** using the startup script
2. **Register a new user** at `/register`
3. **Login** with the created account
4. **Navigate to protected routes** (should work seamlessly)
5. **Test data operations**:
   - Upload CSV/PDF files
   - Add expenses and income manually
   - Search and filter data
   - View reports

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is properly configured
2. **Authentication Failures**: Check JWT_SECRET in backend .env
3. **Database Connection**: Verify MONGO_URI in backend .env
4. **Proxy Issues**: Ensure frontend proxy points to correct backend port

### Debug Tips

1. Check browser Network tab for API calls
2. Verify token in localStorage
3. Check backend console for errors
4. Ensure both servers are running on correct ports

## 🔄 Next Steps

The integration is now complete and ready for development. You can:

1. Add more API endpoints as needed
2. Implement additional features
3. Add more sophisticated error handling
4. Implement real-time updates with WebSockets
5. Add comprehensive testing

## 📝 Notes

- The backend uses both Mongoose and native MongoDB driver
- Frontend uses modern React hooks and context
- All API calls are properly typed and error-handled
- The application is ready for production deployment with minor configuration changes
