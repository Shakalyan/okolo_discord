import Stack from "react-bootstrap/Stack"
import Button from "react-bootstrap/Button"
import MsTab from "./MsTab";

export function MsList(props) {
    return (
        <Stack>
            <Button variant='dark' size='sm' onClick={props.newTabClick}>New</Button>
            {props.list.map((el) => <MsTab key={el.id} text={el.name} onClick={(event)=>props.tabClick(event, el.id)}/>)}
        </Stack>
    );
}