import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import { runFfmpegProcess } from './Components/Ffmpeg/Ffmpeg'; 
import './App.css';
import Frame2 from './Components/Frame2/Frame2';
import Add from './Components/Add/Add'
import FfmpegTest from './Components/FfmpegTest'

function App() {
  return (
    <>
      <Router>
        <Routes>
          
          {/* Home */}
          <Route path="/" element={
            <Frame2>
              <FfmpegTest/>
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
