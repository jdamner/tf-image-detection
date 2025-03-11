import React, { PropsWithChildren } from "react";

import type { ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import { Stack, ListItem, Avatar, CircularProgress } from "@mui/joy";
import { AccountCircle, Adjust } from "@mui/icons-material";

const ResponseMessage: React.FC<
  PropsWithChildren<{
    role: ChatCompletionMessageParam["role"];
    isLoading?: boolean;
  }>
> = ({ role, children = "", isLoading = false }) => {
  return (
    <ListItem className={role}>
      <Stack
        width={"100%"}
        direction={role === "user" ? "row-reverse" : "row"}
        alignItems="center"
        justifyContent={role === "user" ? "end" : "start"}
        gap={1}
      >
        <Avatar>
          {isLoading ? (
            <CircularProgress />
          ) : role === "user" ? (
            <AccountCircle />
          ) : (
            <Adjust />
          )}
        </Avatar>
        <p style={{ marginBottom: "20px" }}>{children}</p>
      </Stack>
    </ListItem>
  );
};

export default ResponseMessage;
