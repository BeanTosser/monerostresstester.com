import React from 'react';
import ReactDOM from 'react-dom';
import './save_phrase_page.css';
import {Page_Box, Page_Box_Margin, Page_Text_Box, Main_Content, Header, Loading_Animation} from '../Widgets.js';
import {UI_Text_Link, UI_Button_Link} from '../Buttons.js';
import warningImage from '../../img/warning.png'
export default function Save_Phrase_Page(props) {
  
  let mainContent = null;
  let marginContent = undefined;
  let buttonLinks = undefined;
  
  if (props.text) {
    mainContent = (
      <Main_Content>
        <Page_Text_Box box_text={props.text} />
      </Main_Content>
    );
  } else {
    mainContent = (
      <Main_Content>
        <div className="page_text_box_space">
          <Loading_Animation />
        </div>
      </Main_Content>
    );
  }
  
  if(!props.omit_buttons){ // The new wallet and backup pages are nearly identical EXCEPT backup lacks buttons
    marginContent = (
      <div>
        <div className = "sub_title" style = {{display: "flex", flexDirection: "row"}}>
          <span>
          <img 
            src = {warningImage}
            alt = "Caution sign"
          />
          </span>
          <span>
            Do not lose your backup phrase
          </span>
        </div>
        <Page_Box_Margin />
        <Regenerate_Phrase_Button handleClick={props.handleRegenerate}/>
      </div>
    );
    buttonLinks = (
      <div className="home_button_links">
        <UI_Button_Link
          destination={props.continueDestination} 
          setCurrentHomePage = {props.setCurrentHomePage}
          isActive = {props.text ? true : false}
        >
          <>
            Continue
          </>
        </UI_Button_Link>
        <UI_Text_Link 
          link_text="Or Go Back" 
          destination={props.backDestination} 
          handleClick={props.handleBack} 
          setCurrentHomePage = {props.setCurrentHomePage}/>
      </div>
    );
  } else {
    marginContent = (
      <div className = "sub_title">
        Do not lose your backup phrase
      </div>
    );
  }
  
  return(
    <Page_Box className = "page_box_flex">
      <Header 
        text="Save your backup phrase" 
        margin_content = {marginContent}
      />
      {mainContent}
      <div className="save_phrase_box_bottom_margin"></div>
      {buttonLinks}
    </Page_Box>
  );
}

//Component for the unique "Regenerate" button in the wallet generation sub-page
function Regenerate_Phrase_Button(props) {
  return(
      <a className="regenerate_button" onClick={props.handleClick}>Regenerate</a>
  );
}