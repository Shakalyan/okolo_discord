import Stack from "react-bootstrap/esm/Stack";
import MemberTab from "./MemberTab";

export default function MemberList(props) {
    return (
        <div id="member-list">
            <Stack>
                <h5>Members</h5>
                <MemberTab login="test" />
            </Stack>
        </div>
    );
}