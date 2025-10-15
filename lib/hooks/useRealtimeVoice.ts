"use client";

/**
 * useRealtimeVoice Hook
 *
 * Simple hook for OpenAI Realtime API voice conversations
 * Uses direct WebSocket connection to OpenAI (client-side)
 */

import { useRef, useState, useCallback, useEffect } from "react";

interface UseRealtimeVoiceOptions {
  apiKey: string;
  language: "ar" | "fr";
  onTranscript?: (text: string, isUser: boolean) => void;
  onError?: (error: string) => void;
}

interface RealtimeVoiceState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  userTranscript: string;
  aiTranscript: string;
  error: string | null;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions) {
  const { apiKey, language, onTranscript, onError } = options;

  const [state, setState] = useState<RealtimeVoiceState>({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    userTranscript: "",
    aiTranscript: "",
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const connect = useCallback(async () => {
    if (!apiKey) {
      const error = language === "ar" ? "مفتاح API غير متوفر" : "Clé API manquante";
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    try {
      // Connect to our backend relay (browsers can't send auth headers to OpenAI directly)
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
      const wsUrl = apiUrl.replace("http://", "").replace("https://", "");
      const url = `${protocol}//${wsUrl}/api/v1/realtime/ws/realtime?language=${language}`;

      console.log("Connecting to:", url);
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("✅ Connected to backend relay");
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        // Backend handles session configuration
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleServerMessage(message);
        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      };

      ws.onerror = () => {
        const error = language === "ar" ? "خطأ في الاتصال" : "Erreur de connexion";
        setState(prev => ({ ...prev, error, isConnected: false }));
        onError?.(error);
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        setState(prev => ({ ...prev, isConnected: false, isListening: false }));
      };

      wsRef.current = ws;

    } catch (err) {
      const error = language === "ar" ? "فشل الاتصال" : "Échec de connexion";
      setState(prev => ({ ...prev, error }));
      onError?.(error);
    }
  }, [apiKey, language, onError]);

  const handleServerMessage = useCallback((message: any) => {
    const type = message.type;

    switch (type) {
      case "session.created":
        console.log("Session created");
        break;

      case "conversation.item.input_audio_transcription.completed":
        const userText = message.transcript || "";
        setState(prev => ({ ...prev, userTranscript: userText }));
        onTranscript?.(userText, true);
        break;

      case "response.audio_transcript.delta":
        const aiDelta = message.delta || "";
        setState(prev => ({ ...prev, aiTranscript: prev.aiTranscript + aiDelta }));
        break;

      case "response.audio_transcript.done":
        const aiText = message.transcript || "";
        setState(prev => ({ ...prev, aiTranscript: aiText, isSpeaking: false }));
        onTranscript?.(aiText, false);
        break;

      case "response.audio.delta":
        // Play audio chunk
        if (message.delta) {
          playAudioChunk(message.delta);
        }
        setState(prev => ({ ...prev, isSpeaking: true }));
        break;

      case "error":
        const error = message.error?.message || "Unknown error";
        setState(prev => ({ ...prev, error }));
        onError?.(error);
        break;
    }
  }, [onTranscript, onError]);

  const playAudioChunk = useCallback(async (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const context = audioContextRef.current;

      // Decode base64
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
      }

      // Create buffer and play
      const buffer = context.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();

    } catch (err) {
      console.error("Audio playback error:", err);
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      await connect();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      // Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      streamRef.current = stream;

      // Create audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const context = audioContextRef.current;
      const source = context.createMediaStreamSource(stream);

      // Create processor for streaming
      const processor = context.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(context.destination);

      processor.onaudioprocess = (event) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = event.inputBuffer.getChannelData(0);

        // Convert to PCM16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Encode to base64
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        // Send to OpenAI
        wsRef.current.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64
        }));
      };

      setState(prev => ({ ...prev, isListening: true, userTranscript: "", aiTranscript: "" }));

    } catch (err: any) {
      const error = err.name === "NotAllowedError"
        ? (language === "ar" ? "تم رفض الوصول إلى الميكروفون" : "Accès micro refusé")
        : (language === "ar" ? "خطأ في الميكروفون" : "Erreur microphone");

      setState(prev => ({ ...prev, error }));
      onError?.(error);
    }
  }, [connect, language, onError]);

  const stopListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Commit audio buffer
      wsRef.current.send(JSON.stringify({
        type: "input_audio_buffer.commit"
      }));

      // Request response
      wsRef.current.send(JSON.stringify({
        type: "response.create"
      }));
    }

    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  const disconnect = useCallback(() => {
    stopListening();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setState({
      isConnected: false,
      isListening: false,
      isSpeaking: false,
      userTranscript: "",
      aiTranscript: "",
      error: null,
    });
  }, [stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    startListening,
    stopListening,
  };
}
