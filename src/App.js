import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import Frame from './Frame/Frame';
import Project from './Project/Project';

function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={ <Frame> <Project/> </Frame> } />
      </Routes>
    </Router>
    </>
  );
}

export default App;
