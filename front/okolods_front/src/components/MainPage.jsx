import Stack from "react-bootstrap/esm/Stack";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import '../styles/MainPage.css'
import MsTab from "./general/MsTab.jsx";
import Button from "react-bootstrap/esm/Button.js";
import { api_auth_accountEcho, api_auth_getAccountChats } from "../api.js";
import NewChatForm from "./NewChatForm.jsx";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef } from "react";

export default function MainPage() {

    const [ws, setWs] = useState(null);
    const chatListRef = useRef([]);
    const [chatList, setChatList] = useState([]);
    const [accountData, setAccountData] = useState(null);

    function appendToChatList(chat) {
        chatListRef.current.push(chat);
        setChatList([...chatListRef.current]);
    }

    function initWebSocket() {
        let socket = new WebSocket(`ws://192.168.1.113:5000/ws/${localStorage.getItem('token')}`);
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
            }
        };
        setWs(socket);
    }

    function loadInitialData() {
        api_auth_accountEcho(localStorage.getItem('token')).then((response) => {
            if (response.status == 200) {
                response.json().then((json) => {
                    setAccountData(json);
                })
            }
        })
        api_auth_getAccountChats(localStorage.getItem('token')).then((response) => {
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
                            {chatList.map((chat) => <MsTab key={chat.id} text={chat.name}/>)}
                        </Stack>
                    </Tab>
                    <Tab eventKey="servers" title="Servers">
                        Tab content for Profile
                    </Tab>
                </Tabs>
            </div>
            <div id="main_right_area">
                <NewChatForm ws={ws} accountData={accountData}/>
            </div>
        </div>
    );
}