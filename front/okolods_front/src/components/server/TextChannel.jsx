export function TextChannel(props) {
    return (
        <div className="server_channel_container" onClick={props.onClick}>
            <p className="server_channel_name_text">#{props.name}</p>
        </div>
    );
}