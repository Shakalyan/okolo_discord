export default function MsTab(props) {
    return (
        <div className="mstab" onClick={props.onClick}>
            <p className="mstab-text">{props.text}</p>
        </div>
    );
}