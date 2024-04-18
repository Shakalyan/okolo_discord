import { useEffect, useRef } from "react";
import Button from "react-bootstrap/esm/Button";
import Stack from "react-bootstrap/esm/Stack";
import Avatar from "./general/Avatar";

export default function AccountSettings(props) {

    let imgRef = useRef();

    function avatarOnChange(event) {
        imgRef.current.src = URL.createObjectURL(event.target.files[0]);
    }

    return (
        <div id="account_settings">
            <Stack gap={3}>
                <Avatar ref={imgRef} width="300px" height="300px" />
                <input type="file" accept="image/*" id="file" onChange={avatarOnChange}/>
                <Button variant="dark">Save</Button>
            </Stack>
            
        </div>
    );
}