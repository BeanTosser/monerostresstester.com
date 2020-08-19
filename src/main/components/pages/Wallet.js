import React from 'react';
import {Page_Box} from "../Widgets.js";
import "./wallet.css";
export default function Wallet(props){
  return(
    <Page_Box>
       <Wallet_Page_Section />
    </Page_Box>
  );
}

function Wallet_Page_Section(props){
  return(
    <div className="wallet_page_sections_container">
      <div className="wallet_page_section">
        <div className="wallet_page_section_text">
          <div className="wallet_page_section_label">
            Test Label
          </div>
          <div className="wallet_page_section_value">
            Test Value
          </div>
        </div>
      </div>
      <hr />
    </div>
  );
}