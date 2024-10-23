import React, { useState, useEffect } from 'react';
import Frame from './Frame/Frame';
import { runFfmpegProcess } from './Ffmpeg'; // Adjust the import path as necessary

/*
async function runSimpleFfmpegCommand() {
  const ffmpegArgs = ['-v', 'info'];
  const process = runFfmpegProcess(ffmpegArgs);

  process.stdout?.on('data', (data) => {
    console.log(`Progress: ${data}`);
  });

  process.stderr?.on('data', (data) => {
    console.error(`Error: ${data}`);
  });

  try {
    await process;
    console.log('FFmpeg command completed successfully.');
  } catch (error) {
    console.error('FFmpeg command failed:', error);
  }
}
*/

function testFfmpeg(){
  console.log('testFfmpeg()')
  const process = runFfmpegProcess("ffmpegArgs");
  console.log('testFfmpeg() process = ', process)
}

function App() {



  return (
    <>
      <Frame />
      <div style={{ marginTop: "40px", marginLeft: '55px' }}>
        <h1>App.js here is the first line</h1><br></br>

        <button onClick={testFfmpeg}>Click to test ffmpeg</button>

        <h1>App.js here is the last line</h1><br></br>
      </div>
    </>
  );
}

export default App;
