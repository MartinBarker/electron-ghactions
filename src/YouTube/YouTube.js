import React, { useState, useEffect } from 'react';

function YouTube() {
  const [authCode, setAuthCode] = useState('');
  const [inputValue, setInputValue] = useState('');

  // Receive callback URL auth code from backend
  useEffect(() => {
    window.api.receive('YouTubeCode', (arg) => {
      console.log('YouTube.js Code Received: ', arg);
      setAuthCode(arg.code);
    });
    return () => {
      window.api.removeAllListeners('YouTubeCode');
    };
  }, []);

  const backendAuthCreateClient = async () => {
    console.log('Creating OAuth2 Client...');
    const response = await window.api.invoke('create-oauth2client');
    console.log('OAuth2 Client Created:', response);
  };

  const backendGetURL = async () => {
    console.log('Fetching Authorization URL...');
    const authUrl = await window.api.invoke('get-url');
    try {
      await window.api.invoke('open-url', authUrl);
    } catch (err) {
      console.error('Error opening URL:', err);
    }
  };

  const backendSendCodeToAuthUser = async () => {
    console.log('Authenticating User...');
    const response = await window.api.invoke('auth-user', authCode);
    console.log('Authentication Response:', response);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleManualSubmit = async () => {
    console.log('Submitting Auth Code Manually:', inputValue);
    const response = await window.api.invoke('auth-user', inputValue);
    console.log('Manual Submission Response:', response);
  };

  const backendUploadVideo = async () => {
    console.log('Initiating Video Upload...');
    const response = await window.api.invoke('upload-video');
    console.log('Upload Response:', response);
  };

  const initializeOAuthClient = async () => {
    try {
      const config = await window.api.invoke('read-client-config');
      const { clientId, clientSecret, redirectUri } = config;
      console.log('OAuth2 Client Config:', config);
    } catch (err) {
      console.error('Error Initializing OAuth2 Client:', err);
    }
  };

  const generateAuthUrl = async () => {
    console.log('Generating Auth URL...');
    try {
      const authUrl = await window.api.invoke('generate-auth-url');
      console.log('Auth URL:', authUrl);
      await window.api.invoke('open-url', authUrl);
    } catch (err) {
      console.error('Error Opening Auth URL:', err);
    }
  };

  return (
    <div>
      <h1>YouTube Integration</h1>
      <button onClick={backendAuthCreateClient}>Create OAuth2 Client</button>
      <button onClick={backendGetURL}>Get Authorization URL</button>
      <button onClick={backendSendCodeToAuthUser}>Authenticate User</button>
      <div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter YouTube Auth Code"
        />
        <button onClick={handleManualSubmit}>Submit Code</button>
      </div>
      <button onClick={backendUploadVideo}>Upload Video</button>
      <button onClick={initializeOAuthClient}>Initialize OAuth2 Client</button>
      <button onClick={generateAuthUrl}>Generate Auth URL</button>
    </div>
  );
}

export default YouTube;
