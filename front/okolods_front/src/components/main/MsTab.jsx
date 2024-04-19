export default function MsTab(props) {
    return (
        <div className="mstab clickable" onClick={props.onClick}>
            <p className="mstab-text">{props.text}</p>
        </div>
    );
}