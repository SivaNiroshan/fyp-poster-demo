import { Client } from "@gradio/client";

export async function sendAudioToASR(audioFile) {

  const client = await Client.connect(
    "Sathiendra/Demo-project",
    {
      token: import.meta.env.VITE_HF_TOKEN,
    }
  );

  const result = await client.predict("/full_pipeline", {
    audio: audioFile,
  });

  return {
    asrText: result.data[0],
    hints: result.data[1],
    finalText: result.data[2],
    debug: result.data[3],
  };
}