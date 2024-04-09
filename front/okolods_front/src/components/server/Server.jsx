import "../../styles/Server.css"
import Chat from "../chat/Chat";
import { VoiceChannel } from "./VoiceChannel";
import { TextChannel } from "./TextChannel";
import Stack from "react-bootstrap/Stack"

export function Server(props) {

    const textChannelcmActions = [
        {
            text: "New",
            handler: () => {
                console.log('new text channel');
            }
        }
    ];

    return (
        <div id="server_container">
            <div id="server_control_panel">
                <p onContextMenu={(e) => props.callContextMenu(e, textChannelcmActions)} className="server_channel_header_text">Voice channels</p>
                <Stack style={{marginLeft: "30px"}}>
                    <VoiceChannel />
                    <VoiceChannel />
                </Stack>
                <p className="server_channel_header_text">Text channels</p>
                <Stack style={{marginLeft: "30px"}}>
                    <TextChannel />
                    <TextChannel />
                </Stack>
            </div>
            <Chat id={'asdf'} ws={props.ws} messageList={props.messageList} />
        </div>
    );
}