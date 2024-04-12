export function VoiceChannel(props) {
    return (
        <div className="server_channel_container" onClick={props.onClick}>
            <p className="server_channel_name_text">{props.name}</p>
            {props.activeMembers.map((am) => <p key={am.id} className="server_channel_member_text">{am.login}</p>)}
        </div>
    );
}