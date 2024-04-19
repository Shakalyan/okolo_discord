import "../../styles/Server.css"
import Chat from "../chat/Chat";
import { VoiceChannel } from "./VoiceChannel";
import { TextChannel } from "./TextChannel";
import Stack from "react-bootstrap/Stack"
import PopupInput from "../main/PopupInput";
import { useEffect, useRef } from "react";
import { api_getTextChannelMessages } from "../../api";
import Button from "react-bootstrap/Button"
import { Conference } from "./Conference";

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

    console.log(props.serverData);

    return (
        <div id="server_container">
            <div id="server_control_panel">
                <div id="server_control_panel_channels">
                    <p onContextMenu={(e) => props.callContextMenu(e, voiceChannelcmActions)} className="server_channel_header_text">Voice channels</p>
                    <Stack style={{marginLeft: "30px"}}>
                        <PopupInput ref={newVoiceChannelInput} 
                                    onEnter={newVoiceChannel}
                                    placeholder="Enter name"/>
                        {props.serverData.voiceChannels.map((vc) => <VoiceChannel key={vc.id} 
                                                                                name={vc.name}
                                                                                activeMembers={vc.activeMembers}
                                                                                onClick={(e) => props.callbacks.voiceChannelTabClick(e, vc.id)}/>)}
                    </Stack>
                    <p onContextMenu={(e) => props.callContextMenu(e, textChannelcmActions)} className="server_channel_header_text">Text channels</p>
                    <Stack style={{marginLeft: "30px"}}>
                        <PopupInput ref={newTextChannelInput} 
                                    onEnter={newTextChannel}
                                    placeholder="Enter name"/>
                        {props.serverData.textChannels.map((tc) => <TextChannel key={tc.id} 
                                                                                name={tc.name} 
                                                                                onClick={(e) => props.callbacks.textChannelTabClick(e, tc.id)}/>)}
                    </Stack>
                </div>
                <div id="server_control_panel_buttons">
                    <Button variant="dark" onClick={props.callbacks.conferenceButtonClick}>Conference</Button>
                    <Button variant="dark" onClick={props.callbacks.leaveChannelButtonClick}>Leave</Button>
                    <Button variant="dark">Micro Off</Button>
                    <Button variant="dark" onClick={props.callbacks.videoOffOnButtonClick}>Video On</Button>
                </div>
            </div>
            {props.renderedComponent == 5 && <Chat convType="server" id={props.chosenTextChannelId}
                                                                     ws={props.ws} 
                                                                     messageList={props.textChannelMessageList}
                                                                     members={props.serverData.members} />}
            {props.renderedComponent == 6 && <Conference voiceChannel={props.serverData.voiceChannels.find((vc) => vc.id == props.chosenVoiceChannelId)}/>}
        </div>
    );
}