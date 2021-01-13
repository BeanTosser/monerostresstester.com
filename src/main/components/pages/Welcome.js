import React from 'react';
import ReactDOM from 'react-dom';
import './home.css';
import {Page_Box, Loading_Animation} from '../Widgets.js';
import {UI_Text_Link, UI_Button_Link} from '../Buttons.js';

const USE_TEST_BUTTON = false;

// The initial home page
export default function Welcome(props) {
  let button = null;
  if(USE_TEST_BUTTON){
    button = <div className="double_button_contents_container">
    <span className="double_button_item_1">Verifying...</span>
    <span className="double_button_item_2"><Loading_Animation /></span>
  </div>
  } else {
    button = "Create New Wallet"
  }
  
  return (
    <Page_Box className = "home_subpage_box_flex">
      <div className="title"> Welcome to <b>MoneroStressTester.com</b></div>
      <div className="sub_title">Open-source, client-side transaction generator</div>
      <div className="home_button_links">
      	<UI_Button_Link
      	  destination={props.continueDestination} 
      	  handleClick={props.handleContinue}
      	  setCurrentHomePage={props.setCurrentHomePage}
      	>
      	  {button}
      	</UI_Button_Link>
      	<UI_Text_Link 
      	  link_text="Or Import Existing Wallet"
      	  destination={props.backDestination}
      	  handleClick={props.handleBack}
      	  setCurrentHomePage={props.setCurrentHomePage}
      	/>
      </div>
    </Page_Box>
  );
}