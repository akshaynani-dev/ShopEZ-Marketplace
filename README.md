# TradePro - MERN Stock Trading Platform

A full-stack web application for virtual stock trading with role-based authentication, portfolio management, real-time stock tracking, and admin moderation.

## 🚀 Features

### User Features
- **Authentication**: Secure JWT-based login/register
- **Stock Browsing**: Search and filter stocks by symbol, name, or sector
- **Trading**: Buy and sell stocks with real-time balance updates
- **Portfolio Management**: Track holdings, average prices, and performance
- **Transaction History**: Complete record of all trades
- **Performance Analytics**: View profit/loss, invested value, and current value

### Admin Features
- **User Management**: View and manage user roles
- **Stock Management**: Add, update, and delete stocks
- **Transaction Monitoring**: View all platform transactions
- **Dashboard Analytics**: Track platform statistics and metrics
- **Market Overview**: Manage and monitor market data

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, Helmet, CORS, Rate Limiting
- **Validation**: Zod
- **Testing**: Jest, Supertest

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **UI Framework**: Bootstrap 5, React Bootstrap
- **Charts**: Chart.js, React ChartJS 2
- **State Management**: Context API

## 📁 Project Structure

```
backend/
├── config/           # DB connection
├── controllers/      # Route handlers
├── middleware/       # Auth, validation, error handling
├── models/          # Mongoose schemas
├── routes/          # API endpoints
├── services/        # Business logic
├── tests/           # Unit and integration tests
├── utils/           # Helper functions
├── validators/      # Request validation schemas
├── app.js           # Express app setup
└── server.js        # Entry point

frontend/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI components
│   ├── context/     # Global state
│   ├── pages/       # Route pages
│   ├── services/    # API service layer
│   ├── App.js       # Main app component
│   └── index.js     # React entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

#### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://24eg105g39_db_user:nani123akshay@cluster0.1cnoos7.mongodb.net/stock_platform?retryWrites=true&w=majority
JWT_SECRET=DX6yRlD1kbqPC4otz6iu4DRsp3BNJ+vrhiowhM2ZjpU=
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000
STOCK_POLL_INTERVAL_MS=30000
```

#### Seed Database

```bash
npm run seed
```

This creates:
- Admin user: `admin@tradepro.dev` / `Admin@123`
- Regular user: `user@tradepro.dev` / `User@1234`
- Sample stocks: AAPL, MSFT, TSLA

#### Start Backend

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

#### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get profile

### Stocks
- `GET /api/stocks` - List stocks (paginated, searchable)
- `GET /api/stocks/:id` - Get stock details
- `POST /api/stocks` - Create stock (admin only)
- `PUT /api/stocks/:id` - Update stock (admin only)
- `DELETE /api/stocks/:id` - Delete stock (admin only)

### Trading
- `POST /api/trades/buy` - Buy stock
- `POST /api/trades/sell` - Sell stock

### Portfolio
- `GET /api/portfolio` - Get user holdings
- `GET /api/portfolio/performance` - Get performance metrics
- `GET /api/portfolio/history` - Get transaction history

### Dashboard
- `GET /api/dashboard/market` - Market overview
- `GET /api/dashboard/top-gainers` - Top gaining stocks
- `GET /api/dashboard/top-losers` - Top losing stocks
- `GET /api/dashboard/most-active` - Most active stocks

### Admin
- `GET /api/admin/dashboard` - Admin statistics
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/transactions` - View all transactions

## 🧪 Testing

Run backend tests:

```bash
cd backend
npm test
```

Tests cover:
- Authentication (register, login, token validation)
- Stock CRUD operations
- Trading operations (buy/sell with balance validation)
- Portfolio management
- Admin access control

## 🔒 Security Features

- ✅ JWT token-based authentication
- ✅ Password hashing with bcryptjs
- ✅ CORS protection
- ✅ Rate limiting (400 req/15min)
- ✅ Helmet for HTTP headers
- ✅ Input validation with Zod
- ✅ SQL injection prevention (MongoDB)
- ✅ Protected routes by role
- ✅ Secure token storage in localStorage

## 📊 Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'USER' | 'ADMIN',
  balance: Number (default: 100000),
  profileImage: String,
  createdAt: Date
}
```

### Stock
```javascript
{
  symbol: String (unique),
  companyName: String,
  currentPrice: Number,
  marketCap: Number,
  sector: String,
  volume: Number,
  dayHigh: Number,
  dayLow: Number,
  previousClose: Number,
  historicalData: [{
    date: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number
  }],
  createdAt: Date
}
```

### Transaction
```javascript
{
  userId: ObjectId,
  stockId: ObjectId,
  transactionType: 'BUY' | 'SELL',
  quantity: Number,
  price: Number,
  totalAmount: Number,
  timestamp: Date
}
```

### Portfolio
```javascript
{
  userId: ObjectId,
  holdings: [{
    stockId: ObjectId,
    quantity: Number,
    averagePrice: Number
  }],
  createdAt: Date
}
```

## 🎯 Usage

### Register a New User
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Buy Stock
```bash
POST http://localhost:5000/api/trades/buy
Authorization: Bearer <token>
Content-Type: application/json

{
  "stockId": "63f5a1234567890abcdef123",
  "quantity": 10
}
```

## 📈 Performance Optimizations

- MongoDB indexes on frequently queried fields
- Pagination on stock and transaction lists
- Lazy loading of components
- API response caching where applicable
- Efficient portfolio calculations
- Session-based transactions for buy/sell operations

## 🐛 Error Handling

All API responses follow this format:

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "data": { }
}
```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=<your_mongodb_uri>
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000
STOCK_POLL_INTERVAL_MS=30000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)
```bash
npm install -g heroku
heroku login
heroku create your-app-name
git push heroku main
```

### Frontend Deployment (Vercel/Netlify)
```bash
npm run build
# Deploy build/ folder to Vercel or Netlify
```

## 📞 Support

For issues or questions, please open an issue on GitHub.

## 📄 License

MIT License - feel free to use this project for learning and development.

---

**Built with ❤️ by the development team**
