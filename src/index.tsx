import React from "react";
import { createRoot } from "react-dom/client";
import { Container, Grid2 as Grid, Card, CardContent } from "@mui/material";

import TFWebcamDetectApp from "./TF-Webcam-Detect";
import WebLLMChatApp from "./WebLLM-Chat";

const div = document.createElement("div");
const root = createRoot(div);

root.render(
  <Container>
    <h1>AI Examples</h1>
    <Grid container gap={1}>
      <Grid size={7}>
        <Card>
          <CardContent>
            <h2>Video Detection</h2>
            <p>Tensorflow.js Powered video detection using the COCO-SSD model.</p>
            <TFWebcamDetectApp />
          </CardContent>
        </Card>
        </Grid>
        <Grid size={4}>
      <Card>
        <CardContent>
          <h2>Chat</h2>
          <p>
            A simple-chatbot using the smallest AI model I can find! Powered by
            WebLLM.
          </p>
          <WebLLMChatApp />
        </CardContent>
      </Card>
      </Grid>
    </Grid>
  </Container>,
);
document.body.appendChild(div);
