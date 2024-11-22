import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import Frame from './Frame/Frame';
import FfmpegTest from './FfmpegTest/FfmpegTest'
import { runFfmpegProcess } from './Ffmpeg'; 

function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={ <Frame> <FfmpegTest/> </Frame> } />
      </Routes>
    </Router>
    </>
  );
}

export default App;
