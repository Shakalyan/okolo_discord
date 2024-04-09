import Stack from "react-bootstrap/esm/Stack";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import '../styles/MainPage.css'
import MsTab from "./general/MsTab.jsx";
import Button from "react-bootstrap/esm/Button.js";
import { api_auth_accountEcho, api_auth_getAccountChats, api_auth_getAllMessagesByChatId, backendHost } from "../api.js";
import NewChatForm from "./NewChatForm.jsx";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";
import Chat from "./chat/Chat.jsx";
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'

export default function MainPage() {

    const [ws, setWs] = useState(null);

    const chatListRef = useRef([]);
    const [chatList, setChatList] = useState([]);

    const [accountData, setAccountData] = useState(null);

    const [chosenChatId, setChosenChatId] = useState('');

    const messageListRef = useRef([]);
    const [messageList, setMessageList] = useState([]);

    const RenderedComponent = {
        None: 0,
        Chat: 1,
        NewChat: 2
    };
    const [renderedComponent, setRenderedComponent] = useState(RenderedComponent.None);

    function chatTabClick(event, id) {
        setChosenChatId(id);
        api_auth_getAllMessagesByChatId(id).then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    setRenderedComponent(RenderedComponent.Chat);
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
                    appendToMessageList(msg.data);
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

    function newChatClick(event) {
        console.log("open new chat window....");
        setRenderedComponent(RenderedComponent.NewChat);
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
                        <Stack>
                            <Button variant='dark' size='sm' onClick={newChatClick}>New</Button>
                            {chatList.map((chat) => <MsTab key={chat.id} text={chat.name} onClick={(event)=>chatTabClick(event, chat.id)}/>)}
                        </Stack>
                    </Tab>
                    <Tab eventKey="servers" title="Servers">
                        Tab content for Profile
                    </Tab>
                </Tabs>
            </div>
            <div id="main_right_area">
                {renderedComponent == RenderedComponent.NewChat && <NewChatForm ws={ws} accountData={accountData}/>}
                {renderedComponent == RenderedComponent.Chat && <Chat chatId={chosenChatId} ws={ws} messageList={messageList}/>}
            </div>
        </div>
    );
}