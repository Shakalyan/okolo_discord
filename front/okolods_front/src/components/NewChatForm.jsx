import Stack from "react-bootstrap/esm/Stack";
import Form from 'react-bootstrap/Form';
import ComplexInput from './general/ComplexInput.jsx';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from "react-bootstrap/esm/Button";
import { useRef, useState } from "react";
import { api_getAccountId, wsapi_createChat } from "../api.js";

export default function NewChatForm(props) {

    let checkBox = useRef();
    let nameInput = useRef();
    let memberInput = useRef();

    const [nameDsc, setNameDsc] = useState('');
    const [memberDsc, setMemberDsc] = useState('');
    const [memberLoginsList, setMemberLoginsList] = useState([]);
    const [memberIdsList, setMemberIdsList] = useState([]);

    function checkBoxChange(event) {
        if (checkBox.current.checked) {
            nameInput.current.disabled = false;
        } else {
            nameInput.current.value = "";
            nameInput.current.disabled = true;
        }
    }

    function memberInputKeyDown(event) {
        if (event.keyCode === 13) {
            let login = memberInput.current.value;
            
            if (login == props.accountData.login) {
                setMemberDsc('You cannot add yourself');
                return;
            }

            if (!checkBox.current.checked && memberLoginsList.length > 0) {
                setMemberDsc('You can add only one user in non-group chat');
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

    function createChatClick(event) {
        let name = nameInput.current.value;
        let isGroup = checkBox.current.checked;
        setNameDsc('');
        setMemberDsc('');
        
        if (isGroup && name.length == 0) {
            setNameDsc('Enter name');
            return;
        }

        if (memberLoginsList.length == 0) {
            setMemberDsc('Add at least one member');
            return;
        }
        wsapi_createChat(props.ws, name, isGroup, memberIdsList);
    }

    return (
        <div id="new_chat_form" style={{margin: "30px"}}>
            <Stack gap={3}>
                <h1>Новый чат</h1>
                <Form>
                <Form.Check
                    type="switch"
                    id="custom-switch"
                    label="Группа"
                    ref={checkBox}
                    onChange={checkBoxChange}
                />
                </Form>
                <ComplexInput text="Название" ref={nameInput} disabled={true} dsc={nameDsc}/>
                <ComplexInput text="Участник" ref={memberInput} onKeyDown={memberInputKeyDown} dsc={memberDsc}/>
                <ListGroup style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {memberLoginsList.map((member) => <ListGroup.Item key={member}>{member}</ListGroup.Item>)}
                </ListGroup>
                <Button variant="light" onClick={createChatClick}>Создать</Button>
            </Stack>
        </div>
    );
}