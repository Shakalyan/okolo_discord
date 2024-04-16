export default function MemberTab(props) {
    return (
        <div id="member-tab">
            <h5>Member list</h5>
            <p>{props.login}</p>
        </div>
    );
}