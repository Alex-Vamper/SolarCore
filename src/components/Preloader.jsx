import React from 'react';
import './Preloader.css'; // Custom animation styles

export default function Preloader() {
  return (
    <div className="preloader-container">
      <div className="sun-wrapper">
        <div className="sun-halo"></div>
        <div className="sun"></div>
      </div>
      <h1 className="welcome-text">Welcome to Solar Core</h1>
      <p className="loading-text">Loading<span className="dots">...</span></p>
    </div>
  );
}
