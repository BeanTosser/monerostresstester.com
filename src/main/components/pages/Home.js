import React from 'react';
import ReactDOM from 'react-dom';
import './home.css';
import {Route, Switch, Link, useRouteMatch} from "react-router-dom";
import {UI_Button_Link, UI_Text_Link, Regenerate_Phrase_Button} from '../Buttons.js';
import {Page_Box, Page_Text_Box, Page_Text_Entry, Header, Progress_Bar, Main_Content} from '../Widgets.js';

const DEFAULT_BACKUP_PHRASE_STRING = "Enter backup phrase";

export default function Home(props){
  let {path, url} = useRouteMatch();
  let generateWallet = props.generateWallet;
  let deleteWallet = props.deleteWallet;
  let walletPhrase = props.walletPhrase;
  let confirmWallet = props.confirmWallet;
  let walletSyncProgress = props.walletSyncProgress;
  let setEnteredPhrase = props.setEnteredPhrase;
  let restoreWallet = props.restoreWallet;
  let setRestoreHeight = props.setRestoreHeight;
  return (
    <div id="home">
      <Switch>
        <Route exact path={path} render={(props) => <Welcome
          {...props}
          handleContinue={generateWallet}
        />} />
        <Route path={`${path}/new_wallet`} render={(props) => <New_Wallet 
          {...props}
          text={walletPhrase}
          handleRegenerate={generateWallet}
          handleBack={deleteWallet}
        />} />
        <Route path={`${path}/import_wallet`} render={(props) => <Enter_Phrase_Page
          {...props}
          header="Import existing wallet" 
          back_destination='/home' 
          handleTextChange={setEnteredPhrase} 
          handleContinue={() => restoreWallet(props.history)}
        >
          <Page_Text_Entry 
            isDefault={true} 
            className="enter_restore_height_box"
      	    value="Enter restore height or date (YYYY/MM/DD)" 
      	    handleTextChange={setRestoreHeight}
          />
        </Enter_Phrase_Page> } />
        <Route path={`${path}/confirm_phrase`} render={(props) => <Enter_Phrase_Page
          {...props} 
          header="Confirm your backup phrase" 
          back_destination='/home/new_wallet' 
          handleTextChange={setEnteredPhrase} 
          handleContinue={() => confirmWallet(props.history)}
        /> } />
        <Route path={`${path}/synchronize_wallet`} render={(props) => <Sync_Wallet_Page
          {...props}
          progress={walletSyncProgress}
        /> } />
      </Switch>
    </div>
  );
}

// The initial home page
function Welcome(props) {
  return (
    <Page_Box className = "home_subpage_box">
      <div className="title"> Welcome to <b>MoneroStressTester.com</b></div>
      <div className="sub_title">Open-source, client-side transaction generator</div>
      <div className="home_button_links">
      	<UI_Button_Link link_text="Create New Wallet" destination={`${props.match.url}/new_wallet`} handleClick={props.handleContinue}/>
      	<UI_Text_Link link_text="Or Import Existing Wallet" destination={`${props.match.url}/import_wallet`} />
      </div>
    </Page_Box>
  );
}

/*
 * Home sub-pages
 */
function New_Wallet(props) {
  return(
    <Page_Box className = "home_subpage_box">
      <Header text="Save your backup phrase" margin_content=<Regenerate_Phrase_Button handleClick={props.handleRegenerate}/>/>
      <Main_Content>
      	<Page_Text_Box box_text={props.text} />
      </Main_Content>
      <div className="save_phrase_box_bottom_margin"></div>
      <div className="home_button_links">
        <UI_Button_Link link_text="Continue" destination={`confirm_phrase`} />
        <UI_Text_Link link_text="Or Go Back" destination='/home' handleClick={props.handleBack}/>
      </div>
    </Page_Box>
  );
}

function Sync_Wallet_Page(props) {
  return (
    <Page_Box className="home_subpage_box">
      <Header text="Synchronizing Wallet" />
      <Main_Content>
        <Progress_Bar progress={props.progress}/>
      </Main_Content>
      <div className="home_button_links">
        <UI_Text_Link link_text="Go Back"
          handleClick={() => {
            props.history.goBack();
          }}
          destination=''
        />
      </div>
    </Page_Box>
  );
}

function Enter_Phrase_Page(props) {
  //Save your backup phrase
  return(
    <Page_Box className="home_subpage_box">
      <Header text={props.header}/>
      <Main_Content>
      	<Page_Text_Entry 
      	  isDefault={true} 
      	  className="enter_phrase_box "
	  value="Enter backup phrase..." 
	  handleTextChange={props.handleTextChange}
	/>
	{props.children}
      </Main_Content>
      <div className="save_phrase_box_bottom_margin"></div>
      <div className="home_button_links">
      	<UI_Button_Link link_text="Continue" destination={"/home/synchronize_wallet"} handleClick={props.handleContinue}/>
      	<UI_Text_Link link_text="Or Go Back" destination={props.back_destination} handleClick={props.handleBack} />
      </div>
    </Page_Box>
  );
}

/*
function Confirm_Phrase() {
  return (

  );
}

function Backup_Phrase() {
  return (

  );
}

function Synchronize_Wallet() {
  return (

  );
}

function Generate_Transactions() {
  return (

  );
}
*/
