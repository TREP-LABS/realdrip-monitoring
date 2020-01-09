import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import uuid from 'uuid/v4';
import apiRoutes from './apiRoutes';
import { log, logMiddleware } from './utils/logger';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const reqId = uuid();
  res.locals.log = log.child({ reqId });
  next();
}, (req, res, next) => logMiddleware(res.locals.log)(req, res, next));

app.use(express.static(path.join(__dirname, 'public')));

// Enabling CORS for browser clients
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

app.use('/api', apiRoutes);

app.listen(process.env.PORT || 9000, () => {
  console.log('App listening on PORT', process.env.PORT || 9000);
});
