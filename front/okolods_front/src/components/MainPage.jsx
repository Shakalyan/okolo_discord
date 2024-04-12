import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import '../styles/MainPage.css'
import { api_accountEcho, api_getAccountChats, api_getAccountServers, api_getAllMessagesByChatId, api_getServerById, api_getTextChannelMessages, backendHost } from "../api.js";
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
        if (chosenVoiceChannelId.current) {
            let msg = {
                type: "room",
                subtype: "leave",
                data: {
                    id: chosenVoiceChannelId.current
                }
            };
            ws.send(JSON.stringify(msg));
        }
        let msg = {
            type: "room",
            subtype: "join",
            data: {
                id: id
            }
        };
        ws.send(JSON.stringify(msg));
        setRenderedComponent(RenderedComponent.ServerConference, {channel: "voice", id: id});
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
            else if (msg.type == 'server') {
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
                        if (!localStreamRef.current) {
                            setupDevices().then((stream) => {
                                localStreamRef.current = stream;
                                msg.data.accountData.stream = localStreamRef.current;
                                voiceChannel.activeMembers.push(msg.data.accountData);
                                setServerData({...serverDataRef.current});
                                chosenVoiceChannelId.current = msg.data.id;
                            })
                        }
                        msg.data.accountData.stream = localStreamRef.current;
                    } else {
                        voiceChannel.activeMembers.push(msg.data.accountData);
                        setServerData({...serverDataRef.current});
                        chosenVoiceChannelId.current = msg.data.id;
                    }                    
                }
                else if (msg.subtype == 'leave') {
                    let voiceChannel = serverDataRef.current.voiceChannels.find((vc) => vc.id ==  msg.data.id);
                    for (let i = 0; i < voiceChannel.activeMembers.length; ++i) {
                        if (voiceChannel.activeMembers[i].id == msg.data.accountData.id) {
                            voiceChannel.activeMembers.splice(i, 1);
                            break;
                        }
                    }
                    setServerData({...serverDataRef.current});
                    chosenVoiceChannelId.current = null;
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

                {(renderedComponent == RenderedComponent.Server || renderedComponent == RenderedComponent.ServerChat || renderedComponent == RenderedComponent.ServerConference
                 ) && <Server ws={ws} 
                        serverData={serverData}
                        callContextMenu={callContextMenu}
                        textChannelTabClick={textChannelTabClick}
                        textChannelMessageList={messageList}
                        chosenTextChannelId={chosenTextChannelId.current}
                        chosenVoiceChannelId={chosenVoiceChannelId.current}
                        renderedComponent={renderedComponent}
                        voiceChannelTabClick={voiceChannelTabClick}
                    />}
            </div>
            <ContextMenu ref={contextMenu} actions={contextMenuActions}/>
        </div>
    );
}