import React, { useRef, useState, useEffect } from "react";

import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";

import { type ClassificationGroup, Model } from "./Model";
import { DataSetModalContent } from "./DataSetModalContent";

import { Button, IconButton, Modal, ModalClose, ModalDialog, Table } from "@mui/joy";
import { Close, Add, Edit } from '@mui/icons-material'

const detector = new Model();
const defaultPrediction = { name: 'Loading...', confidence: 0 }

const App: React.FC = () => {
  const video = useRef<HTMLVideoElement>(null);
  const [prediction, setPrediction] = useState(defaultPrediction);
  const [dataSets, setDataSets] = useState<ClassificationGroup[]>(detector.getClassData());
  const [modalDataSet, setModalDataSet] = useState<ClassificationGroup | null>(null);
  const [showNewDataSetModal, setShowNewDataSetModal] = useState(false);

  useEffect(() => {
    (async () =>
      video.current &&
      (video.current.srcObject = await navigator.mediaDevices.getUserMedia({
        video: true,
      })))();
    return () => {
      if (video.current && video.current.srcObject) {
        (video.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    detector.updateClassData(dataSets);
  }, [dataSets])

  const predict = () => {
    const currentVideo = video.current;
    if (detector.isReady && currentVideo && modalDataSet === null && showNewDataSetModal === false ) {
      detector.getPrediction(currentVideo).then(( value ) => setPrediction( value ?? defaultPrediction ));
    } else { 
      setPrediction( defaultPrediction );
    }
    window.requestAnimationFrame(predict);
  }

  const DataSetModal = () => {
    const index = dataSets.findIndex((dataset) => dataset.name === modalDataSet?.name)

    return (
      <Modal open={modalDataSet !== null} onClose={() => setModalDataSet(null)}>
        <ModalDialog size="lg">
          <ModalClose />
          <DataSetModalContent
            dataset={modalDataSet}
            onClose={() => setModalDataSet(null)}
            setDataSet={(newDataSet) => {
              setDataSets([
                ...dataSets.filter((_, i) => i !== index),
                newDataSet
              ])
            }}
            getFaceImageData={detector.getFaceImageData}
          />
        </ModalDialog>
      </Modal>
    )
  }

  const NewDataSetModal = () => {
    return (
      <Modal open={showNewDataSetModal} onClose={() => setShowNewDataSetModal(false)}>
        <ModalDialog size="lg">
          <ModalClose />
          <DataSetModalContent
            dataset={null}
            onClose={() => setShowNewDataSetModal(false)}
            setDataSet={(newDataSet) => setDataSets([...dataSets, newDataSet])}
            getFaceImageData={detector.getFaceImageData}
          />
        </ModalDialog>
      </Modal>)
  }

  return (
    <>
      <div className="videoContainer">
        <video
          ref={video}
          onLoadedData={predict}
          autoPlay
          muted
          width={640}
          height={480}
        />
        <div>
          {prediction.confidence > 0.5 && (<span>{prediction.name} <em>({(prediction.confidence * 100).toFixed(1)}% confidence)</em></span>)}
        </div>
        <div>
          <h2>Data Sets</h2>
          <Table>
            <thead><tr><th>Name</th><th># Images</th><th>Actions</th></tr></thead>
            <tbody>
              {dataSets.map((dataset) => (
                <tr key={dataset.name}>
                  <td>{dataset.name}</td>
                  <td>{dataset.dataset.length.toString()}</td>
                  <td>
                    <IconButton size="sm" variant="plain" color="primary" onClick={() => setModalDataSet(dataset)} title="Edit" aria-label="Edit Dataset"><Edit /></IconButton>
                    {detector.getClassData().length > 1 && <IconButton
                      size="sm"
                      variant="plain"
                      title="Delete"
                      aria-label="Delete dataset"
                      color="danger"><Close /></IconButton>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <NewDataSetModal />
          <DataSetModal />
          <Button onClick={() => setShowNewDataSetModal(true)} color="primary" size="md" startDecorator={<Add />}>Add Dataset</Button>
        </div>
      </div>
    </>
  );
};

export default App;
