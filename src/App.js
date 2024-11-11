import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import Frame2 from './Components/Frame2/Frame2';
import Add from './Components/Add/Add'
import { runFfmpegProcess } from './Components/Ffmpeg/Ffmpeg'; // Adjust the import path as necessary
import './App.css';

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

function testFfmpeg() {
  console.log('testFfmpeg()')
  const process = runFfmpegProcess("ffmpegArgs");
  console.log('testFfmpeg() process = ', process)
}

function App() {
  return (
    <>
      <Router>
        <Routes>
          
          {/* Home */}
          <Route path="/" element={
            <Frame2>
              <div id='tempPageContent'>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </div>
            </Frame2>
          } />

          {/* Create New Project */}
          <Route path="/add" element={<Frame2> <Add/> </Frame2>} />

        </Routes>
      </Router>
    </>
  );
}

export default App;
