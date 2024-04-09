import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import '../styles/MainPage.css'
import { api_auth_accountEcho, api_auth_getAccountChats, api_auth_getAllMessagesByChatId, backendHost } from "../api.js";
import NewChatForm from "./NewChatForm.jsx";
import { useEffect, useState, useRef } from "react";
import Chat from "./chat/Chat.jsx";
import { MsList } from "./main/MsList.jsx";

export default function MainPage() {

    const [ws, setWs] = useState(null);

    const chatListRef = useRef([]);
    const [chatList, setChatList] = useState([]);

    const serverListRef = useRef([]);
    const [serverList, setServerList] = useState([]);

    const [accountData, setAccountData] = useState(null);

    const [chosenChatId, setChosenChatId] = useState('');

    const messageListRef = useRef([]);
    const [messageList, setMessageList] = useState([]);


    const RenderedComponent = {
        None: 0,
        Chat: 1,
        NewChatForm: 2
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
        api_auth_getAllMessagesByChatId(id).then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    setRenderedComponent(RenderedComponent.Chat, {id: id});
                    setMessageList(json);
                    messageListRef.current = json;
                })
            }
        })
    }

    function appendToChatList(chat) {
        chatListRef.current.push(chat);
        setChatList([...chatListRef.current]);
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
        };
        setWs(socket);
    }

    function loadInitialData() {
        api_auth_accountEcho().then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    setAccountData(json);
                })
            }
        });

        api_auth_getAccountChats().then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    setChatList(json);
                    chatListRef.current = json;
                });
            }
        });
    }

    useEffect(() => {
        initWebSocket();
        loadInitialData();
    }, []);


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
                        Tab content for Profile
                    </Tab>
                </Tabs>
            </div>
            <div id="main_right_area">
                {renderedComponent == RenderedComponent.NewChatForm && <NewChatForm ws={ws} accountData={accountData}/>}
                {renderedComponent == RenderedComponent.Chat && <Chat chatId={chosenChatId} ws={ws} messageList={messageList}/>}
            </div>
        </div>
    );
}