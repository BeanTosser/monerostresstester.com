import React from 'react';
import ReactDOM from 'react-dom';

import {Page_Box} from "../Widgets.js";

export default function Deposit(props){
  return(
    <Page_Box className="deposit_page_box">
      <h1>Deposit</h1>
      <div>{props.depositQrCode}</div>
      <div>{props.walletAddress}</div>
    </Page_Box>
  );
}
