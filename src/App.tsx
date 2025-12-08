import { useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { saveAs } from "file-saver";
import "./App.css";

const ffmpeg = new FFmpeg();

function App() {
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoName, setVideoName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isType, setIsType] = useState<"GIF" | "MP3">("GIF");

  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {

    const init = async () => {
      await ffmpeg.load();
    };
    init();
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (!file) return;

    setVideo(file);
    setVideoUrl(URL.createObjectURL(file));
    setVideoName(file.name);
  };

  const handleClose = () => {
    setVideo(null);
    setVideoUrl("");
    setVideoName("");
    formRef.current?.reset();
  };

  const handleConvert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!video) return;

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string) || "output";
    const start = (formData.get("start") as string) || "0";
    const time = (formData.get("time") as string) || "10";

    const outname = isType === "GIF" ? `${name}.gif` : `${name}.mp3`;
    const mime = isType === "GIF" ? "image/gif" : "audio/mp3";

    setLoading(true);

    try {
      await ffmpeg.writeFile("input.mp4", await fetchFile(video));

      await ffmpeg.exec([
        "-i",
        "input.mp4",
        "-t",
        time,
        "-ss",
        start,
        "-f",
        isType.toLowerCase(),
        outname,
      ]);

      const data = await ffmpeg.readFile(outname);
      let buffer: Uint8Array;

      if (typeof data === "string") {
        buffer = new TextEncoder().encode(data);
      } else {
        buffer = data;
      }

      const uint8 = new Uint8Array(buffer);

      const blob = new Blob([new Uint8Array(uint8).buffer], { type: mime });

      saveAs(blob, outname);
    } catch (err) {
      console.error(err);
      alert("Conversion failed");
    }

    setLoading(false);
    handleClose();
  };

  return (
    <main>
      <div className="container">
        {videoUrl ? (
          <div className="video_container">
            <video controls src={videoUrl}></video>
            <button
              type="button"
              className="video_close"
              onClick={handleClose}
            >
              X
            </button>
          </div>
        ) : (
          <label className="video_input">
            Upload a video to Convert to GIF or MP3
            <input type="file" accept="video/*" onChange={handleInput} hidden />
          </label>
        )}
      </div>

      <h3>{videoName}</h3>

      <form onSubmit={handleConvert} ref={formRef}>
        <div className="group">
          <label>
            <input
              type="checkbox"
              value="GIF"
              checked={isType === "GIF"}
              onChange={() => setIsType("GIF")}
            />
            Convert to GIF
          </label>

          <label>
            <input
              type="checkbox"
              value="MP3"
              checked={isType === "MP3"}
              onChange={() => setIsType("MP3")}
            />
            Convert to MP3
          </label>
        </div>

        <div className="group">
          <label>
            <p>Name to Download</p>
            <input type="text" name="name" placeholder="Ex: output" />
          </label>

          <label>
            <p>Start</p>
            <input type="number" name="start" min={0} defaultValue={0} />
          </label>

          <label>
            <p>Time</p>
            <input type="number" name="time" min={0} defaultValue={10} />
          </label>

          <div>
            <p>&nbsp;</p>
            <button disabled={!video || loading}>
              {loading
                ? "Converting..."
                : `Download and convert to ${isType}`}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

export default App;
