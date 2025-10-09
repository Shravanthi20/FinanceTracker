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

// ✅ Debug log
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  process.exit(1);
} else {
  console.log('📦 MONGO_URI loaded from .env');
}

// ⚠️ Local-only TLS bypass
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ✅ Import all route files
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

// ✅ Mongoose routes
const goalRoutes = require('./routes/goalRoutes');
const contributionRoutes = require('./routes/contributionRoutes');

// ✅ Mongoose models
const Goals = require('./models/Goal');
const Contributions = require('./models/Contribution');
const Groups = require('./models/Groups');

// ✅ Native MongoDB
let db, Users, Expenses;

async function connectMongoClient() {
  try {
    const client = new MongoClient(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    db = client.db('FinanceTracker');
    Users = db.collection('Users');
    Expenses = db.collection('Expenses');
    console.log(`✅ MongoDB Connected (Native Driver) — DB: ${db.databaseName}`);
  } catch (err) {
    console.error('❌ MongoDB Native error:', err.message);
  }
}

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

// 🔌 Connect both
connectMongoClient();
connectMongoose();

// ✅ Express routes
app.use('/api/auth', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api', transactionsRoutes);
app.use('/api/invoices', invoicesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/notifications', notificationsRouter);

// ✅ Native routes
app.use('/api/users', (req, res, next) => {
  if (!Users) return res.status(500).json({ error: 'Database not initialized' });
  createUserRoutes(Users)(req, res, next);
});

app.use('/api/expenses', (req, res, next) => {
  if (!Expenses) return res.status(500).json({ error: 'Database not initialized' });
  createExpenseRoutes(Expenses)(req, res, next);
});

// ✅ Use Mongoose-based model for groups (no native)
app.use('/api/groups', createGroupRoutes(Groups));

// ✅ Use Mongoose models directly for these
app.use('/api/goals', goalRoutes);
app.use('/api/contributions', contributionRoutes);

// 🩺 Health check
app.get('/', (req, res) => res.send('Server is running ✅'));

// 🔔 Reminder cron
try {
  const Reminder = require('./models/Reminder');
  const { sendNotification } = require('./utils/notification');

  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const due = await Reminder.find({ sent: false, sendAt: { $lte: now } }).limit(20);
    for (const r of due) {
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
  });

  console.log('🔔 Reminder cron scheduled');
} catch (e) {
  console.warn('Reminder cron not started:', e.message);
}

// 🚀 Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
