import Stack from "react-bootstrap/esm/Stack";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import '../styles/MainPage.css'
import MsTab from "./general/MsTab.jsx";
import Button from "react-bootstrap/esm/Button.js";
import { api_createChat } from "../api.js";
import NewChatForm from "./NewChatForm.jsx";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";

export default function MainPage() {

    const [ws, setWs] = useState(null);
    const [chatList, setChatList] = useState([]);

    useEffect(() => {
        let socket = new WebSocket(`ws://localhost:5000/ws/${localStorage.getItem('token')}`);
        socket.onopen = (event) => {
            console.log("open socket");
        };
        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            console.log(msg);
            
            if (msg.type == 'chat') {
                if (msg.type == 'new') {
                    
                }
            }


        };
        console.log("INIT SOCKET EPTA NAHUY");
        setWs(socket);
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
                            {chatList.map((chat) => <MsTab text={chat.name}/>)}
                        </Stack>
                    </Tab>
                    <Tab eventKey="servers" title="Servers">
                        Tab content for Profile
                    </Tab>
                </Tabs>
            </div>
            <div id="main_right_area">
                <NewChatForm ws={ws}/>
            </div>
        </div>
    );
}