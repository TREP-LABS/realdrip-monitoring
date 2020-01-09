import express from 'express';
import * as redis from './redis';
import * as session from './session';
import * as validation from './validation';
import db from './db';

const router = express.Router();
const { Session } = db;

router.post('/start', validation.startListening, async (req, res) => {
  const {
    name, interval, deviceId, meta,
  } = req.body;
  const { log } = res.locals;

  try {
    // If a session has already been started for this device, return error response.
    if (await redis.getAsync(deviceId)) return res.status(400).end('A session is ongoing for this device');

    log.debug('Save a new session into DB');
    const newSession = await new Session({
      name, interval, deviceId, meta,
    }).save();

    const sessionId = newSession.toJSON()._id;
    // The interval value in milliseconds.
    const intervalInMS = interval * 60 * 1000;

    log.debug('Start listening for changes to the data of this session');
    await session.startListening(deviceId, sessionId, intervalInMS);

    return res.status(201).json({
      message: 'Session created successfully',
      data: newSession.toJSON(),
    });
  } catch (error) {
    log.error('An error occured while trying to start a session: ', error);
    return res.status(500).json({
      message: 'An error occured while trying to start a session',
      error,
    });
  }
});

router.post('/stop', validation.stopListening, async (req, res) => {
  const { deviceId } = req.body;
  const { log } = res.locals;

  try {
    const sessionData = await redis.getAsync(deviceId);
    if (!sessionData) return res.status(400).end('Session does not exist');

    const sessionDataAsJSON = JSON.parse(sessionData);

    const { sessionId, data, listenerId } = sessionDataAsJSON;

    log.debug('Stop listening to changes to the data of this session');
    await session.stopListening(listenerId);

    log.debug('Update session in DB with the varying data of the session');
    await Session.updateOne({ _id: sessionId }, { $set: { data } });

    await redis.delAsync(deviceId);

    return res.status(200).end('Session stopped');
  } catch (error) {
    log.error('An error occured while trying to stop a session: ', error);
    return res.status(500).json({
      message: 'An error occured while trying to stop a session',
      error,
    });
  }
});

router.get('/sessions', async (req, res) => {
  const sessions = await Session.find({});
  return res.status(200).json({ sessions });
});

export default router;
