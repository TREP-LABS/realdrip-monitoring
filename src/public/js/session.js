const stopSession = (event) => {
  event.preventDefault();
  const { sessionid: sessionId, deviceid: deviceId } = event.target.dataset;
  axios.post('/api/stop', { sessionId, deviceId })
    .then(() => {
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    })
    .catch((err) => {
      console.log('Error stopping session: ', err);
      alert('There was an error stopping the session');
    });
};

const button = (sessionStopped, sessionId, deviceId) => {
  if (sessionStopped) {
    return '<a href="#" class="btn btn-primary">View Data</a>';
  }
  return `<a href="#" class="btn btn-danger" id="stop-session" data-sessionId="${sessionId}" data-deviceId="${deviceId}">Stop</a>`;
};

const sessionHTML = ({
  _id: sessionId, name, deviceId, meta, data,
}, deviceIdToLabel) => `<div class="card" style="width: 18rem;">
    <div class="card-body">
      <h5 class="card-title">${name}</h5>
      <span class="bold">Device Label:&nbsp;</span>
      <span>${deviceIdToLabel[deviceId]}</span> <br/>
      <span class="bold">Meta:&nbsp;</span>
      <span>${meta}</span><br/>
      <span class="bold">Status:&nbsp;</span>
      <span>${data ? 'Stopped' : 'Active'}</span><br/><br>
      ${button(!!data, sessionId, deviceId)}
    </div>
  </div>`;

// eslint-disable-next-line no-unused-vars
const loadSessionsIntoView = (deviceIdToLabel) => {
  axios.get('/api/sessions').then((result) => {
    console.log('session data: ', result.data);
    if (!result.data.sessions.length) {
      document.querySelector('div.sessions').innerHTML = '<h2>No session recorded</h2>';
    } else {
      document.querySelector('div.sessions').innerHTML = result.data.sessions.map(session => sessionHTML(session, deviceIdToLabel)).join();
      document.querySelectorAll('a#stop-session').forEach((elem) => {
        elem.addEventListener('click', stopSession);
      });
    }
  })
    .catch((err) => {
      console.log('Error: ', err);
    });
};
