import Stack from "react-bootstrap/esm/Stack";
import MemberTab from "./MemberTab";
import { useEffect } from "react";
import { useRenderedRef } from "../../fns";
import { api_getAvatar } from "../../api";
import { useState } from "react";

export default function MemberList(props) {

    const [members, setMembers] = useState(props.members);

    useEffect(() => {
        async function fetchAvatars() {
            let mmbs = [];
            for (let i = 0; i < props.members.length; ++i) {
                let m = props.members[i];
                let response = await api_getAvatar(m.id);
                if (response.status == 200) {
                    let blob = await response.blob();
                    mmbs.push({...m, avatar: blob});
                }
            }
            setMembers(mmbs);
        }
        fetchAvatars();
    }, props.members);

    return (
        <div id="member-list">
            <Stack>
                <h5>Members</h5>
                {members.map(m => <MemberTab key={m.id} memberData={m} />)}
            </Stack>
        </div>
    );
}