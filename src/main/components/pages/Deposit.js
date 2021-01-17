// React
import React from 'react';
import ReactDOM from 'react-dom';

// CSS
import "./deposit.css";

// Components
import {Page_Box, Header, Deposit_Address_Text_Box} from "../Widgets.js";
import {Router_UI_Button_Link} from "../Buttons.js";

// Images
import checkmark from "../../img/checkmark.png";

export default function Deposit(props){
  let statusElement = null;
  let button = null;
  
  if(!props.xmrWasDeposited){
    
    statusElement = 
      <div className = "status_area">
        <div className = "status_message">
          Waiting for deposit...
        </div>
      </div>
    button = <div className="empty_return_home_button_area"></div>
    
  } else {
    
    // Checkmark image cred: Image by <a href="https://pixabay.com/users/janjf93-3084263/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=1976099">janjf93</a> from <a href="https://pixabay.com/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=1976099">Pixabay</a>
    statusElement = 
      <div className = "status_area">
        <img 
          src = {checkmark} 
          alt = "Checkmark" 
          className = "checkmark" 
        />  
        <div className = "status_message">Deposit Received!</div>
      </div>
      
    button = <Router_UI_Button_Link
      className = "return_home_from_deposit_button"
      destination = "/"
      setCurrentHomePage = {props.setCurrentHomePage}
    >
      Return to Home
    </Router_UI_Button_Link>    
  }
  
  return(
    <Page_Box className="deposit_page_box">
      <Header 
        text = "Deposit" 
        omit_bottom_margin = {true}
      />
      <div className="code_image"> {props.depositQrCode} </div>
      <Deposit_Address_Text_Box box_text = {props.walletAddress} />
      {statusElement}
      {button}
    </Page_Box>
  );
}
