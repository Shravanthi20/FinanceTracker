require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const cron = require('node-cron');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug log for MONGO_URI
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
} else {
  console.log('📦 MONGO_URI loaded from .env');
}

// TEMP: disable TLS cert verification (for local dev only — remove in production)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ✅ Import Route Files
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const transactionsRoutes = require('./routes/transactions');
const invoicesRouter = require('./routes/invoices');
const reportsRouter = require('./routes/reports');
const forecastRouter = require('./routes/forecast');
const notificationsRouter = require('./routes/notifications');
const createExpenseRoutes = require('./routes/expenseRoutes');
const createGroupRoutes = require('./routes/groupRoutes');
const createUserRoutes = require('./routes/userRoutes');

// ✅ MongoDB Native Driver Setup
let db, Users, Groups, Expenses;

function deriveDbNameFromUri(uri) {
  try {
    const u = new URL(uri);
    // pathname starts with '/'
    const pathDb = u.pathname && u.pathname !== '/' ? u.pathname.slice(1) : '';
    return pathDb || process.env.MONGO_DB_NAME || 'FinanceTracker';
  } catch (e) {
    return process.env.MONGO_DB_NAME || 'FinanceTracker';
  }
}

async function connectMongoClient() {
  try {
    const enableTls = String(process.env.MONGO_TLS).toLowerCase() === 'true';
    const clientOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    };
    if (enableTls) clientOptions.tls = true;

    const client = new MongoClient(process.env.MONGO_URI, clientOptions);

    await client.connect();
    const targetDbName = deriveDbNameFromUri(process.env.MONGO_URI);
    db = client.db(targetDbName);
    Users = db.collection('Users');
    Groups = db.collection('Groups');
    Expenses = db.collection('Expenses');

    console.log(`✅ MongoDB Connected (Native Driver) — DB: ${db.databaseName}`);
  } catch (err) {
    console.error('❌ MongoDB connection error (Native Driver):', err.message);
    console.log('⚠️  Continuing with Mongoose connection only');
    // Don't exit - let Mongoose handle the database operations
  }
}

// ✅ Mongoose Connection Setup (for routes that use Mongoose models)
async function connectMongoose() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected (Mongoose)');
  } catch (err) {
    console.error('❌ Mongoose connection error:', err.message);
    process.exit(1);
  }
}

// Connect both drivers
connectMongoClient();
connectMongoose();

// ✅ Use Express Routes
app.use('/api/auth', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api', transactionsRoutes);
app.use('/api/invoices', invoicesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/notifications', notificationsRouter);

// ✅ Register Native Driver Routes (with DB check)
app.use('/api/users', (req, res, next) => {
  if (!Users) return res.status(500).json({ error: 'Database not initialized' });
  createUserRoutes(Users)(req, res, next);
});

app.use('/api/groups', (req, res, next) => {
  if (!Groups) return res.status(500).json({ error: 'Database not initialized' });
  createGroupRoutes(Groups)(req, res, next);
});

app.use('/api/expenses', (req, res, next) => {
  if (!Expenses) return res.status(500).json({ error: 'Database not initialized' });
  createExpenseRoutes(Expenses)(req, res, next);
});

// 🩺 Health Check Route
app.get('/', (req, res) => {
  res.send('Server is running ✅');
});

// 🔔 Simple cron to send due reminders every minute
try {
  const Reminder = require('./models/Reminder');
  const { sendNotification } = require('./utils/notification');
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    try {
      const due = await Reminder.find({ sent: false, sendAt: { $lte: now } }).limit(20);
      for (const r of due) {
        // Fetch user and preferences
        const User = require('./models/User');
        const user = await User.findById(r.user_id).select('email notificationPreferences');
        if (!user) continue;
        const channel = r.channel || user.notificationPreferences?.channel || 'email';
        try {
          await sendNotification({
            channel,
            email: user.email,
            phone: user.notificationPreferences?.phone,
            subject: 'Reminder',
            text: r.message,
            html: `<p>${r.message}</p>`,
          });
          r.sent = true;
          r.error = null;
        } catch (e) {
          r.error = e.message;
        }
        await r.save();
      }
    } catch (e) {
      console.error('Reminder cron error:', e.message);
    }
  });
  console.log('🔔 Reminder cron scheduled (every minute)');
} catch (e) {
  console.warn('Reminder cron not started:', e.message);
}

// 🚀 Start Server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
