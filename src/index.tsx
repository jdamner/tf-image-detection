import React from "react";
import { createRoot } from "react-dom/client";
import { Container, Tab, TabList, TabPanel, Tabs } from "@mui/joy";

import TFWebcamDetectApp from "./TF-Webcam-Detect";
import WebLLMChatApp from "./WebLLM-Chat";

const div = document.createElement("div");
const root = createRoot(div);

root.render(
  <Container>
    <h1>AI Examples</h1>
    <Tabs defaultValue={0}>
      <TabList>
        <Tab>Chat</Tab>
        <Tab>Video Detection</Tab>
      </TabList>
      <TabPanel value={0}>
        <p>
          A simple-chatbot using the an AI model of your choice! Powered by
          WebLLM.
        </p>
        <WebLLMChatApp />
      </TabPanel>
      <TabPanel value={1}>
        <p>Tensorflow.js Powered video detection using the COCO-SSD model.</p>
        <TFWebcamDetectApp />
      </TabPanel>
    </Tabs>
  </Container>,
);
document.body.appendChild(div);
