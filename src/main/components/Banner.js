import React from 'react';
import ReactDOM from 'react-dom';
import "./banner.css";

export default function Banner() {
  return(
    <div id="banner-container">
      <div id="title" className="vertical_center">
        <h1>MoneroStressTester.com</h1>
        <div>
          <img id="monero_muscle_logo" className="vertical_center" src='./components/monero_muscle_logo.gif' alt="Monero Muscle Logo"></img>
        </div>
      </div>
      <div id="nav">
      <a href="www.dot.com" class="nav_link current_nav">Home</a>
      &nbsp;|&nbsp;
      <a href="www.dot.com" class="nav_link">Backup</a>
      &nbsp;|&nbsp;
      <a href="www.dot.com" class="nav_link">Deposit</a>
      &nbsp;|&nbsp;
      <a href="www.dot.com" class="nav_link">Withdraw</a>
      &nbsp;|&nbsp;
      <a href="www.dot.com" class="nav_link">Sign Out</a>
      </div>
    </div>
  );
}
