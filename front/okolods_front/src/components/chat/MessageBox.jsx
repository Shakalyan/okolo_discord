import Avatar from "../general/Avatar";

export default function MessageBox(props) {
    let msg = props.msg;
    return (
        <div className="message-box">
            <div>
                <Avatar width="40px" height="40px" file={props.avatar}/>
                <span style={{marginLeft: "5px"}} className="message-box-login-text">{msg.login} </span>
                <span className="message-box-meta-text">{msg.datetime}</span>
            </div>
            <p className="message-box-message-text" style={{marginLeft: "45px"}}>{msg.text}</p>
        </div>
    );
}