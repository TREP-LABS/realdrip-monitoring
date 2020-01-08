import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import db from './db';
import * as redis from './redis';
import { startListening, stopListening } from './session';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// Enabling CORS for browser clients
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

const validateInput = () => {
  // @todo: compost validation logic
};

const { Session } = db;

app.post('/api/start', async (req, res) => {
  validateInput(req.body);

  const {
    name, interval, deviceId, meta,
  } = req.body;

  try {
    // If a session has already been started for this device, return error response.
    if (await redis.getAsync(deviceId)) return res.status(400).end('A session is ongoing for this device');

    // Save a new session in the DB
    const newSession = await new Session({
      name, interval, deviceId, meta,
    }).save();

    const sessionId = newSession.toJSON()._id;

    // Setup a listener for the device
    startListening(deviceId, sessionId, interval);

    return res.status(201).json({
      message: 'Session created successfully',
      data: newSession.toJSON(),
    });
  } catch (error) {
    console.log('An error occured while trying to start a session');
    console.log(error);
    return res.status(500).json({
      message: 'An error occured while trying to start a session',
      error,
    });
  }
});

app.post('/api/stop', async (req, res) => {
  validateInput(req.body);

  const { deviceId } = req.body;

  try {
    const sessionData = await redis.getAsync(deviceId);
    if (!sessionData) return res.status(400).end('Session does not exist');

    const sessionDataAsJSON = JSON.parse(sessionData);

    const { sessionId, data, listenerId } = sessionDataAsJSON;

    await stopListening(listenerId);

    await Session.updateOne({ _id: sessionId }, { $set: { data } });

    await redis.delAsync(deviceId);

    return res.status(200).end('Session stopped');
  } catch (error) {
    console.log('An error occured while trying to stop a session');
    console.log(error);
    return res.status(500).json({
      message: 'An error occured while trying to stop a session',
      error,
    });
  }
});

app.get('/api/sessions', async (req, res) => {
  const sessions = await Session.find({});
  return res.status(200).json({ sessions });
});

app.listen(process.env.PORT || 9000, () => {
  console.log('App listening on PORT', process.env.PORT || 9000);
});
