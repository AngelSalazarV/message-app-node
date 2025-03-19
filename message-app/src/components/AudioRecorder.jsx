import { useState, useRef } from "react";
import socket from "../client";
import { Mic, CirclePause, SendHorizonal, Trash } from "lucide-react";

function AudioRecorder({ userId, receivedId }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const token = localStorage.getItem('token')

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
      setAudioBlob(audioBlob);
      audioChunks.current = [];
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    formData.append("sender_id", userId);
    formData.append("receiver_id", receivedId);

    const response = await fetch(`http://localhost:3000/api/messages/audio`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    

    if (response.ok) {
      const audioMessage = await response.json();
      socket.emit("sendMessage", audioMessage);
      setAudioBlob(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={recording ? stopRecording : startRecording}
        className="p-2 cursor-pointer rounded-3xl hover:bg-gray-300"
      >
        {recording ? <CirclePause color="red"/> : <Mic color="#54656F"/>}
      </button>
      {audioBlob && (
        <>
          <audio controls src={URL.createObjectURL(audioBlob)}></audio>
          <button  className="hover:bg-gray-300 p-2 rounded-3xl cursor-pointer">
            <Trash color="gray" fill="gray"/>
          </button>
          <button onClick={sendAudio} className="bg-green-500 text-white p-2 rounded-3xl cursor-pointer hover:bg-green-400">
            <SendHorizonal color="#fff"/>
          </button>
        </>
      )}
    </div>
  );
}

export default AudioRecorder;
