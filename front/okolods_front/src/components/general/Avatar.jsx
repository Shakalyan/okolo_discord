import React, { useEffect } from 'react'
import { useRef } from 'react';

export default function Avatar(props) {

    const imgRef = useRef();

    useEffect(() => {
        if (!props.file || !imgRef.current)
            return;

        imgRef.current.src = URL.createObjectURL(props.file);
    }, [props.file])

    return (
        <div style={{width:  props.width, 
                     height: props.height,
                     backgroundColor: "transparent",
                     display: "inline-block"}}>
            <img ref={imgRef}
                 style={{width: "100%", 
                 height: "100%", 
                 borderRadius: "50%",
                 margin: "auto auto"}}/>
        </div>
    );
}