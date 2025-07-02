// src/app.ts

import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import session from 'express-session';
import connectMongoDBSession from 'connect-mongodb-session';

import courseRoutes from './routes/courseRoutes';
import registrationRoutes from './routes/registrationRoutes';


const app = express();
const MongoDBStore = connectMongoDBSession(session);

const MONGODB_URI = 'mongodb://127.0.0.1:27017/Courses';
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions',
});

store.on('error', (error) => {
  console.error('Session store error:', error);
});

app.use(bodyParser.json());

app.use(
  session({
    secret: 'This is my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// Route Middlewares
app.use('/', courseRoutes); // POST /add/courseOffering
app.use('/', registrationRoutes); // POST /add/register/:course_id
 // POST /cancel/:registration_id

// Start server after MongoDB connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(7070, () => console.log('Server running on port 7070'));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });


