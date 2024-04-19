import Avatar from "../general/Avatar";

export default function MemberTab(props) {
    console.log("RENDER MEMBER TAB");
    return (
        <div className="member-tab">
            <Avatar width="40px" height="40px" file={props.memberData.avatar}/>
            <span style={{marginLeft: "5px"}}>{props.memberData.login}</span>
        </div>
    );
}