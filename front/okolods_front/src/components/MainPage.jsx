import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import '../styles/MainPage.css'
import { api_accountEcho, api_getAccountChats, api_getAccountServers, api_getAllMessagesByChatId, backendHost } from "../api.js";
import NewChatForm from "./NewChatForm.jsx";
import { NewServerForm } from './NewServerForm.jsx';
import { useEffect, useState, useRef, createRef } from "react";
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

    const [accountData, setAccountData] = useState(null);

    const [chosenChatId, setChosenChatId] = useState('');
    const [chosenServerId, setChosenServerId] = useState('');

    const messageListRef = useRef([]);
    const [messageList, setMessageList] = useState([]);

    const contextMenu = createRef();
    const [contextMenuActions, setContextMenuActions] = useState([]);

    const RenderedComponent = {
        None: 0,
        Chat: 1,
        NewChatForm: 2,
        NewServerForm: 3,
        Server: 4
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
        setRenderedComponent(RenderedComponent.Server, {id: id});
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
            }
        };
        setWs(socket);
    }

    function loadInitialData() {
        api_accountEcho().then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    setAccountData(json);
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
                {renderedComponent == RenderedComponent.NewChatForm && <NewChatForm ws={ws} accountData={accountData}/>}
                {renderedComponent == RenderedComponent.Chat && <Chat chatId={chosenChatId} ws={ws} messageList={messageList}/>}
                {renderedComponent == RenderedComponent.NewServerForm && <NewServerForm ws={ws} accountData={accountData}/>}
                {renderedComponent == RenderedComponent.Server && <Server ws={ws} messageList={messageList} callContextMenu={callContextMenu}/>}
            </div>
            <ContextMenu ref={contextMenu} actions={contextMenuActions}/>
        </div>
    );
}