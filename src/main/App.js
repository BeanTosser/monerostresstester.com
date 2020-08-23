import React from 'react';
import ReactDOM from 'react-dom';
import "./app.css";

import Banner from "./components/Banner.js";
import Home from "./components/pages/Home.js";
import Deposit from "./components/pages/Deposit.js";
import SignOut from "./components/pages/SignOut.js";
import Backup from "./components/pages/Backup.js";
import Withdraw from "./components/pages/Withdraw.js";
import Wallet from "./components/pages/Wallet.js";
import {HashRouter as Router, Route, Switch, Redirect} from 'react-router-dom';

const monerojs = require("monero-javascript");
const MoneroWalletListener = monerojs.MoneroWalletListener;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      /*
       * The mnemonic phrase (or portion thereof) that the user has typed into
       * either the "confirm" or "restore" wallet text box
       */
      enteredPhrase: "", // The mnemonic phrase (or portion thereof) that
      wallet: null,
      phraseIsConfirmed: false,
      walletSyncProgress: 0,
      restoreHeight: 0,
      //Temp! restore to true when done testing
      walletIsSynced: false
    };
  }
  
  setRestoreHeight(height){
    this.setState({
      restoreHeight: Number(height)
    });
    console.log("entered restore height: " + height)
  }
  
  setEnteredPhrase(mnemonic){
    this.setState({
      enteredPhrase: mnemonic
    });
    console.log("entered phrase: " + mnemonic);
  }

  async generateWallet(){
    let walletWasm = await monerojs.createWalletWasm({
      password: "supersecretpassword123",
      networkType: "stagenet",
      path: "",
      serverUri: "http://localhost:38081",
      serverUsername: "superuser",
      serverPassword: "abctesting123",
    });
    let newPhrase = await walletWasm.getMnemonic();
    this.setState ({
      wallet: walletWasm,
    });
  }
  
  async restoreWallet(browserHistory){
	    let walletWasm = null;
	    try {
	      walletWasm = await monerojs.createWalletWasm({
	        password: "supersecretpassword123",
	        networkType: "stagenet",
	        path: "",
	        serverUri: "http://localhost:38081",
	        serverUsername: "superuser",
	        serverPassword: "abctesting123",
	        mnemonic: this.state.enteredPhrase,
	        restoreHeight: this.state.restoreHeight
	      });
	    } catch(e) {
	      alert("Invalid mnemonic!");
	      alert("Error: " + e);
	      return;
	    }
	    this.setState ({
	      wallet: walletWasm,
	    });
	    browserHistory.push("/home/synchronize_wallet");
	    await this.synchronizeWallet();
	  }
  
  setCurrentSyncProgress(percentDone){
    this.setState({walletSyncProgress: percentDone});
    console.log("Updating sync progress: " + percentDone)
  }

  deleteWallet() {
    this.setState ({
      wallet: null,
      phraseIsConfirmed: false,
      walletSyncProgress: 0
    })
  }
  
  async confirmWallet(browserHistory) {
    console.log("Entered phrase: " + this.state.enteredPhrase);
    let walletPhrase = await this.state.wallet.getMnemonic();
    if (this.state.enteredPhrase === walletPhrase) {
      this.setState ({
        phraseIsConfirmed: true
      });
      browserHistory.push("/home/synchronize_wallet");
      await this.synchronizeWallet();
    } else {
      alert("The phrase you entered does not match the generated mnemonic! Re-enter the phrase or go back to generate a new wallet.");
    }

  }
  
  //Called when the user clicks "continue" after entering a valid new (for restore) or confirm (for create new) seed phrase.
  async synchronizeWallet() {
	console.log("Attempting to synchronize wallet");
	let result = await this.state.wallet.sync(new WalletSyncPrinter(this));  // synchronize and print progress
	console.log("\"finished\" synchronizing wallet");
	this.setState({
	  walletIsSynced: true
	})
  }


  render(){
    const homeRoute = this.state.walletIsSynced ? 
      <Route path="/home" render={async () => <Wallet
    	balance={await this.state.wallet.getBalance()}
	availableBalance={await this.state.wallet.getUnlockedBalance()}
      />} />
    :
      <Route path="/home" render={() => <Home
        generateWallet={this.generateWallet.bind(this)}
        confirmWallet={this.confirmWallet.bind(this)}
        restoreWallet={this.restoreWallet.bind(this)}
        setEnteredPhrase={this.setEnteredPhrase.bind(this)}
        deleteWallet={this.deleteWallet.bind(this)}
        walletSyncProgress = {Math.trunc(this.state.walletSyncProgress)}
        setRestoreHeight = {this.setRestoreHeight.bind(this)}
      />} />;
      
    return(
      <div id="app_container">
        <Router>
          <Banner walletIsSynced={this.state.walletIsSynced}/>
          <Switch>
            <Route exact path="/" render={() => {
              return(
                <Redirect to="/home" />
              );
            }} />
            {homeRoute}
            <Route path="/backup" render={(props) => <Backup
              {...props}
            />} />
            <Route path="/deposit" render={(props) => <Deposit
              {...props}
            />} />
            <Route path="/sign_out" render={(props) => <SignOut
              {...props}
            />} />
            <Route path="/withdraw" render={(props) => <Withdraw
              {...props}
            />} />
            <Route component={default_page} />
          </Switch>
        </Router>
      </div>
    );
  }
}

function default_page(){
  return <h1>ERROR - invalid url path!</h1>
}
            
/**
 * Print sync progress every X blocks.
 */
class WalletSyncPrinter extends MoneroWalletListener {
              
  constructor(callingComponent) { // callingComponent is "App" in this case
    super();
    this.callingComponent = callingComponent;
    this.syncResolution = 0.05;
    this.lastIncrement = 0;
    console.log("Creating wallet sync printer");
  }
              
  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
	console.log("Running onSyncProgress...");
    //let percentString = Math.floor(parseFloat(percentDone) * 100).toString() + "%";
    //$("#progressBar").width(percentString);
    this.callingComponent.setCurrentSyncProgress(percentDone*100); 
    if (percentDone >= this.lastIncrement + this.syncResolution) {
      console.log("onSyncProgress(" + height + ", " + startHeight + ", " + endHeight + ", " + percentDone  + ", " + message + ")");
      this.lastIncrement += this.syncResolution;
    }
  }
  onBalancesChanged(newBalance, newUnlockedBalance){
    
  }
}

export default App;
