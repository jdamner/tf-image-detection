import React, { useRef, useState, useEffect } from 'react';

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";

const App: React.FC = () => { 

    const video = useRef<HTMLVideoElement>(null);
    const model = useRef<cocoSsd.ObjectDetection>(null);
    const animationFrame = useRef<number>(null);
    const [foundElements, setFoundElements ] = useState<cocoSsd.DetectedObject[]>([]);

    useEffect( () => { 
        (async () => model.current = await cocoSsd.load({ base: 'mobilenet_v2' }) )();
        (async () => video.current && ( video.current.srcObject = await navigator.mediaDevices.getUserMedia({ video: true }) ) )()
        animationFrame.current = requestAnimationFrame(detectElements);
        return () => cancelAnimationFrame( animationFrame.current! );
    }, [])
    
    const detectElements = () => { 
        if ( ! model.current || ! video.current ) { 
            return;
        }
        model.current.detect( video.current ).then(setFoundElements);
        animationFrame.current = requestAnimationFrame( detectElements );
    }


    return (
        <div className="container">
            
            <h1>Video Detection Example</h1>

            <div className="videoContainer">
                { foundElements
                    .filter( ( element ) => element.score > 0.5 )
                    .map( ( element, index ) => { 
                    return (
                        <div key={index} style={{
                            position: 'absolute',
                            left: element.bbox[0] + 'px',
                            top: element.bbox[1] + 'px',
                            width: element.bbox[2] + 'px',
                            height: element.bbox[3] + 'px',
                        }}
                        className="foundBox">
                            <p>{element.class} - {Math.round( element.score * 100 )} % confidence</p>
                        </div>
                    )
                })}

                <video ref={video} onLoadedData={detectElements} autoPlay muted width={640} height={480}/>
            </div>
        </div>
    );
}

export default App;