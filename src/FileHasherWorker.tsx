import React, { useState, useEffect, useCallback } from "react";

interface FileInfo {
  name: string;
  hash: string;
  size: number;
}
const NUM_WORKERS = 5;

function calculateMD5Hook() {
  const [fileInfos, setFileInfos] = useState<FileInfo[]>([]);
  const onMessage = useCallback(
    (message: MessageEvent) => {
      if (message.data.type === "HASH_CALCULATED") {
        setFileInfos((fileInfos) => [
          ...fileInfos,
          {
            name: message.data.name,
            hash: message.data.hash,
            size: message.data.size,
          },
        ]);
      }
    },
    [setFileInfos]
  );
  const onError = useCallback((error: ErrorEvent) => {
    console.error(error);
  }, []);

  const [workers, setWorkers] = useState<Worker[]>([]);
  useEffect(() => {
    console.log("useEffect called");
    setWorkers(
      [...Array(NUM_WORKERS)].map(() => {
        const worker = new Worker("./worker.js");
        worker.addEventListener("message", onMessage);
        worker.addEventListener("error", onError);
        return worker;
      })
    );
    return () => {
      setWorkers((workers) => {
        console.log(workers);
        workers.forEach((worker) => {
          worker.removeEventListener("message", onMessage);
          worker.removeEventListener("error", onError);
          worker.terminate();
          worker = null;
        });
        return [];
      });
    };
  }, []);

  const calculateMD5 = useCallback(
    (files: FileList) => {
      for (let i = 0; i < files.length; i++) {
        workers[i % NUM_WORKERS].postMessage({
          type: "CALCULATE_HASH",
          file: files[i],
        });
      }
    },
    [workers]
  );
  return [fileInfos, calculateMD5];
}

function FileHasher() {
  const [fileInfos, calculateMD5] = calculateMD5Hook();

  return (
    <div>
       <input
        type="file"
        multiple
        onChange={(event) => calculateMD5(event.target.files)}
      />
      
      {fileInfos.map((fileInfo) => (
        <div key={fileInfo.name}>
          <p>
            Filename: {fileInfo.name} | MD5 hash: {fileInfo.hash} | Filesize:{" "}
            {fileInfo.size} bytes
          </p>
        </div>
      ))}

     
    </div>
  );
}

export default FileHasher;
