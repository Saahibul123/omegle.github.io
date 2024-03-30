const appID = 12345678;
const server = "your-server-url.com";

const zg = new ZegoExpressEngine(appID, server);

let localStream;
let remoteStream;
let peerConnection;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

startButton.addEventListener('click', startChat);
stopButton.addEventListener('click', stopChat);

async function startChat() {
  try {
    localStream = await zg.createStream();
    localStream.init(localVideo, {
      audio: true,
      video: true,
    });
    startButton.disabled = true;
    stopButton.disabled = false;

    peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        zg.sendICECandidate(event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      remoteVideo.srcObject = remoteStream;
    };

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    zg.on('roomStateChanged', (roomID, reason, errorCode, extendedData) => {
      if (reason === 'DISCONNECTED' && errorCode === 0) {
        stopChat();
      }
    });

    zg.loginRoom('random-video-chat-room', token, { userID: 'user1' }, { userUpdate: true });

  } catch (error) {
    console.error(error);
  }
}

function stopChat() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (localStream) {
    localStream.destroy();
    localStream = null;
  }
  if (remoteStream) {
    remoteStream.getTracks().forEach((track) => track.stop());
    remoteStream = null;
  }
  startButton.disabled = false;
  stopButton.disabled = true;
}

async function generateToken() {
  // You can implement your own token generation logic here, or use a third-party service.
  // This is just a placeholder function.
  const response = await fetch('/token');
  const data = await response.json();
  return data.token;
}

let token = await generateToken();
