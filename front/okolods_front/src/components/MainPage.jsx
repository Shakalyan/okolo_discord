import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import '../styles/MainPage.css'
import '../styles/Settings.css'
import { api_accountEcho, api_getAccountChats, api_getAccountServers, api_getAllMessagesByChatId, api_getAvatar, api_getServerById, api_getTextChannelMessages, backendHost, wsapi_joinVoiceChat, wsapi_leaveVoiceChat, wsapi_webrtcAnswer, wsapi_webrtcCandidate, wsapi_webrtcOffer, wsapi_webrtcStartCall } from "../api.js";
import NewChatForm from "./NewChatForm.jsx";
import { NewServerForm } from './NewServerForm.jsx';
import { useEffect, useState, useRef } from "react";
import Chat from "./chat/Chat.jsx";
import { MsList } from "./main/MsList.jsx";
import { Server } from './server/Server.jsx';
import ContextMenu from './general/ContextMenu.jsx';
import { useRenderedRef } from '../fns.js';
import MemberList from './main/MemberList.jsx';
import { CiSettings } from "react-icons/ci";
import { IoLogOutOutline } from "react-icons/io5";
import AccountSettings from './AccountSettings.jsx';
import Avatar from './general/Avatar.jsx';
import IconButton from './general/IconButton.jsx';
import { useNavigate } from 'react-router-dom';

