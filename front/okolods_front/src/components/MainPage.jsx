import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import '../styles/MainPage.css'
import { api_accountEcho, api_getAccountChats, api_getAccountServers, api_getAllMessagesByChatId, api_getServerById, api_getTextChannelMessages, backendHost, wsapi_joinVoiceChat, wsapi_leaveVoiceChat, wsapi_webrtcAnswer, wsapi_webrtcCandidate, wsapi_webrtcOffer, wsapi_webrtcStartCall } from "../api.js";
import NewChatForm from "./NewChatForm.jsx";
import { NewServerForm } from './NewServerForm.jsx';
import { useEffect, useState, useRef } from "react";
import Chat from "./chat/Chat.jsx";
import { MsList } from "./main/MsList.jsx";
import { Server } from './server/Server.jsx';
import ContextMenu from './general/ContextMenu.jsx';

export default function MainPage() {

    const [ws, setWs] = useState(null);

    const chatListRef = useRef([]);
    const [chatList, setChatList] = useState([]);

    const serverListRef = useRef([]);
    const [serverList, setServerList] = useState([]);
    const serverDataRef = useRef({});
    const [serverData, setServerData] = useState({});

    const accountDataRef = useRef(null);
    const [accountData, setAccountData] = useState(null);

    const [chosenChatId, setChosenChatId] = useState('');
    const [chosenServerId, setChosenServerId] = useState('');
    const chosenTextChannelId = useRef('');
    const chosenVoiceChannelId = useRef(null);

    const messageListRef = useRef([]);
    const [messageList, setMessageList] = useState([]);

    const contextMenu = useRef();
    const [contextMenuActions, setContextMenuActions] = useState([]);

    const localStreamRef = useRef(null);
    const peerConnections = useRef([]);

    const RenderedComponent = {
        None: 0,
        Chat: 1,
        NewChatForm: 2,
        NewServerForm: 3,
        Server: 4,
        ServerChat: 5,
        ServerConference: 6
    };
    const [renderedComponent, _setRenderedComponent] = useState(RenderedComponent.None);
    let renderedComponentInfo = useRef({type: RenderedComponent.None});
    function setRenderedComponent(component, info) {
        _setRenderedComponent(component);
        renderedComponentInfo.current = {
            type: component,
            info: info
        };
    }
    

    function chatTabClick(event, id) {
        setChosenChatId(id);
        api_getAllMessagesByChatId(id).then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    setRenderedComponent(RenderedComponent.Chat, {id: id});
                    setMessageList(json);
                    messageListRef.current = json;
                })
            }
        })
    }

    function serverTabClick(event, id) {
        setChosenServerId(id);
        api_getServerById(id).then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    console.log(json);
                    serverDataRef.current = json;
                    setServerData(json);
                    setRenderedComponent(RenderedComponent.Server, {id: id});
                })
            }
        })
    }

    function textChannelTabClick(event, id) {
        chosenTextChannelId.current = id;
        api_getTextChannelMessages(id).then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    console.log(json);
                    setRenderedComponent(RenderedComponent.ServerChat, {channel: "text", id: id});
                    setMessageList(json);
                    messageListRef.current = json;
                })
            }
        })
    }

    function voiceChannelTabClick(event, id) {
        if (chosenVoiceChannelId.current == id) {
            console.log("ALREADY IN THAT VOICE CHAT")
            return;
        }
        if (chosenVoiceChannelId.current) {
            console.log("LEAVING PREVIOUS VOICE CHAT....")
            wsapi_leaveVoiceChat(ws, chosenVoiceChannelId.current);
        }
        wsapi_joinVoiceChat(ws, id);
        setRenderedComponent(RenderedComponent.ServerConference, {channel: "voice", id: id});
    }

    function leaveChannelButtonClick(event) {
        if (!chosenVoiceChannelId.current)
            return;

        localStreamRef.current.getTracks().forEach(function(track) {
            track.stop();
        });
        setRenderedComponent(RenderedComponent.Server, {});
        wsapi_leaveVoiceChat(ws, chosenVoiceChannelId.current);
        localStreamRef.current = null;
    }

    function appendToChatList(chat) {
        chatListRef.current.push(chat);
        setChatList([...chatListRef.current]);
    }

    function appendToServerList(server) {
        serverListRef.current.push(server);
        setServerList([...serverListRef.current]);
    }

    function appendToMessageList(msg) {
        messageListRef.current.push(msg);
        setMessageList([...messageListRef.current]);
    }

    function setupDevices() {
        console.log('setupDevice invoked');
        return navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    }

    function isServerRendered() {
        return  renderedComponent == RenderedComponent.Server || 
                renderedComponent == RenderedComponent.ServerChat ||
                renderedComponent == RenderedComponent.ServerConference;
    }

    function createPeerConnection(socket, roomId, interlocutorId) {
        let peerConnection = new RTCPeerConnection();
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                wsapi_webrtcCandidate(socket, roomId, accountDataRef.current.id, interlocutorId, event.candidate);
            }
        };
        localStreamRef.current.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStreamRef.current);
        });
        peerConnection.addEventListener("track", (event) => {
            let voiceChannel = serverDataRef.current.voiceChannels.find((vc) => vc.id == roomId);
            let member = voiceChannel.activeMembers.find((am) => am.id == interlocutorId);
            member.stream = event.streams[0];
            setServerData({...serverDataRef.current})
        });
        peerConnections.current.push({
            interlocutorId: interlocutorId,
            peerConnection: peerConnection
        });
        return peerConnection;
    }

    function initWebSocket() {
        let socket = new WebSocket(`ws://${backendHost}/ws/${localStorage.getItem('token')}`);
        socket.onopen = (event) => {
            console.log("open socket");
        };
        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            console.log(msg);
            
            if (msg.type == 'chat') {
                if (msg.subtype == 'new') {
                    appendToChatList(msg.data);
                }
                if (msg.subtype == 'newMessage') {
                    if (renderedComponentInfo.current.type == RenderedComponent.Chat &&
                        renderedComponentInfo.current.info.id == msg.data.chatId) 
                    {
                        appendToMessageList(msg.data);
                    }
                }
            }
            else if (msg.type == 'server' && isServerRendered()) {
                if (msg.subtype == 'new') {
                    appendToServerList(msg.data);
                }
                else if (msg.subtype == 'newVoiceChannel') {
                    serverDataRef.current.voiceChannels.push(msg.data);
                    setServerData({...serverDataRef.current});
                }
                else if (msg.subtype == 'newTextChannel') {
                    serverDataRef.current.textChannels.push(msg.data);
                    setServerData({...serverDataRef.current});
                }
                else if (msg.subtype == 'newMessage') {
                    if (renderedComponentInfo.current.type == RenderedComponent.Server &&
                        renderedComponentInfo.current.info.channel == 'text' &&
                        renderedComponentInfo.current.info.id == msg.data.chatId) {
                            appendToMessageList(msg.data);
                    }                    
                }
            }
            else if (msg.type == 'room') {
                if (msg.subtype == 'join') {
                    let voiceChannel = serverDataRef.current.voiceChannels.find((vc) => vc.id ==  msg.data.id);
                    if (accountDataRef.current.id == msg.data.accountData.id) {
                        msg.data.accountData.muteMic = true;
                        if (!localStreamRef.current) {
                            setupDevices().then((stream) => {
                                localStreamRef.current = stream;
                                msg.data.accountData.stream = localStreamRef.current;
                                voiceChannel.activeMembers.push(msg.data.accountData);
                                setServerData({...serverDataRef.current});
                                chosenVoiceChannelId.current = msg.data.id;
                                wsapi_webrtcStartCall(socket, msg.data.id, accountDataRef.current.id);
                            })
                            return;
                        }
                        msg.data.accountData.stream = localStreamRef.current;
                        chosenVoiceChannelId.current = msg.data.id;                  
                        wsapi_webrtcStartCall(socket, msg.data.id, accountDataRef.current.id);
                    }
                    msg.data.accountData.muteMic = false;
                    voiceChannel.activeMembers.push(msg.data.accountData);
                    setServerData({...serverDataRef.current});
                }
                else if (msg.subtype == 'leave') {
                    let voiceChannel = serverDataRef.current.voiceChannels.find((vc) => vc.id ==  msg.data.id);
                    for (let i = 0; i < voiceChannel.activeMembers.length; ++i) {
                        if (voiceChannel.activeMembers[i].id == msg.data.accountData.id) {
                            voiceChannel.activeMembers.splice(i, 1);
                            break;
                        }
                    }
                    for (let i = 0; i < peerConnections.current.length; ++i) {
                        if (peerConnections.current[i].interlocutorId == msg.data.accountData.id) {
                            peerConnections.current.splice(i, 1);
                            break;
                        }
                    }
                    setServerData({...serverDataRef.current});
                    if (msg.data.accountData.id == accountDataRef.current.id) {
                        chosenVoiceChannelId.current = null;
                        peerConnections.current = [];
                    }
                        
                }
            }
            else if (msg.type == 'webrtc') {
                if (msg.subtype == 'startCall') {
                    console.log('StartCall');
                    let peerConnection = createPeerConnection(socket, msg.data.roomId, msg.data.senderId);
                    peerConnection.createOffer().then(dsc => {
                        peerConnection.setLocalDescription(dsc);
                        wsapi_webrtcOffer(socket, msg.data.roomId, accountDataRef.current.id, msg.data.senderId, dsc);
                    });                    
                }
                else if (msg.subtype == 'offer') {
                    if (msg.data.receiverId != accountDataRef.current.id)
                        return
                    console.log('offer');
                    let peerConnection = createPeerConnection(socket, msg.data.roomId, msg.data.senderId);
                    peerConnection.setRemoteDescription(msg.data.dsc).then(async () => {
                        let dsc = await peerConnection.createAnswer();
                        peerConnection.setLocalDescription(dsc);
                        wsapi_webrtcAnswer(socket, msg.data.roomId, accountDataRef.current.id, msg.data.senderId, dsc);
                    });
                }
                else if (msg.subtype == 'answer') {
                    let peerConnection = peerConnections.current.find((pc) => pc.interlocutorId == msg.data.senderId).peerConnection;
                    peerConnection.setRemoteDescription(msg.data.dsc);
                }
                else if (msg.subtype == 'candidate') {
                    let peerConnection = peerConnections.current.find((pc) => pc.interlocutorId == msg.data.senderId).peerConnection;
                    peerConnection.addIceCandidate(msg.data.candidate);
                }
            }
        };
        setWs(socket);
    }

    function loadInitialData() {
        api_accountEcho().then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    setAccountData(json);
                    accountDataRef.current = json;
                })
            }
        });

        api_getAccountChats().then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    setChatList(json);
                    chatListRef.current = json;
                });
            }
        });

        api_getAccountServers().then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    setServerList(json);
                    serverListRef.current = json;
                })
            }
        })
    }

    useEffect(() => {
        initWebSocket();
        loadInitialData();
    }, []);


    function callContextMenu(event, actions) {
        event.preventDefault();
        contextMenu.current.style.left = `${event.clientX}px`
        contextMenu.current.style.top = `${event.clientY}px`
        contextMenu.current.hidden = false;
        setContextMenuActions(actions);
    }

    document.onclick = (event) => {
        contextMenu.current.hidden = true;
    }


    return (
        <div id="main_container">
            <div id="main_left_panel">
                <Tabs
                    defaultActiveKey="messages"
                    className="mb-3 tab_text_color"
                    fill
                >
                    <Tab eventKey="messages" title="Messages">
                        <MsList list={chatList}
                                newTabClick={() => setRenderedComponent(RenderedComponent.NewChatForm, {})}
                                tabClick={chatTabClick}/>
                    </Tab>
                    <Tab eventKey="servers" title="Servers">
                        <MsList list={serverList}
                                newTabClick={() => setRenderedComponent(RenderedComponent.NewServerForm, {})}
                                tabClick={serverTabClick}/>
                    </Tab>
                </Tabs>
            </div>
            <div id="main_right_area">
                {renderedComponent == RenderedComponent.NewChatForm   && <NewChatForm ws={ws} 
                                                                                      accountData={accountData}/>}

                {renderedComponent == RenderedComponent.Chat          && <Chat    chatId={chosenChatId} 
                                                                                  ws={ws} 
                                                                                  messageList={messageList}
                                                                                  convType="chat"/>}

                {renderedComponent == RenderedComponent.NewServerForm && <NewServerForm ws={ws} 
                                                                                        accountData={accountData}/>}

                {(isServerRendered()
                 ) && <Server ws={ws} 
                        serverData={serverData}
                        callContextMenu={callContextMenu}
                        textChannelTabClick={textChannelTabClick}
                        textChannelMessageList={messageList}
                        chosenTextChannelId={chosenTextChannelId.current}
                        chosenVoiceChannelId={chosenVoiceChannelId.current}
                        renderedComponent={renderedComponent}
                        voiceChannelTabClick={voiceChannelTabClick}
                        leaveChannelButtonClick={leaveChannelButtonClick}
                    />}
            </div>
            <ContextMenu ref={contextMenu} actions={contextMenuActions}/>
        </div>
    );
}