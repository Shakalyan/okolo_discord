import React from 'react'

let Avatar = React.forwardRef((props, ref) => {
    return (
        <div style={{width:  props.width, 
                     height: props.height,
                     backgroundColor: "transparent",
                     display: "inline-block"}}>
            <img ref={ref} style={{width: "100%", 
                                   height: "100%", 
                                   borderRadius: "50%",
                                   margin: "auto auto"}}/>
        </div>
    );
});

export default Avatar;