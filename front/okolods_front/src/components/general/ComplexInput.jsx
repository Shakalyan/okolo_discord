import React from 'react'

let ComplexInput = React.forwardRef((props, ref) => {
        return (
            <div className="input_div" style={{backgroundColor: "transparent"}}>
                <p className="input_incs_df">{props.text}</p>
                <input  type={props.type} 
                        className="input_df" 
                        ref={ref} 
                        onKeyDown={props.onKeyDown} 
                        disabled={props.disabled}
                        placeholder={props.placeholder}></input>
                <p className="input_dsc_df">{props.dsc}</p>
            </div>
        );
    }
);

export default ComplexInput;