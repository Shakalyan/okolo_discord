import { IconContext } from "react-icons/lib";

export default function IconButton(props) {
    return (
        <button className='icon-button' onClick={props.onClick}>
            <IconContext.Provider value={{size: props.size}}>
                {props.icon}
            </IconContext.Provider>
        </button>
    );
}