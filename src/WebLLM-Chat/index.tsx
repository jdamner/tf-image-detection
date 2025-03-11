import React, { useEffect, useState } from "react";
import {
  CreateWebWorkerMLCEngine,
  prebuiltAppConfig,
  type ChatCompletionMessageParam,
  type InitProgressReport,
  type WebWorkerMLCEngine,
} from "@mlc-ai/web-llm";
import { Button, Divider, LinearProgress, Stack, List, Input } from "@mui/joy";
import ResponseMessage from "./ResponseMessage";

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
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [userQuery, setUserQuery] = useState("");

  const smallestModel = prebuiltAppConfig.model_list.sort((a, b) =>
    (a.vram_required_MB ?? 0) > (b.vram_required_MB ?? 0) ? 1 : -1,
  )[1];

  useEffect(() => {
    (async () => {
      console.log("Loading " + smallestModel.model_id);
      setEngine(
        await CreateWebWorkerMLCEngine(
          new Worker(new URL("./worker.ts", import.meta.url), {
            type: "module",
          }),
          smallestModel.model_id,
          {
            initProgressCallback: setLoadState,
          },
        ),
      );
    })();
  }, []);

  if (!engine) {
    return (
      <>
        <LinearProgress />
        <pre>{loadState.text}</pre>
      </>
    );
  }

  const handleUserQuery = () => {
    const queryObj: ChatCompletionMessageParam = {
      role: "user",
      content: userQuery,
    };
    setIsLoadingResult(true);
    engine.chat.completions
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
      <Divider />
      <Stack
        direction="row"
        marginTop={2}
        justifyContent="center"
        alignItems="center"
        gap={2}
      >
        <Input
          fullWidth
          placeholder="Type to chat..."
          value={userQuery}
          onChange={(event) => setUserQuery(event.target.value)}
          onKeyUp={(event) => {
            if (event.key === "Enter") {
              handleUserQuery();
            }
          }}
        />
        <Button
          type="submit"
          onClick={handleUserQuery}
          disabled={isLoadingResult || userQuery === ""}
        >
          Submit
        </Button>
      </Stack>
    </>
  );
};

export default App;
