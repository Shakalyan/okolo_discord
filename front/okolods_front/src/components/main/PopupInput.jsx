import React from "react";

let PopupInput = React.forwardRef((props, ref) => {

    function onKeyDown(event) {
        if (event.keyCode === 13) {
            props.onEnter();
            event.target.hidden = true;
        }
    }

    return (
        <input  className="inline-input" 
                type="text"
                ref={ref}
                hidden={true}
                placeholder={props.placeholder}
                onKeyDown={onKeyDown}
                onBlur={(e)=>{e.target.hidden=true}}/>
    );
});

export default PopupInput;