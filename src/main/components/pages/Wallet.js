import React from 'react';
import {Page_Box} from "../Widgets.js";
import "./wallet.css";
import {Home_UI_Button_Link} from "../Buttons.js";

const XMR_AU_RATIO = 0.000000000001;

/*
 * TX Button Messages
 * 
 * 1. Start Generating Transactions
 * 2. Waiting for available funds (available in ~20 minutes)
 * 3. Split ### new outputs (available in ~## minutes)
 * 4. Cycling outputs (available in ~# minutes)
 * 6. Cycling outputs
 * 7. Pause transaction generation
 * 
 * 
 */

export default function Wallet(props){
  /*
   * PROPS:
   *   balance
   *   available_balance
   *   transactions
   *   fees
   *   isGeneratingTxs
   *   walletIsFunded
   *   startGeneratingTxs
   *   stopGeneratingTxs
   */
  
  // Typical time to add a new block to the chain
  let AVERAGE_BLOCK_TIME = 2;
  
  let buttonHandleContinue = null;
  let buttonTextElement = null;
  let buttonIsActive = false;
  
  if(props.walletIsFunded){
    buttonIsActive = true;
    if(props.isGeneratingTxs){
      buttonTextElement = <>Stop generating transactions</>;
      buttonHandleContinue = props.stopGeneratingTxs;
    } else {
      buttonTextElement = <>Start generating transactions</>;
      buttonHandleContinue = props.startGeneratingTxs;
    }
    
  } else {
    buttonTextElement= <>Fund wallet before generating transactions</>
    buttonIsActive=false;
  }
  
  return(
    <Page_Box className="wallet_page_box">
      <div className="wallet_page_sections_container">
        <Wallet_Page_Section label = "Balance" value={props.balance * XMR_AU_RATIO + " XMR"} />
        <Wallet_Page_Section label = "Available balance" value={props.availableBalance * XMR_AU_RATIO + " XMR"} />
        <Wallet_Page_Section label = "Transactions generated" value={props.transactionsGenerated} />
        <Wallet_Page_Section label = "Total fees" value={props.totalFees * XMR_AU_RATIO + " XMR"} />
        <div className="wallet_page_button_container">
          <Home_UI_Button_Link 
            handleClick = {buttonHandleContinue}
            destination="/" 
            isactive={buttonIsActive}
            className={props.isGeneratingTxs ? "stop_tx_generation_color" : ""} 
          >
            {buttonTextElement}
          </Home_UI_Button_Link>
        </div>
      </div>
    </Page_Box>
  );
}

function Wallet_Page_Section(props) {
  return(
    <div className="wallet_page_section">
      <div className="wallet_page_section_label wallet_page_text">
        {props.label}
      </div>
      <div className="wallet_page_section_value wallet_page_text">
        {props.value}
      </div>
      <div className="horizontal_rule">
        <hr />
      </div>
    </div>
  );
}