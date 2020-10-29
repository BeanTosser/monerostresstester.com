import React from 'react';
import ReactDOM from 'react-dom';

import "./deposit.css";

import {Page_Box} from "../Widgets.js";

export default function Deposit(props){
  return(
    <Page_Box className="deposit_page_box">
      <div className="title"><h1>Deposit</h1></div>
      <div className="code_image">{props.depositQrCode}</div>
      <div className="code_text">{props.walletAddress}</div>
    </Page_Box>
  );
}
