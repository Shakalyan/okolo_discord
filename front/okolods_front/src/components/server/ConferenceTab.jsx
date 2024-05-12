import { useEffect, useRef } from "react";

export function ConferenceTab(props) {

    const videoRef = useRef();

    useEffect(() => {
        if (!props.memberData.stream)
            return;
        videoRef.current.srcObject = props.memberData.stream;
    }, [props.memberData.stream])
    
    useEffect(() => {
        if (!props.memberData.params)
            return;
        videoRef.current.volume = props.memberData.params.volume;
        console.log(`VOLUME FOR ${props.memberData.login}: ${props.memberData.params.volume}`)
    }, [props.memberData.params])

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