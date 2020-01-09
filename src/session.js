import firebaseApp from 'firebase/app';
import 'firebase/database';
import fbConfig from './fbConfig';
import * as redis from './redis';
import { log } from './utils/logger';

firebaseApp.initializeApp(fbConfig);

export const startListening = async (deviceId, sessionId, interval) => {
  let lastExecutionTimeStamp = null;

  firebaseApp.database().ref(`/devices/${deviceId}/flowRate`).on('value', async (snapshot) => {
    log.debug(`Firebase listener triggered for session: ${sessionId} and deviceId: ${deviceId}`);
    const data = snapshot.val();

    log.debug(`Snapshot value: ${data}`);

    const sessionData = await redis.getAsync(deviceId);
    if (sessionData) {
      log.debug('Deivce has an ongoing session, checking if time interval would allow update...');
      const currentExecutionTimeStamp = new Date().getTime();
      if (currentExecutionTimeStamp - lastExecutionTimeStamp < interval) {
        log.debug(`It's not been up to ${interval} since the last update, exiting listener without update`);
        return;
      }

      log.debug(`It's been up to ${interval} since the last update, updating data in redis`);
      const sessionDataAsJSON = JSON.parse(sessionData);
      sessionDataAsJSON.data[new Date().toISOString()] = data;
      await redis.setAsync(deviceId, JSON.stringify(sessionDataAsJSON));

      lastExecutionTimeStamp = currentExecutionTimeStamp;
    } else {
      log.debug('Deivce does not have an ongoing session, setting a new session in redis');
      await redis.setAsync(deviceId, JSON.stringify({
        sessionId,
        data: {
          [new Date().toISOString()]: data,
        },
      }));
      lastExecutionTimeStamp = new Date().getTime();
    }
  });
};

export const stopListening = deviceId => firebaseApp.database().ref(`/devices/${deviceId}/flowRate`).off();
