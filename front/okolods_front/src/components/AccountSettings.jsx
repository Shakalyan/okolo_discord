import { useEffect, useRef } from "react";
import Button from "react-bootstrap/esm/Button";
import Stack from "react-bootstrap/esm/Stack";
import Avatar from "./general/Avatar";
import { api_changeAvatar, makeUrl } from "../api";
import { useRenderedRef } from "../fns";

export default function AccountSettings(props) {

    let inputRef = useRef();
    const avatar = useRenderedRef(props.curAvatar);

    function avatarOnChange(event) {
        let file = event.target.files[0];
        avatar.set(file).update();
    }

    function onSaveClick(event) {
        api_changeAvatar(avatar.get()).then((response) => {
            if (response.status == 200) {
            }
        })
    }

    return (
        <div id="account_settings">
            <Stack gap={3}>
                <Avatar file={avatar.get()} width="300px" height="300px" />
                <input ref={inputRef} type="file" accept="image/*" id="file" onChange={avatarOnChange}/>
                <Button variant="dark" onClick={onSaveClick}>Save</Button>
            </Stack>
            
        </div>
    );
}