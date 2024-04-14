import { useEffect, useRef } from "react";

export function ConferenceTab(props) {

    const videoRef = useRef();

    useEffect(() => {
        if (!props.memberData.stream)
            return;
        videoRef.current.srcObject = props.memberData.stream;
        if (props.memberData.muteMic) {
            videoRef.current.volume = 0;
        }
    }, [props.memberData.stream])
   

    console.log(props.memberData);
    return (
        <div className="conference-tab">
            <video
                ref={videoRef}
                className="conference_video"
                autoPlay
                style={{width: 320, height: 240}}
            />
            <p>{props.memberData.login}</p>
        </div>
    );
}