import Stack from 'react-bootstrap/Stack'
import ComplexInput from './general/ComplexInput';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from "react-bootstrap/esm/Button";
import { useRef, useState } from "react";
import { api_getAccountId } from "../api.js";

export function NewServerForm(props) {

    let nameInput = useRef();
    let memberInput = useRef();

    const [nameDsc, setNameDsc] = useState('');
    const [memberDsc, setMemberDsc] = useState('');
    const [memberLoginsList, setMemberLoginsList] = useState([]);
    const [memberIdsList, setMemberIdsList] = useState([]);

    function memberInputKeyDown(event) {
        if (event.keyCode === 13) {
            let login = memberInput.current.value;
            
            if (login == props.accountData.login) {
                setMemberDsc('You cannot add yourself');
                return;
            }

            if (memberLoginsList.find((val) => val == login)) {
                setMemberDsc('Already added');
                return;
            }

            api_getAccountId(login).then((response) => {
                if (response.status == 200) {
                    response.text().then((id) => {
                        setMemberDsc('');
                        setMemberLoginsList([...memberLoginsList, login]);
                        setMemberIdsList([...memberIdsList, id]);
                    });
                } else if (response.status == 404) {
                    setMemberDsc('Account not found');
                }
            })
        }
    }

    function createServerClick(event) {
        let name = nameInput.current.value;
        setNameDsc('');
        setMemberDsc('');
        
        if (name.length == 0) {
            setNameDsc('Enter name');
            return;
        }

        props.ws.send(JSON.stringify({
            type: "server",
            subtype: "new",
            data: {
                name: name,
                members: memberIdsList
            }
        }));
    }

    return (
        <div id="new_server_form" style={{margin: "30px"}}>
            <Stack gap={3}>
                <h1>Создать сервер</h1>
                <ComplexInput text="Название" ref={nameInput} dsc={nameDsc}/>
                <ComplexInput text="Участник" ref={memberInput} onKeyDown={memberInputKeyDown} dsc={memberDsc}/>
                <ListGroup style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {memberLoginsList.map((member) => <ListGroup.Item key={member}>{member}</ListGroup.Item>)}
                </ListGroup>
                <Button variant="light" onClick={createServerClick}>Создать</Button>
            </Stack>
        </div>
    );
}