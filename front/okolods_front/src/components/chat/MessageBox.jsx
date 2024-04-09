export default function MessageBox(props) {
    let msg = props.msg;
    return (
        <div className="message-box">
            <span className="message-box-login-text">{msg.login} </span>
            <span className="message-box-meta-text">[{msg.datetime}]</span>
            <p className="message-box-message-text">{msg.text}</p>
        </div>
    );
}