import React from 'react'
import Stack from 'react-bootstrap/Stack'
import MsTab from '../main/MsTab';

let ContextMenu = React.forwardRef((props, ref) => {
    return (
        <div id="context-menu" ref={ref} hidden>
            <Stack>
                {props.actions.map((a) => <MsTab key={a.text} text={a.text} onClick={a.handler}/>)}
            </Stack>
        </div>
    )
});

export default ContextMenu;