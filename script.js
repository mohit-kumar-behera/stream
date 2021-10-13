let client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let config = {
  appid: 'cc36b32fa0224b61a11d3d6f5b0c3d0a',
  token:
    '006cc36b32fa0224b61a11d3d6f5b0c3d0aIAD1h04ijOdkOQ9JKD/1N/8y4RlAM3TaBcBFWFq8yJ1MpNfYYSgAAAAAEABFl+dQU35oYQEAAQBTfmhh',
  uid: null,
  channel: 'join',
};

let localTracks = {
  audioTrack: null,
  videoTrack: null,
};

let localTrackState = {
  audioTrackMuted: false,
  videoTrackMuted: false,
};

let remoteTracks = {};

document.getElementById('join-btn').addEventListener('click', async () => {
  config.uid = document.getElementById('username').value;
  await joinStreams();
  document.getElementById('join-wrapper').style.display = 'none';
  document.getElementById('footer').style.display = 'flex';
});

document.getElementById('mic-btn').addEventListener('click', async () => {
  if (!localTrackState.audioTrackMuted) {
    await localTracks.audioTrack.setMuted(true);
    localTrackState.audioTrackMuted = true;
    document.getElementById('mic-btn').classList.add('active');
  } else {
    await localTracks.audioTrack.setMuted(false);
    localTrackState.audioTrackMuted = false;
    document.getElementById('mic-btn').classList.remove('active');
  }
});

document.getElementById('camera-btn').addEventListener('click', async () => {
  if (!localTrackState.videoTrackMuted) {
    await localTracks.videoTrack.setMuted(true);
    localTrackState.videoTrackMuted = true;
    document.getElementById('camera-btn').classList.add('active');
  } else {
    await localTracks.videoTrack.setMuted(false);
    localTrackState.videoTrackMuted = false;
    document.getElementById('camera-btn').classList.remove('active');
  }
});

document.getElementById('leave-btn').addEventListener('click', async () => {
  for (trackName in localTracks) {
    let track = localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      localTracks[trackName] = null;
    }
  }

  await client.leave();
  document.getElementById('footer').style.display = 'none';
  document.getElementById('user-streams').innerHTML = '';
  document.getElementById('join-wrapper').style.display = 'block';
});

const createPlayerMarkup = (data) => {
  return `
    <div class="video-containers" id="video-wrapper-${data.uid}">
      <p class="user-uid"><i class="fa fa-user volume-icon" id="volume-${data.uid}" ></i> ${data.uid}</p>
      <div class="video-player player" id="stream-${data.uid}"></div>
    </div>
  `;
};

const joinStreams = async () => {
  client.on('user-published', handleUserJoined);
  client.on('user-left', handleUserLeft);

  [config.uid, localTracks.audioTrack, localTracks.videoTrack] =
    await Promise.all([
      client.join(
        config.appid,
        config.channel,
        config.token || null,
        config.uid || null
      ),
      AgoraRTC.createMicrophoneAudioTrack(),
      AgoraRTC.createCameraVideoTrack(),
    ]);

  const playerMarkup = createPlayerMarkup(config);

  document
    .getElementById('user-streams')
    .insertAdjacentHTML('beforeend', playerMarkup);

  localTracks.videoTrack.play(`stream-${config.uid}`);
  await client.publish([localTracks.audioTrack, localTracks.videoTrack]);
};

const handleUserJoined = async (user, mediaType) => {
  remoteTracks[user.uid] = user;

  await client.subscribe(user, mediaType);

  if (mediaType === 'video') {
    let player = document.getElementById(`video-wrapper-${user.uid}`);

    if (player != null) {
      player.remove();
    }

    const playerMarkup = createPlayerMarkup(user);

    document
      .getElementById('user-streams')
      .insertAdjacentHTML('beforeend', playerMarkup);

    user.videoTrack.play(`stream-${user.uid}`);
  }

  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
};

const handleUserLeft = (user) => {
  delete remoteTracks[user.uid];
  document.getElementById(`video-wrapper-${user.uid}`).remove();
};
