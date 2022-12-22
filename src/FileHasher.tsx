import React, { useState, useEffect, useCallback } from 'react';
import SparkMD5 from 'spark-md5';

interface FileInfo {
  name: string;
  hash: string;
  size: number;
}

function FileHasher() {
  const [fileInfos, setFileInfos] = useState<FileInfo[]>([]);

  const calculateMD5 = useCallback((files: FileList) => {
  const promises: Promise<string>[] = [];
  let counter = 0;

  for (let i = 0; i < files.length; i++) {
    const fileReader = new FileReader();
    fileReader.onload = (event: ProgressEvent<FileReader>) => {
      const binaryString = event.target.result;
      const spark = new SparkMD5();
      spark.appendBinary(binaryString);
      const hash = spark.end();
      promises.push(Promise.resolve(hash));

      counter++;
      if (counter === files.length) {
        Promise.all(promises).then((hashes) => {
          setFileInfos(
            hashes.map((hash, index) => ({
              name: files[index].name,
              hash,
              size: files[index].size,
            }))
          );
        });
      }
    };
    fileReader.readAsBinaryString(files[i]);
  }
}, []);

  return (
    <div>
      {fileInfos.map((fileInfo) => (
        <div key={fileInfo.name}>
          <p>Filename: {fileInfo.name}</p>
          <p>MD5 hash: {fileInfo.hash}</p>
          <p>Filesize: {fileInfo.size} bytes</p>
        </div>
      ))}
      <input type="file" multiple onChange={(event) => calculateMD5(event.target.files)} />
    </div>
  );
}

export default FileHasher;
