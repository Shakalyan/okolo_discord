import Stack from "react-bootstrap/esm/Stack";
import MemberTab from "./MemberTab";

export default function MemberList(props) {

    return (
        <div id="member-list">
            <Stack>
                <h5 style={{marginLeft: "5px"}}>Участники</h5>
                {props.members.map(m => <MemberTab key={m.id} memberData={m} />)}
            </Stack>
        </div>
    );
}