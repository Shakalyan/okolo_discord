import { ConferenceTab } from "./ConferenceTab";

export function Conference(props) {
    return (
        <div id="conference_container">
            {props.voiceChannel && props.voiceChannel.activeMembers.map((m) => <ConferenceTab key={m.id} memberData={m} />)}
        </div>
    );
}