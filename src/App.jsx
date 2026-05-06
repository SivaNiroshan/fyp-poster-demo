import { useState, useRef } from "react";
import "./App.css";
import { Client } from "@gradio/client";
import { sendAudioToASR } from "./api/asrApi";

const scripts = [
  "நான் going to school tomorrow",
  "இது my final year project demo",
  "Can you switch on the light please",
  "அவன் meetingக்கு late ஆக வந்தான்",
  "Today நாம் ASR model test பண்ண போறோம்",
];

function App() {
  const [selectedScript, setSelectedScript] = useState(0);
  const [scriptAudio, setScriptAudio] = useState(null);
  const [randomAudio, setRandomAudio] = useState(null);
  const [generated, setGenerated] = useState({});
  const [recordPanelType, setRecordPanelType] = useState(null);
  const [recordingType, setRecordingType] = useState(null);

  const mediaRecorderRef = useRef(null);

  const clearGenerated = (id) => {
    setGenerated((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const audioObj = {
      id: Date.now(),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      type,
    };

    if (type === "script") {
      if (scriptAudio) clearGenerated(scriptAudio.id);
      setScriptAudio(audioObj);
    } else {
      if (randomAudio) clearGenerated(randomAudio.id);
      setRandomAudio(audioObj);
    }

    setRecordPanelType(null);
    e.target.value = "";
  };

  const openRecordPanel = (type) => {
    if (type === "script") {
      if (scriptAudio) {
        clearGenerated(scriptAudio.id);
        setScriptAudio(null);
      }
    }

    if (type === "random") {
      if (randomAudio) {
        clearGenerated(randomAudio.id);
        setRandomAudio(null);
      }
    }

    setRecordPanelType(type);
  };

  const startRecording = async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    let chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });

      const audioObj = {
        id: Date.now(),
        file: blob,
        url: URL.createObjectURL(blob),
        name: `recording-${Date.now()}.webm`,
        type,
      };

      if (type === "script") {
        if (scriptAudio) clearGenerated(scriptAudio.id);
        setScriptAudio(audioObj);
      } else {
        if (randomAudio) clearGenerated(randomAudio.id);
        setRandomAudio(audioObj);
      }

      setRecordingType(null);
      setRecordPanelType(type);
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setRecordingType(type);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const generateText = async (audio) => {

  try {

    setGenerated((prev) => ({
      ...prev,
      [audio.id]: {
        loading: true,
      },
    }));

    const result = await sendAudioToASR(audio.file);

    setGenerated((prev) => ({
      ...prev,
      [audio.id]: {
        loading: false,
        asrText: result.asrText,
        finalText: result.finalText,
        hints: result.hints,
      },
    }));

  } catch (error) {

    console.error(error);

    setGenerated((prev) => ({
      ...prev,
      [audio.id]: {
        loading: false,
        error: "Failed to generate text",
      },
    }));
  }
};

  const deleteAudio = (audio) => {
    if (audio.type === "script") {
      setScriptAudio(null);
    } else {
      setRandomAudio(null);
    }

    clearGenerated(audio.id);
  };

  const AudioItem = ({ audio }) => (
    <div className="audio-card">
      <p className="audio-name">{audio.name}</p>

      <audio controls src={audio.url}></audio>

      <div className="audio-actions">
        <button className="generate-btn" onClick={() => generateText(audio)}>
          ⚙ Generate Text
        </button>

        <button className="delete-btn" onClick={() => deleteAudio(audio)}>
          ❌ Delete
        </button>
      </div>

      {generated[audio.id]?.loading && (
  <div className="transcript-box">
    <p>Generating transcription...</p>
  </div>
)}

{generated[audio.id]?.error && (
  <div className="transcript-box">
    <p>{generated[audio.id].error}</p>
  </div>
)}

{generated[audio.id]?.finalText && (
  <div className="transcript-box">

    <h4>ASR Output</h4>
    <p>{generated[audio.id].asrText}</p>

    <h4>Final Corrected Text</h4>
    <p>{generated[audio.id].finalText}</p>

  </div>
)}
    </div>
  );

  const RecordControls = ({ type }) => (
    <div className="record-panel">
      {recordingType === type ? (
        <button className="stop-record-btn recording-action" onClick={stopRecording}>
          ⏹ Stop Recording
        </button>
      ) : (
        <button
          className="start-record-btn recording-action"
          onClick={() => startRecording(type)}
          disabled={recordingType !== null}
        >
          ▶ Start Recording
        </button>
      )}
    </div>
  );

  const ControlButtons = ({ type }) => (
    <>
      <div className="top-actions">
        <label className="upload-btn same-size-btn">
          ⬆ Upload Audio
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => handleUpload(e, type)}
            hidden
          />
        </label>

        <button
          className="primary same-size-btn"
          onClick={() => openRecordPanel(type)}
          disabled={recordingType !== null}
        >
          🎤 Record
        </button>
      </div>

      {recordPanelType === type && <RecordControls type={type} />}
    </>
  );

  return (
    <div className="app">
      <header className="header">
        <h1>Enhanced Tamil-English Code Switched ASR</h1>
        <p className="subtitle">Interactive Speech Recognition Demo</p>
      </header>

      <div className="main-grid">
        <div className="card">
          <h2>📜 Script-Based</h2>

          <div className="script-selector">

  <label className="script-label">
    Select Script
  </label>

  <select
    className="script-dropdown"
    value={selectedScript}
    onChange={(e) => {
      setSelectedScript(Number(e.target.value));

      // clear existing audio when changing script
      if (scriptAudio) {
        clearGenerated(scriptAudio.id);
        setScriptAudio(null);
      }
    }}
  >
    {scripts.map((_, index) => (
      <option key={index} value={index}>
        Script {index + 1}
      </option>
    ))}
  </select>

</div>

<div className="script-number">
  Script {selectedScript + 1}
</div>

<div className="script-box">
  {scripts[selectedScript]}
</div>

          <ControlButtons type="script" />

          {scriptAudio && <AudioItem audio={scriptAudio} />}
        </div>

        <div className="card">
          <h2>🎧 Random Speech</h2>

          <p className="description">
            Upload or record any Tamil-English speech and generate the transcript.
          </p>

          <ControlButtons type="random" />

          {randomAudio && <AudioItem audio={randomAudio} />}
        </div>
      </div>
    </div>
  );
}

export default App;