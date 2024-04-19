import MessageBox from "./MessageBox";
import '../../styles/Chat.css'
import Form from 'react-bootstrap/Form';
import ComplexInput from "../general/ComplexInput";
import { useRef, useEffect } from "react";

export default function Chat(props) {

    let inputRef = useRef();
    let bottomRef = useRef();

    useEffect(()=>{
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }, [props.messageList.length])

    function inputKeyDown(event) {
        if (event.keyCode === 13) {
            let msg = {
                type: props.convType,
                subtype: "newMessage",
                data: {
                    text: inputRef.current.value,
                    chatId: props.id,
                }
            }
            props.ws.send(JSON.stringify(msg));
            inputRef.current.value = "";
        }
    }

    return (
        <div id="chat-container">
            <div id="chat-message-container">
                <div style={{
                    minHeight: '0'
                }}>
                    {props.messageList.map((msg) => {
                        let avatar = props.members.find(mmb => mmb.id == msg.accountId)?.avatar;
                        return <MessageBox key={msg.id} msg={msg} avatar={avatar}/>
                    })}
                    <p ref={bottomRef}></p>
                </div>
            </div>
            <div id="chat-control-container">
                <div id="chat-control-input-container">
                    <ComplexInput placeholder="Enter message" onKeyDown={inputKeyDown} ref={inputRef}/>
                </div>
                <div id="chat-control-options-container">
                </div>
            </div>
        </div>
    );
}