export default function MainPage() {


    //GENERAL
    const ws = useRef(null);
    const accountData = useRenderedRef({});
    const contextMenu = useRef();
    const [contextMenuActions, setContextMenuActions] = useState([]);
    const navigate = useNavigate();

    const RenderedComponent = {
        None: 0,
        Chat: 1,
        NewChatForm: 2,
        NewServerForm: 3,
        Server: 4,
        ServerChat: 5,
        ServerConference: 6,
        AccountSettings: 7
    };
    const renderedComponent = useRenderedRef(RenderedComponent.None);

    // LEFT PANEL
    const chatList = useRenderedRef([]);
    const serverList = useRenderedRef([]);

    // SERVER
    const serverData = useRenderedRef({});
    const textChannelData = useRenderedRef({});
    const voiceChannelData = useRenderedRef({});
    const localStreamRef = useRef(null);
    const peerConnections = useRef([]);

    // CHAT
    const chatData = useRenderedRef({});


    async function fetchAvatars(members) {
        let mmbs = [];
        for (let i = 0; i < members.length; ++i) {
            let m = members[i];
            let response = await api_getAvatar(m.id);
            if (response.status == 200) {
                let blob = await response.blob();
                mmbs.push({...m, avatar: blob});
            }
        }
        return mmbs;
    }

    function chatTabClick(event, id) {
        api_getAllMessagesByChatId(id).then((response) => {
            if (response.status == 200) {
                response.json().then(async (json) => {
                    chatData
                    .set({
                        id: id,
                        messageList: json['messages'],
                        members: await fetchAvatars(json['members'])
                    })
                    .update();
                    renderedComponent.set(RenderedComponent.Chat).update();
                })
            }
        })
    }

    function serverTabClick(event, id) {
        api_getServerById(id).then((response) => {
            if (response.status == 200) {
                response.json().then(async (json) => {
                    json.members = await fetchAvatars(json.members);
                    json.voiceChannels.forEach(vc => {
                        vc.activeMembers.forEach(am => {
                            am.avatar = json.members.find(m => m.id == am.id).avatar;
                        });
                    });
                    serverData.set(json);
                    serverData.update();
                    renderedComponent.set(RenderedComponent.Server).update();
                })
            }
        })
    }

    const serverCallbacks = {
        textChannelTabClick: (event, id) => {
            api_getTextChannelMessages(id).then((response) => {
                if (response.status == 200) {
                    response.json().then((json) => {
                        renderedComponent.set(RenderedComponent.ServerChat).update();
                        textChannelData
                        .set({
                            id: id,
                            messageList: json
                        })
                        .update();
                    })
                }
            })
        },
    
        voiceChannelTabClick: (event, id) => {
            if (voiceChannelData.get().id == id) {
                console.log("ALREADY IN THAT VOICE CHAT")
                return;
            }
            if (voiceChannelData.get().id) {
                console.log("LEAVING PREVIOUS VOICE CHAT....")
                wsapi_leaveVoiceChat(ws.current, voiceChannelData.get().id);
            }
            wsapi_joinVoiceChat(ws.current, id);
            renderedComponent.set(RenderedComponent.ServerConference).update();
        },
    
        leaveChannelButtonClick: (event) => {
            if (!voiceChannelData.get().id)
                return;
    
            localStreamRef.current.getTracks().forEach(function(track) {
                track.stop();
            });
            renderedComponent.set(RenderedComponent.Server).update();
            wsapi_leaveVoiceChat(ws.current, voiceChannelData.get().id);
            localStreamRef.current = null;
        },

        conferenceButtonClick: (event) => {
            renderedComponent.set(RenderedComponent.ServerConference).update();
        },

        videoOffOnButtonClick: (event) => {
            let member = voiceChannelData.get().activeMembers.find((am) => am.id == accountData.get().id);
            member.params.muteVideo = !member.params.muteVideo;
            member.stream.getTracks()[1].enabled = !member.params.muteVideo;
        }
    };

    
    function setupDevices() {
        return navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    }

    function isServerRendered() {
        return  renderedComponent.get() == RenderedComponent.Server || 
                renderedComponent.get() == RenderedComponent.ServerChat ||
                renderedComponent.get() == RenderedComponent.ServerConference;
    }

    function createPeerConnection(socket, roomId, interlocutorId) {
        let peerConnection = new RTCPeerConnection();
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                wsapi_webrtcCandidate(socket, roomId, accountData.get().id, interlocutorId, event.candidate);
            }
        };
        localStreamRef.current.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStreamRef.current);
        });
        peerConnection.addEventListener("track", (event) => {
            let voiceChannel = serverData.get().voiceChannels.find((vc) => vc.id == roomId);
            let member = voiceChannel.activeMembers.find((am) => am.id == interlocutorId);
            member.stream = event.streams[0];
            serverData.update();
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
                    chatList.get().push(msg.data);
                    chatList.update();
                }
                if (msg.subtype == 'newMessage') {
                    if (renderedComponent.get() == RenderedComponent.Chat &&
                        chatData.get().id == msg.data.chatId) 
                    {
                        chatData.get().messageList.push(msg.data);
                        chatData.update();
                    }
                }
            }
            else if (msg.type == 'server') {
                if (msg.subtype == 'new') {
                    serverList.get().push(msg.data);
                    serverList.update();
                }
                else if (msg.subtype == 'newVoiceChannel' &&
                         isServerRendered() &&
                         serverData.get().id == msg.data.serverId) {
                    serverData.get().voiceChannels.push(msg.data);
                    serverData.update();
                }
                else if (msg.subtype == 'newTextChannel' &&
                         isServerRendered() &&
                         serverData.get().id == msg.data.serverId) {
                    serverData.get().textChannels.push(msg.data);
                    serverData.update();
                }
                else if (msg.subtype == 'newMessage') {
                    if (renderedComponent.get() == RenderedComponent.ServerChat &&
                        textChannelData.get().id == msg.data.chatId) {
                            textChannelData.get().messageList.push(msg.data);
                            textChannelData.update();
                    }                    
                }
            }
            else if (msg.type == 'room') {
                if (msg.subtype == 'join' &&
                    isServerRendered() &&
                    serverData.get().id == msg.data.serverId) 
                {
                    let voiceChannel = serverData.get().voiceChannels.find((vc) => vc.id ==  msg.data.id);
                    if (accountData.get().id == msg.data.accountData.id) {
                        voiceChannelData.set(voiceChannel);

                        msg.data.accountData.params = {
                            volume: 0,
                            muteVideo: false
                        };

                        if (!localStreamRef.current) {
                            setupDevices().then((stream) => {
                                localStreamRef.current = stream;
                                msg.data.accountData.stream = localStreamRef.current;
                                msg.data.accountData.avatar = serverData.get().members.find(m => m.id == msg.data.accountData.id).avatar;
                                voiceChannel.activeMembers.push(msg.data.accountData);
                                serverData.update();
                                voiceChannelData.get().id = msg.data.id;
                                wsapi_webrtcStartCall(socket, msg.data.id, accountData.get().id);
                            })
                            return;
                        }
                        msg.data.accountData.stream = localStreamRef.current;
                        msg.data.accountData.avatar = serverData.get().members.find(m => m.id == msg.data.accountData.id).avatar;
                        voiceChannelData.get().id = msg.data.id;                  
                        wsapi_webrtcStartCall(socket, msg.data.id, accountData.get().id);
                    } else {
                        msg.data.accountData.params = {
                            volume: 1,
                            muteVideo: false
                        };
                    }
                    voiceChannel.activeMembers.push(msg.data.accountData);
                    serverData.update();
                }
                else if (msg.subtype == 'leave') {
                    if (isServerRendered()) {
                        let voiceChannel = serverData.get().voiceChannels.find((vc) => vc.id ==  msg.data.id);
                        for (let i = 0; i < voiceChannel.activeMembers.length; ++i) {
                            if (voiceChannel.activeMembers[i].id == msg.data.accountData.id) {
                                voiceChannel.activeMembers.splice(i, 1);
                                break;
                            }
                        }
                        serverData.update();
                    }
                    
                    if (voiceChannelData.get().id == msg.data.id) {
                        for (let i = 0; i < peerConnections.current.length; ++i) {
                            if (peerConnections.current[i].interlocutorId == msg.data.accountData.id) {
                                peerConnections.current.splice(i, 1);
                                break;
                            }
                        }
                        
                        if (msg.data.accountData.id == accountData.get().id) {
                            voiceChannelData.reset();
                            peerConnections.current = [];
                        }
                    }
                    console.log(peerConnections.current);
                }
            }
            else if (msg.type == 'webrtc') {
                if (msg.subtype == 'startCall') {
                    let peerConnection = createPeerConnection(socket, msg.data.roomId, msg.data.senderId);
                    peerConnection.createOffer().then(dsc => {
                        peerConnection.setLocalDescription(dsc);
                        wsapi_webrtcOffer(socket, msg.data.roomId, accountData.get().id, msg.data.senderId, dsc);
                    });                    
                }
                else if (msg.subtype == 'offer') {
                    if (msg.data.receiverId != accountData.get().id)
                        return
                    let peerConnection = createPeerConnection(socket, msg.data.roomId, msg.data.senderId);
                    peerConnection.setRemoteDescription(msg.data.dsc).then(async () => {
                        let dsc = await peerConnection.createAnswer();
                        peerConnection.setLocalDescription(dsc);
                        wsapi_webrtcAnswer(socket, msg.data.roomId, accountData.get().id, msg.data.senderId, dsc);
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
        ws.current = socket;
    }

    function loadInitialData() {
        api_accountEcho().then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    accountData.set(json).update();
                    api_getAvatar(accountData.get().id).then((response) => {
                        response.blob().then((blob) => {
                            accountData.get().avatar = blob;
                            accountData.update();
                        })
                    })
                })
            }
        });

        api_getAccountChats().then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    chatList.set(json);
                    chatList.update();
                });
            }
        });

        api_getAccountServers().then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    serverList.set(json);
                    serverList.update();
                })
            }
        });        
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
        if (contextMenu.current)
            contextMenu.current.hidden = true;
    }


    return (
        <div id="main_container">
            <div id="main_left_panel">
                <div style={{flexGrow: "1", backgroundColor: "transparent"}}>
                    <Tabs
                        defaultActiveKey="messages"
                        className="mb-3 tab_text_color"
                        fill
                    >
                        <Tab eventKey="messages" title="Messages">
                            <MsList list={chatList.get()}
                                    newTabClick={() => renderedComponent.set(RenderedComponent.NewChatForm).update()}
                                    tabClick={chatTabClick}/>
                        </Tab>
                        <Tab eventKey="servers" title="Servers">
                            <MsList list={serverList.get()}
                                    newTabClick={() => renderedComponent.set(RenderedComponent.NewServerForm).update()}
                                    tabClick={serverTabClick}/>
                        </Tab>
                    </Tabs>
                </div>
                <div id="main_left_panel_control_container">
                    <div style={{backgroundColor: "transparent", flexGrow: "1"}}>
                        <Avatar width="40px" height="40px" file={accountData.get().avatar}/>
                        <span style={{marginLeft: "5px"}}>{accountData.get().login}</span>
                    </div>
                    <div style={{backgroundColor: "transparent", flexGrow: "1"}}>
                        <IconButton icon={<CiSettings />} size="30px" onClick={() => renderedComponent.set(RenderedComponent.AccountSettings).update()} />
                        <IconButton icon={<IoLogOutOutline />} size="30px" onClick={() => {ws.current.close(); navigate('/signin');}} />
                    </div>
                </div>
            </div>
            <div id="main_right_area">
                {renderedComponent.get() == RenderedComponent.NewChatForm   && <NewChatForm ws={ws.current} 
                                                                                      accountData={accountData.get()}/>}

                {renderedComponent.get() == RenderedComponent.Chat          && <Chat members={chatData.get().members}
                                                                                     messageList={chatData.get().messageList}
                                                                                     id={chatData.get().id}
                                                                                     ws={ws.current} 
                                                                                     convType="chat"/>}

                {renderedComponent.get() == RenderedComponent.NewServerForm && <NewServerForm ws={ws.current} 
                                                                                        accountData={accountData.get()}/>}

                {(isServerRendered()
                 ) && <Server ws={ws.current} 
                        serverData={serverData.get()}
                        callContextMenu={callContextMenu}
                        callbacks={serverCallbacks}
                        textChannelMessageList={textChannelData.get().messageList}
                        chosenTextChannelId={textChannelData.get().id}
                        chosenVoiceChannelId={voiceChannelData.get().id}
                        renderedComponent={renderedComponent.get()}
                    />}
                
                {renderedComponent.get() == RenderedComponent.Chat && <MemberList members={chatData.get().members} />}
                {(renderedComponent.get() == RenderedComponent.Server || renderedComponent.get() == RenderedComponent.ServerChat) && <MemberList members={serverData.get().members} />}

                {renderedComponent.get() == RenderedComponent.AccountSettings && <AccountSettings curAvatar={accountData.get().avatar}/>}
            </div>
            <ContextMenu ref={contextMenu} actions={contextMenuActions}/>
        </div>
    );
}