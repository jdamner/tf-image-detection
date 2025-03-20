import React, { useEffect, useRef, useState } from "react";
import { ImageSource } from "./Model";
import { CircularProgress } from "@mui/joy";

interface ImageCanvasProps {
    source: ImageSource,
    getFaceImageData: (source: ImageSource) => Promise<ImageData | undefined>
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({ source, getFaceImageData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ imageData, setImageData ] = useState<ImageData|undefined>();

    useEffect( () => { 
        getFaceImageData(source).then(setImageData);
    }, [source, getFaceImageData]);

    useEffect(() => {
        if (canvasRef.current && imageData) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
                ctx.putImageData(imageData, 0, 0);
            }
        }
    }, [imageData]);

    if ( ! imageData ) return <CircularProgress />;
    return <canvas ref={canvasRef} width={imageData.width} height={imageData.height} />;
};
