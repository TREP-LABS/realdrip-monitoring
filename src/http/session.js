import firebaseApp from 'firebase/app';
import 'firebase/database';
import fbConfig from './fbConfig';
import * as redis from './redis';


firebaseApp.initializeApp(fbConfig);


export const startListening = async (deviceId, sessionId, interval) => {
  let lastExecutionTimeStamp = null;

  firebaseApp.database().ref(`/devices/${deviceId}/flowRate`).on('value', async (snapshot) => {
    const data = snapshot.val();

    const sessionData = await redis.getAsync(deviceId);
    if (sessionData) {
      const currentExecutionTimeStamp = new Date().getTime();
      if (currentExecutionTimeStamp - lastExecutionTimeStamp < interval) return;

      const sessionDataAsJSON = JSON.parse(sessionData);
      sessionDataAsJSON.data[new Date().toISOString()] = data;
      await redis.setAsync(deviceId, JSON.stringify(sessionDataAsJSON));

      lastExecutionTimeStamp = currentExecutionTimeStamp;
    } else {
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
