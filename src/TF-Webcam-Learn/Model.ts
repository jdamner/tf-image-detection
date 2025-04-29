import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";

import { tidy, browser, sequential, type Sequential, layers, type Tensor, tensor1d, concat } from "@tensorflow/tfjs";
import { load as loadMobileNet, type MobileNet } from "@tensorflow-models/mobilenet";
import { createDetector as loadFaceDetection, SupportedModels, type FaceDetector } from "@tensorflow-models/face-detection";

export type ImageSource = Parameters<typeof browser.fromPixels>[0];
export type ClassificationGroup = {
    name: string
    dataset: ImageSource[]
}

export class Model {
    private mobilenet: MobileNet | undefined;
    private faceDetector: FaceDetector | undefined;
    private model: Sequential;
    private classNames: ClassificationGroup[] = [{ name: 'Default', dataset: [] }];
    public isReady: boolean = false;

    constructor() {
        this.model = sequential();
        this.initializeMobileNet();
    }

    /** Asynchronously loads MobileNet v2 */
    private async initializeMobileNet() {
        this.mobilenet = await loadMobileNet({ version: 2, alpha: 1.0 })
        this.faceDetector = await loadFaceDetection(SupportedModels.MediaPipeFaceDetector, {
            runtime: 'tfjs'
        })
    }

    /** Get Class Data */
    getClassData = () => this.classNames
    /** Updates class names and resets the model */

    updateClassData = async (classData: ClassificationGroup[]) => {
        this.classNames = classData;
        this.model = sequential();
        this.model.add(layers.dense({ inputShape: [1280], units: 256, activation: "relu" }));
        this.model.add(layers.batchNormalization());
        this.model.add(layers.dense({ units: 128, activation: "relu" }));
        this.model.add(layers.batchNormalization());
        this.model.add(layers.dense({ units: classData.length, activation: "softmax" }));
        this.model.compile({
            optimizer: "adam",
            loss: "sparseCategoricalCrossentropy",
            metrics: ["accuracy"],
        });

        this.isReady = false;

        if (classData.length < 2) return;
        if (!this.mobilenet) return;
        if (!this.faceDetector) return;

        const featureTensors: Tensor[] = [];
        const labelTensors: number[] = [];

        for (let i = 0; i < classData.length; i++) {
            const { dataset } = classData[i];

            for (const source of dataset) {
                const features = await this.getFaceFeatures(source);
                if (!features) continue;

                featureTensors.push(features);
                labelTensors.push(i);
            }
        }

        const xTrain = tidy(() => featureTensors.length > 1
            ? concat(featureTensors).toFloat()
            : featureTensors[0].toFloat()
        );

        const yTrain = tidy(() => tensor1d(labelTensors, "float32"));

        if (!xTrain || !yTrain) return;

        await this.model.fit(xTrain, yTrain, {
            epochs: 100,
            batchSize: 2,
            shuffle: true,
        });

        xTrain.dispose();
        yTrain.dispose();
        this.isReady = true;
    };

    public getFaceImageData = async (source: ImageSource) => {
        if (!this.mobilenet || !this.faceDetector) return undefined;

        const image = this._toImageData(source);
        if (!image) return undefined;

        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return undefined;

        ctx.putImageData(image, 0, 0);

        const faces = await this.faceDetector.estimateFaces(canvas);
        if (!faces.length) return undefined;

        const prediction = faces[0];
        const { xMin, yMin, width, height } = prediction.box;

        // Create a new cropped canvas for the detected face
        const faceCanvas = document.createElement('canvas');
        faceCanvas.width = 224; // Resize to MobileNet's expected input size
        faceCanvas.height = 224;
        const faceCtx = faceCanvas.getContext('2d');
        if (!faceCtx) return undefined;

        faceCtx.drawImage(canvas, xMin, yMin, width, height, 0, 0, 224, 224);

        return faceCtx.getImageData(0, 0, 224, 224);
    };

    /** Extracts image features from MobileNet */
    public async getFaceFeatures(source: ImageSource) {
        const faceImage = await this.getFaceImageData(source);
        if (!faceImage) return null;

        return tidy(() =>
            this.mobilenet!.infer(
                browser.fromPixels(faceImage)
                    .toFloat()
                    .div(255)
                    .expandDims(),
                true // Returns 1280D embeddings
            ) as Tensor
        );
    }

    /** Gets a prediction from an image source */
    getPrediction = async (source: ImageSource) => {
        const faceFeatures = await this.getFaceFeatures(source);
        if (!faceFeatures) return;

        const prediction = tidy(() => this.model.predict(faceFeatures));
        if (Array.isArray(prediction)) return;

        const predictionArray = prediction.arraySync() as number[][];
        const highestIndex = predictionArray[0].indexOf(Math.max(...predictionArray[0]));
        const predictedClass = this.classNames[highestIndex];
        if (!predictedClass) return;

        return { name: predictedClass.name, confidence: predictionArray[0][highestIndex] };
    };

    private _toImageData = (input: ImageSource): ImageData | null => {
        if (input instanceof ImageData) {
            return input; // Already in ImageData format
        }

        if (input instanceof HTMLCanvasElement) {
            // If it's already a canvas, just return the ImageData
            const ctx = input.getContext('2d');
            if (!ctx) return null;
            return ctx.getImageData(0, 0, input.width, input.height);
        }

        if (input instanceof HTMLImageElement || input instanceof HTMLVideoElement || input instanceof ImageBitmap) {
            // Create a canvas to draw the image or video onto
            const canvas = document.createElement('canvas');
            canvas.width = input.width;
            canvas.height = input.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            // Draw the image or video onto the canvas
            ctx.drawImage(input, 0, 0);

            // Return ImageData from the canvas
            return ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        return null;
    }

    /** Disposes of the model */
    dispose = () => {
        this.mobilenet = undefined;
        this.model.dispose();
    };
}
