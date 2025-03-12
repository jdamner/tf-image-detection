import React, { useEffect, useState } from "react";
import {
  CreateWebWorkerMLCEngine,
  prebuiltAppConfig,
  type ChatCompletionMessageParam,
  type InitProgressReport,
  type WebWorkerMLCEngine,
} from "@mlc-ai/web-llm";
import {
  Button,
  Divider,
  LinearProgress,
  List,
  Input,
  FormControl,
  Select,
  Option,
  Modal,
  ModalDialog,
  IconButton,
  Stack,
} from "@mui/joy";
import ResponseMessage from "./ResponseMessage";
import { HelpOutline } from "@mui/icons-material";
import { FormLabel } from "@mui/material";

const App: React.FC = () => {
  const [engine, setEngine] = useState<WebWorkerMLCEngine>();
  const [loadState, setLoadState] = useState<InitProgressReport>({
    progress: 0,
    text: "",
    timeElapsed: 0,
  });

  const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([
    {
      role: "system",
      content:
        "You are a helpful AI assistant. You should answer any question the user presents.",
    },
  ]);

  const smallestModel = prebuiltAppConfig.model_list.sort((a, b) =>
    (a.vram_required_MB ?? 0) > (b.vram_required_MB ?? 0) ? 1 : -1,
  )[1];

  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState(smallestModel);
  const [showModelDetails, setShowModelDetails] = useState(false);

  useEffect(() => {
    (async () => {
      setEngine(undefined);
      setEngine(
        await CreateWebWorkerMLCEngine(
          new Worker(new URL("./web-worker.ts", import.meta.url), {
            type: "module",
          }),
          selectedModel.model_id,
          {
            initProgressCallback: setLoadState,
            appConfig: {
              ...prebuiltAppConfig,
              useIndexedDBCache: true,
            },
          },
        ),
      );
    })();
    return () => {
      engine?.unload();
    };
  }, [selectedModel]);

  const handleUserQuery = () => {
    const queryObj: ChatCompletionMessageParam = {
      role: "user",
      content: userQuery,
    };
    setIsLoadingResult(true);
    engine?.chat.completions
      .create({ messages: [...messages, queryObj] })
      .then((reply) => {
        setMessages([...messages, queryObj, reply.choices[0].message]);
        setIsLoadingResult(false);
      })
      .catch((error) => {
        setMessages([
          ...messages,
          queryObj,
          { role: "system", content: error.toString() },
        ]);
        setIsLoadingResult(false);
      });
    setUserQuery("");
    setMessages([...messages, queryObj]);
  };

  return (
    <>
      {!engine ? (
        <>
          <LinearProgress />
          <pre>{loadState.text}</pre>
        </>
      ) : (
        <>
          <List>
            {messages
              .filter((message) => message.role !== "system")
              .map((message, index) => {
                return (
                  <ResponseMessage key={index} role={message.role}>
                    {message.content?.toString() ?? ""}
                  </ResponseMessage>
                );
              })}
            {isLoadingResult && <ResponseMessage role="assistant" isLoading />}
          </List>

          <FormControl>
            <Input
              aria-label="Chat input"
              sx={{ "--Input-decoratorChildHeight": "45px" }}
              fullWidth
              placeholder="Enter your message..."
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
              onKeyUp={(event) => {
                if (event.key === "Enter") {
                  handleUserQuery();
                }
              }}
              endDecorator={
                <Button
                  type="submit"
                  onClick={handleUserQuery}
                  disabled={isLoadingResult || userQuery === ""}
                  sx={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                >
                  Submit
                </Button>
              }
            />
          </FormControl>
        </>
      )}

      <Divider sx={{ marginY: 3 }} />

      <FormControl>
        <FormLabel>Select Model</FormLabel>
        <Stack direction={"row"} alignItems={"center"}>
          <Select
            size="sm"
            value={selectedModel.model_id}
            onChange={(event, value) => {
              const foundModel = prebuiltAppConfig.model_list.find(
                (model) => model.model_id === value,
              );

              if (foundModel) setSelectedModel(foundModel);
            }}
          >
            {prebuiltAppConfig.model_list.map((model) => (
              <Option key={model.model_id} value={model.model_id}>
                {model.model_id}
              </Option>
            ))}
          </Select>
          <IconButton
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => setShowModelDetails(true)}
          >
            <HelpOutline />
          </IconButton>
        </Stack>
      </FormControl>
      <Modal open={showModelDetails} onClose={() => setShowModelDetails(false)}>
        <ModalDialog>
          <pre>{JSON.stringify(selectedModel, null, 2)}</pre>
        </ModalDialog>
      </Modal>
    </>
  );
};

export default App;
