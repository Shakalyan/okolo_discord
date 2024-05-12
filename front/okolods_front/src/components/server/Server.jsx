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
import { PiMonitorBold } from "react-icons/pi";
import { CiMicrophoneOn } from "react-icons/ci";
import { CiMicrophoneOff } from "react-icons/ci";
import { PiWebcamFill } from "react-icons/pi";
import { PiWebcamSlashFill } from "react-icons/pi";
import { RxCross2 } from "react-icons/rx";
import IconButton from "../general/IconButton";

export function Server(props) {

    const newVoiceChannelInput = useRef();
    const newTextChannelInput = useRef();

    const controlPanelcmActions = [
        {
            text: "Добавить голосовой канал",
            handler: () => {
                newVoiceChannelInput.current.hidden = false;
                newVoiceChannelInput.current.focus();
            }
        },
        {
            text: "Добавить текстовый канал",
            handler: () => {
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
                <div id="server_control_panel_channels" onContextMenu={(e) => props.callContextMenu(e, controlPanelcmActions)}>
                    <Stack>
                        <PopupInput ref={newVoiceChannelInput} 
                                    onEnter={newVoiceChannel}
                                    placeholder="Enter name"/>
                        {props.serverData.voiceChannels.map((vc) => <VoiceChannel key={vc.id} 
                                                                                name={vc.name}
                                                                                activeMembers={vc.activeMembers}
                                                                                onClick={(e) => props.callbacks.voiceChannelTabClick(e, vc.id)}/>)}
                    </Stack>
                    <br />
                    <Stack>
                        <PopupInput ref={newTextChannelInput} 
                                    onEnter={newTextChannel}
                                    placeholder="Enter name"/>
                        {props.serverData.textChannels.map((tc) => <TextChannel key={tc.id} 
                                                                                name={tc.name} 
                                                                                onClick={(e) => props.callbacks.textChannelTabClick(e, tc.id)}/>)}
                    </Stack>
                </div>
                <div id="server_control_panel_buttons">
                    <IconButton icon={<PiMonitorBold />} size="30px" onClick={props.callbacks.conferenceButtonClick} />
                    <IconButton icon={<CiMicrophoneOn />} size="30px" onClick={props.callbacks.conferenceButtonClick} />
                    <IconButton icon={<PiWebcamFill />} size="30px" onClick={props.callbacks.videoOffOnButtonClick} />
                    <IconButton icon={<RxCross2 />} size="30px" onClick={props.callbacks.leaveChannelButtonClick} />
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