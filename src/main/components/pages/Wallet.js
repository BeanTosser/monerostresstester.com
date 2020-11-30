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

/*
 * PROPS FOR DETERMINING STATUS MESSAGE
 * 
 * balance
 * availableBalance
 * numBlocksToNextUnlock
 * numBlocksToLastUnlock
 * isCycling
 * isSplit
 */

class Wallet extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      mouseIsOnTxGenButton: false
    }
  }
  
  /*
   * PROPS:
   *   balance
   *   available_balance
   *   transactions
   *   fees
   *   isGeneratingTxs
   *   startGeneratingTxs
   *   stopGeneratingTxs
   */
  
  render() {
  
    // Typical time to add a new block to the chain (in minutes)
    let AVERAGE_BLOCK_TIME = 2;
    
    let buttonHandleContinue = null;
    let buttonTextElement = null;
    let buttonIsActive = false;
    
    
    // planning if/then structure for status message
    if(this.props.balance == 0){
      /*
       * The wallet is unfunded and has no inbound funds
       * 
       * start button says "Start Generating Transactions" but is disabled
       *  notification bar to deposit funds is displayed
       */
      
      //If the wallet just ran out of funds, 
    } else {
      /*
       * The wallet is funded or has inbound funds
       * 
       * 
       */ 
      if(this.props.isGeneratingTxs){
	/*
	 * The wallet is i the middle of generating (or attempting to generate in the
	 * case the the inbound funds have not yet arrived) TXs
	 * 
	 * once start button is clicked, button is grey to display info except 
	 * when mouse hovers, then it turns red to indicate clickable 
	 * stop (might get design tweaks)
	 */
	if(this.props.availableBalance == 0 && numTxsGenerated == 0) {
	  /*
	   * Wallet is waiting for an incoming TX for funding
	   * 
	   * start button says "Waiting for available funds (~" + (numBlocksToNextUnlock * 2) + " minutes)"
	   */
	} else if()
      } else {
	// start button is enabled / green
      }
    }
    
    
    
    if(this.props.balance > 0){
      
      buttonIsActive = true;
      if(this.props.isGeneratingTxs){
        if(this.state.mouseIsOnTxGenButton){
          buttonTextElement = <>Pause transaction generation</>;
          buttonHandleContinue = this.props.stopGeneratingTxs;
        } else {
  	if(this.props.isCycling){
  	  if(numBlocksToNextUnlock > 0){
  	    buttonTextElement = <>Cycling (~{AVERAGE_BLOCK_TIME * this.props.numBlocksToNextUnlock} minutes)</>
  	  } else {
  	    buttonTextElement = <>Cycling</>
  	  }
  	} else if (this.props.splitOutputs){
  	  if(numBlocksToNextUnlock > 0){
  	    buttonTextElement = <>Split outputs (~{AVERAGE_BLOCK_TIME * this.props.numBlocksToNextUnlock} minutes)</>
  	  } else {
  	    buttonTextElement = <>Split outputs</>
  	  }
  	}
        }
      } else {
        buttonTextElement = <>Start Generating Transactions</>;
        buttonHandleContinue = this.props.startGeneratingTxs;
      }
      
    } else {
      if(this.props.fundsArePending){
        
        
        
        
        
        
      } else {
        buttonTextElement= <>Start Generating Transactions</>
        buttonIsActive=false;
      }
    }
    
    return(
      <Page_Box className="wallet_page_box">
        <div className="wallet_page_sections_container">
          <Wallet_Page_Section label = "Balance" value={this.props.balance * XMR_AU_RATIO + " XMR"} />
          <Wallet_Page_Section label = "Available balance" value={this.props.availableBalance * XMR_AU_RATIO + " XMR"} />
          <Wallet_Page_Section label = "Transactions generated" value={this.props.transactionsGenerated} />
          <Wallet_Page_Section label = "Total fees" value={this.props.totalFees * XMR_AU_RATIO + " XMR"} />
          <div className="wallet_page_button_container">
            <Home_UI_Button_Link 
              handleClick = {buttonHandleContinue}
              destination="/" 
              isactive={buttonIsActive}
              className={this.props.isGeneratingTxs ? "stop_tx_generation_color" : ""} 
              onmouseover={(function() {this.setState({mouseIsOnTxGenButton: true})}).bind(this)}
              onmouseout={(function() {this.setState({mouseIsOnTxGenButton: false})}).bind(this)}
            >
              {buttonTextElement}
            </Home_UI_Button_Link>
          </div>
        </div>
      </Page_Box>
    );
  }
}

function Wallet_Page_Section(props) {
  return(
    <div className="wallet_page_section">
      <div className="wallet_page_section_label wallet_page_text">
        {this.props.label}
      </div>
      <div className="wallet_page_section_value wallet_page_text">
        {this.props.value}
      </div>
      <div className="horizontal_rule">
        <hr />
      </div>
    </div>
  );
}