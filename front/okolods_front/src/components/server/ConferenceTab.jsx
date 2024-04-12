import { useEffect, useRef } from "react";

export function ConferenceTab(props) {

    const videoRef = useRef();

    useEffect(() => {
        videoRef.current.srcObject = props.memberData.stream;
    }, [videoRef.current])


    

    console.log(props.memberData);
    return (
        <div className="conference-tab">
            <video
                ref={videoRef}
                className="conference_video"
                autoPlay
                style={{width: 320, height: 240}}
            />
            <p>Some text</p>
        </div>
    );
}