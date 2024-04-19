import { BsChatText } from "react-icons/bs";

export function TextChannel(props) {
    return (
        <div className="server_channel_container clickable" onClick={props.onClick}>
            <BsChatText />
            <span className="server_channel_name_text" style={{marginLeft: "5px"}}>{props.name}</span>
        </div>
    );
}