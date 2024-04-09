import "../../styles/Server.css"
import Chat from "../chat/Chat";
import { VoiceChannel } from "./VoiceChannel";
import { TextChannel } from "./TextChannel";
import Stack from "react-bootstrap/Stack"
import PopupInput from "../main/PopupInput";
import { useEffect, useRef } from "react";
import { api_getTextChannelMessages } from "../../api";

export function Server(props) {

    const newVoiceChannelInput = useRef();
    const newTextChannelInput = useRef();

    const voiceChannelcmActions = [
        {
            text: "New",
            handler: () => {
                console.log('new voice channel');
                newVoiceChannelInput.current.hidden = false;
                newVoiceChannelInput.current.focus();
            }
        }
    ];

    const textChannelcmActions = [
        {
            text: "New",
            handler: () => {
                console.log('new text channel');
                newTextChannelInput.current.hidden = false;
                newTextChannelInput.current.focus();
            }
        }
    ];

    function newVoiceChannel() {
        let msg = {
            type: "server",
            subtype: "newVoiceChannel",
            data: {
                serverId: props.serverData.id,
                name: newVoiceChannelInput.current.value
            }
        };
        props.ws.send(JSON.stringify(msg));
    }

    function newTextChannel() {
        let msg = {
            type: "server",
            subtype: "newTextChannel",
            data: {
                serverId: props.serverData.id,
                name: newTextChannelInput.current.value
            }
        };
        props.ws.send(JSON.stringify(msg));
    }

    return (
        <div id="server_container">
            <div id="server_control_panel">
                <p onContextMenu={(e) => props.callContextMenu(e, voiceChannelcmActions)} className="server_channel_header_text">Voice channels</p>
                <Stack style={{marginLeft: "30px"}}>
                    <PopupInput ref={newVoiceChannelInput} 
                                onEnter={newVoiceChannel}
                                placeholder="Enter name"/>
                    {props.serverData.voiceChannels.map((vc) => <VoiceChannel key={vc.id} name={vc.name} />)}
                </Stack>
                <p onContextMenu={(e) => props.callContextMenu(e, textChannelcmActions)} className="server_channel_header_text">Text channels</p>
                <Stack style={{marginLeft: "30px"}}>
                    <PopupInput ref={newTextChannelInput} 
                                onEnter={newTextChannel}
                                placeholder="Enter name"/>
                    {props.serverData.textChannels.map((tc) => <TextChannel key={tc.id} name={tc.name} onClick={(e) => props.textChannelTabClick(e, tc.id)}/>)}
                </Stack>
            </div>
            <Chat convType="server" chatId={props.chosenTextChannelId} ws={props.ws} messageList={props.textChannelMessageList} />
        </div>
    );
}