import { FaHeadphonesAlt } from "react-icons/fa";
import Avatar from "../general/Avatar";

function VoiceChannelMember(props) {
    return (
        <div style={{marginLeft: "20px", backgroundColor: "var(--odbg-2)"}}>
            <Avatar width="20px" height="20px" file={props.avatar} />
            <span className="server_channel_member_text" style={{marginLeft: "5px"}}>{props.login}</span>
        </div>
    );
}

export function VoiceChannel(props) {
    return (
        <div className="server_channel_container clickable" onClick={props.onClick}>
            <FaHeadphonesAlt />
            <span className="server_channel_name_text" style={{marginLeft: "5px", backgroundColor: "transparent"}}>{props.name}</span>
            {props.activeMembers.map((am) => <VoiceChannelMember key={am.id} login={am.login} avatar={am.avatar}/>)}
        </div>
    );
}