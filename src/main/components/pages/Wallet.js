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
    this.transactionGenerationToggled = false;
  }
  
  handleButtonClick(){
    if (this.transactionGenerationToggled){
      this.transactionGenerationToggled = false;
      this.props.stopGeneratingTxs();
    } else {
      this.transactionGenerationToggled = true;
      if(this.props.balance > 0){
        this.props.startGeneratingTxs();
      }
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
      
      buttonIsActive = false;
      buttonTextElement = <>Start Generating Transactions</>
    } else {
      /*
       * The wallet is funded or has inbound funds
       * 
       * 
       */ 
      
      buttonIsActive = true;

      if(this.transactionGenerationToggled) {
	//if the "generate" button is toggled on
	if(this.props.availableBalance == 0 && this.props.numTxsGenerated == 0) {
	  /*
	   * Wallet is waiting for an incoming TX for funding
	   * 
	   * start button says "Waiting for available funds (~" + (numBlocksToNextUnlock * 2) + " minutes)"
	   */
	  if(numBlocksToNextUnlock === 0 || numBlocksToLastUnlock == undefined) {
	    // We are on the last block before funds will become available. stop displaying time estimate.
	    buttonTextElement = <>Waiting for available funds</>
	  } else {
	    buttonTextElement = <>Waiting for available funds (~{numBlocksToNextUnlock * AVERAGE_BLOCK_TIME} minutes)</>
	  }
	} else if(this.props.availableBalance > 0){
          //The wallet is funded and ready to send transactions
          
          if(this.props.isGeneratingTxs){
            /* 
	     * The wallet is in the middle of generating (or attempting to generate in the
	     * case the the inbound funds have not yet arrived) TXs
	     * 
	     * once start button is clicked, button is grey to display info except 
	     * when mouse hovers, then it turns red to indicate clickable 
	     * stop (might get design tweaks)
	     */
            if(this.state.mouseIsOnTxGenButton){
              buttonTextElement = <>Pause transaction generation</>
            } else {
              
              
              
              //The complicated part
              /*
               * if tx.getOutgoingTransfer().getDestinations().length == 1, start button says 
               * "Cycling outputs" + button time
               */
              if(this.props.isCycling){
        	buttonTextElement = <>Cycling outputs</>
              }
              /*
               * if tx.getOutgoingTransfer().getDestinations().length > 1, start button says 
               * "Split " + numSplitOutputs + " new outputs" + button time
               */
              if(this.props.isSplitting ){
        	buttonTextElement = <>Split {numSplitOutputs} new outputs (~{numBlocksToNextUnlock} minutes)</>
              }
            
            }
          } else {
            /*
             * wallet funds JUST became available and transactions have not started generating yet. 
             * 
             * Enable the TX generator
             */ 
            this.props.startGeneratingTxs();
          }
        }
	buttonTextElement = <>Missing case/not accounted for?</>
      } else {
	//The user has not pressed the button, but the wallet is (or will definitely be) funded
	// start button is enabled / green
	buttonTextElement = <>Start Generating Transactions</>
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
              handleClick = {this.handleButtonClick.bind(this)}
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

export default Wallet;