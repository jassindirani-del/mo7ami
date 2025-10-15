"use client";

/**
 * Elegant streaming chat hook with smooth UX
 * Uses Server-Sent Events (SSE) for ChatGPT-style streaming
 */

import { useState, useCallback, useRef } from "react";

interface StreamingChatOptions {
  apiUrl?: string;
  onStreamStart?: () => void;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string, citations: any[], metadata: any) => void;
  onError?: (error: string) => void;
}

interface StreamingState {
  isStreaming: boolean;
  isPreparing: boolean;  // Thinking/preparing phase
  currentText: string;
  error: string | null;
  citations: any[];
  metadata: any;
}

export function useStreamingChat(options: StreamingChatOptions = {}) {
  const {
    apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    onStreamStart,
    onChunk,
    onComplete,
    onError,
  } = options;

  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    isPreparing: false,
    currentText: "",
    error: null,
    citations: [],
    metadata: {},
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const fullTextRef = useRef<string>("");
  const citationsRef = useRef<any[]>([]);
  const metadataRef = useRef<any>({});

  const sendMessage = useCallback(
    async (params: {
      message: string;
      language?: string;
      conversationId?: string | null;
      voiceInput?: boolean;
      userId?: string | null;
      clientToken?: string;
    }) => {
      // Reset state with preparing phase
      setState({
        isStreaming: false,
        isPreparing: true,  // Show thinking indicator
        currentText: "",
        error: null,
        citations: [],
        metadata: {},
      });
      fullTextRef.current = "";
      citationsRef.current = [];
      metadataRef.current = {};

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(`${apiUrl}/api/v1/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: params.message,
            language: params.language || "ar",
            conversation_id: params.conversationId || null,
            voice_input: params.voiceInput || false,
            user_id: params.userId || null,
            client_token: params.clientToken,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        // Read the stream
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });

          // Parse SSE events (format: "data: {...}\n\n")
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                switch (data.type) {
                  case "citations":
                    citationsRef.current = data.data;
                    // Citations received - we're about to start streaming
                    setState(prev => ({
                      ...prev,
                      citations: data.data,
                    }));
                    break;

                  case "metadata":
                    metadataRef.current = data.data;
                    setState(prev => ({
                      ...prev,
                      metadata: data.data,
                    }));
                    break;

                  case "content":
                    // First content chunk - switch from preparing to streaming
                    if (state.isPreparing) {
                      setState(prev => ({
                        ...prev,
                        isPreparing: false,
                        isStreaming: true,
                      }));
                      onStreamStart?.();
                    }

                    fullTextRef.current += data.data;
                    setState(prev => ({
                      ...prev,
                      isPreparing: false,
                      isStreaming: true,
                      currentText: fullTextRef.current,
                    }));
                    onChunk?.(data.data);
                    break;

                  case "done":
                    setState(prev => ({
                      ...prev,
                      isStreaming: false,
                      isPreparing: false,
                    }));
                    onComplete?.(
                      fullTextRef.current,
                      citationsRef.current,
                      metadataRef.current
                    );
                    break;

                  case "error":
                    throw new Error(data.data);
                }
              } catch (parseError) {
                console.error("Failed to parse SSE message:", parseError);
              }
            }
          }
        }

      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Stream aborted by user");
          setState(prev => ({
            ...prev,
            isStreaming: false,
            isPreparing: false,
          }));
        } else {
          const errorMessage = error.message || "Failed to stream response";
          setState(prev => ({
            ...prev,
            isStreaming: false,
            isPreparing: false,
            error: errorMessage,
          }));
          onError?.(errorMessage);
        }
      }
    },
    [apiUrl, onStreamStart, onChunk, onComplete, onError, state.isPreparing]
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isStreaming: false,
        isPreparing: false,
      }));
    }
  }, []);

  return {
    ...state,
    sendMessage,
    cancelStream,
  };
}
