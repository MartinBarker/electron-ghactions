import React, { useState, useEffect } from 'react';
import './Project.module.css'; // Add a CSS file to style the component

function ffmpegTest() {
  console.log('Running FFmpeg command');
  window.api.send('run-ffmpeg-command', ['-help']);

  window.api.receive('ffmpeg-output', (output) => {
    console.log('output =', output);
    document.getElementById('output').innerText = output;
  });

  window.api.receive('ffmpeg-error', (error) => {
    document.getElementById('error').innerText = error;
  });
}

function Project() {
  return (
    <div className="project-container">
      <h1>Project</h1>
      <button onClick={ffmpegTest}>Run FFmpeg Help</button>
      <div id="output"></div>
      <div id="error" style={{ color: 'red' }}></div>
      <input type="file" webkitdirectory="true" multiple />
    </div>
  );
}

export default Project;
