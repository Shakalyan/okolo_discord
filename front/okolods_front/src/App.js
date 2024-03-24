import logo from './logo.svg';
import './App.css';

function App() {

    let localStream;

    const setupDevice = async () => {
        console.log('setupDevice invoked');
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const localPlayer = document.getElementById('localPlayer');
        localPlayer.srcObject = localStream;
    };

    let socket;

    let peers = [];

    let onIceCandidate = (event) => {
        if (event.candidate) {
            socket.send(JSON.stringify({
                type: 'candidate',
                candidate: event.candidate
            }));
        }
    }

    let buttonOnClick = function() {
        socket = new WebSocket("ws://192.168.1.66:8001");
        
        socket.addEventListener("open", async (event) => {
            console.log("socket opened");
            await setupDevice();
            
            let message = {};
            message.type = "start_call";
            message.sdp = "SOME_SDP_DATA";
            socket.send(JSON.stringify(message));
        });

        socket.addEventListener("message", (event) => {
            console.log(`From socket: ${event.data}`);
            
            let message = JSON.parse(event.data);
            if (message['type'] == 'start_call') {
                console.log("received start_call message");
                let peerConnection = new RTCPeerConnection();
                peerConnection.onicecandidate = onIceCandidate;
                localStream.getTracks().forEach(track => {
                    console.log("add track before offer");
                    peerConnection.addTrack(track, localStream);
                });
                peerConnection.createOffer().then((description) => {
                    peerConnection.setLocalDescription(description);
                    let offerMsg = {};
                    offerMsg.type = 'offer';
                    offerMsg.description = description;
                    socket.send(JSON.stringify(offerMsg));
                });
                peers.push(peerConnection);
            } 
            else if (message['type'] == 'offer') {
                console.log("received offer");
                let peerConnection = new RTCPeerConnection();
                peers.push(peerConnection);
                peerConnection.onicecandidate = onIceCandidate;
                localStream.getTracks().forEach(track => {
                    console.log("add track before answer");
                    peerConnection.addTrack(track, localStream);
                });
                peerConnection.addEventListener("track", (event) => {
                    console.log("TRACK");
                    console.log(event.streams);
                    const remotePlayer = document.getElementById('remotePlayer');
                    remotePlayer.srcObject = event.streams[0];
                });
                peerConnection.setRemoteDescription(message.description)
                .then(async () => {
                    let description = await peerConnection.createAnswer();
                    peerConnection.setLocalDescription(description);
                    let answer = {
                        type: 'answer',
                        answer: description
                    };
                    socket.send(JSON.stringify(answer));
                });
                
            }
            else if (message['type'] == 'answer') {
                console.log("received answer");
                let peerConnection = peers[0];
                peerConnection.setRemoteDescription(message.answer);
                peerConnection.addEventListener("track", (event) => {
                    console.log("TRACK");
                    console.log(event.streams);
                    const remotePlayer = document.getElementById('remotePlayer');
                    remotePlayer.srcObject = event.streams[0];
                });
            }
            else if (message['type'] == 'candidate') {
                console.log("received candidate");
                let peerConnection = peers[0];
                peerConnection.addIceCandidate(message.candidate);
            }

        });

    };

    return (
        <div className="App">
            <button onClick={buttonOnClick}>Connect</button>
            <video
                id="localPlayer"
                autoPlay
                style={{width: 320, height: 240}}
            />
            <video
                id="remotePlayer"
                autoPlay
                style={{width: 320, height: 240}}
            />
        </div>
    );
}

export default App;
