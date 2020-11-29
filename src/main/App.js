import React from 'react';
import ReactDOM from 'react-dom';
import "./app.css";

import Banner from "./components/Banner.js";
import Home from "./components/pages/Home.js";
import Deposit from "./components/pages/Deposit.js";
import SignOut from "./components/pages/SignOut.js";
import Backup from "./components/pages/Backup.js";
import Withdraw from "./components/pages/Withdraw.js";
import {Loading_Animation, getLoadingAnimationFile} from "./components/Widgets.js";

import QR_Code from "./components/QR_Code.js";
import qrcode from './qrcode.js';

import {HashRouter as Router, Route, Switch, Redirect} from 'react-router-dom';
import MoneroTxGenerator from './MoneroTxGenerator.js';
import MoneroTxGeneratorListener from './MoneroTxGeneratorListener.js';

import flexingLogo from './img/muscleFlex.gif';
import relaxingLogo from './img/muscleRelax.gif';

const DEBUG = true;

const monerojs = require("monero-javascript");
const LibraryUtils = monerojs.LibraryUtils;
const MoneroWalletListener = monerojs.MoneroWalletListener;
const MoneroWallet = monerojs.MoneroWallet;
const MoneroRpcConnection = monerojs.MoneroRpcConnection;

/* 
 * A wallet must contain at least this many atomic units to be considered "funded" 
 * and thus allowed to generate transactions
 */
const FUNDED_WALLET_MINIMUM_BALANCE = 0.0000001;

/*
 * WALLET_INFO is a the basic configuration object ot pass to the walletKeys.createWallet() method
 * in order to create a new, random keys-only wallet
 * It is also used as the base to create configuration objects for the WASM wallets that will follow
 * by copying then adding an empty path ("") property and, in the case of a generated wallet,
 * the mnemonic from the generated keys-only wallet.
 */
const WALLET_INFO = {
    password: "supersecretpassword123",
    networkType: "stagenet",
    serverUri: "http://localhost:38081",
    serverUsername: "superuser",
    serverPassword: "abctesting123"
}

class App extends React.Component {
  constructor(props) {
    super(props);
    
    // Force the loading animation to preload
    const img = new Image();
    img.src = getLoadingAnimationFile();
    
    
    // print current version of monero-javascript
    
    /*
     * Member Variables
     * No need to store these in state since no components need to re-render when their values are set
     */
    this.txGenerator = null;
    this.walletAddress = "empty";
    
    // In order to pass "this" into the nested functions...
    let that = this;
    
    //Start loading the Keys-only and Wasm wallet modules
    
    //First, load the keys-only wallet module  
    LibraryUtils.loadKeysModule().then(
      function() {
	that.setState({
	  keysModuleLoaded: true
	});

	// Load the core (Wasm wallet) module
	LibraryUtils.loadCoreModule().then(
	  function() {
	    that.setState({
	      coreModuleLoaded: true
	    })
	  }
	).catch(
	  function(error) {
	    console.log("Failed to load core wallet module!");
	    console.log("Error: " + error);
	  } 
	);
      }
    ).catch(
      function(error) {
	console.log("Failed to load keys-only wallet module!");
	console.log("Error: " + error);
      } 
    );
    
    this.state = {
      /*
       * The mnemonic phrase (or portion thereof) that the user has typed into
       * either the "confirm" or "restore" wallet text box
       */
      enteredPhrase: "",
      wallet: null,
      walletPhrase: "",
      phraseIsConfirmed: false,
      walletSyncProgress: 0,
      restoreHeight: 0,
      walletIsSynced: false,
      balance: 0,
      availableBalance: 0,
      currentHomePage: "Welcome",
      lastHomePage: "",
      isGeneratingTxs: false,
      walletIsFunded: false,
      transactionsGenerated: 0,
      totalFees: 0,
      enteredMnemonicIsValid: true,
      enteredHeightIsValid: true,
      animationIsLoaded: false,
      isAwaitingWalletVerification: false,
      flexLogo: relaxingLogo,
      depositQrCode: null,
      isAwaitingDeposit: false,
      blocksToNextUnlock: -1
    };
  }
  
  createDateConversionWallet(){
    // Create a disposable,random wallet to prepare for the possibility that the user will attempt to restore from a date
    // At present, getRestoreHeightFromDate() is (erroneously) an instance method; thus, a wallet instance is
    // required to use it.
    
    this.dateRestoreWalletPromise = monerojs.createWalletWasm({
      password: "supersecretpassword123",
      networkType: "stagenet",
      path: "",
      serverUri: "http://localhost:38081",
      serverUsername: "superuser",
      serverPassword: "abctesting123",
    });

  }
  
  createTxGenerator(wallet) {
    
    // create daemon with connection
    let daemonConnection = new MoneroRpcConnection(WALLET_INFO.serverUri, WALLET_INFO.serverUsername, WALLET_INFO.serverPassword);
    let daemon = monerojs.connectToDaemonRpc({
      server: daemonConnection,
      proxyToWorker: true
    });
    
    // create tx generator
    this.txGenerator = new MoneroTxGenerator(daemon, wallet);
  }
  
  setBalances(balance, availableBalance){
    this.setState({
      balance: balance,
      availableBalance: availableBalance
    });
  }
  
  convertStringToRestoreDate(str){
    // Make sure the string is of the format "####/##/##"
    // Does the date have the correct number of characters? (10):
    if(str.length === 10){
      //Attempt to divide the string into its constituent parts
      var dateParts = str.split("-");
      // If the result yields three strings
      if (dateParts.length === 3){
	// Attempt to convert each string to an integer
	for (let i = 0; i < 3; i++){
	  try {
	    let n = Number(dateParts[i]);
	    if (n === NaN) throw "Invalid date";
	    // If the conversion worked, replace the string in the array with the number
	    dateParts[i] = n;
	  } catch(e){
	    throw "Invalid date: " + e;
	  }
	}
	return dateParts;
      } else throw "Invalid date; date should contain three numbers separated by two slashes";
    }
    throw "Invalid date; date should be 10 chars long";
  }
  
  setRestoreHeight(height){
    this.setState({
      restoreHeight: height,
      enteredHeightIsValid: true
    });
  }
  
  async restoreWallet(){
    
    this.setState({
      isAwaitingWalletVerification: true
    });
    
    let alertMessage = "";  
    
    // First, determine whether the user has typed a height, a date, or something else(invalid)
    let height=Number(this.state.restoreHeight);
    // If the string is NOT a valid integer, check to see if it is a date and convert accordingly:
    if(!(height != NaN && height%1 === 0 && height >= 0)) {
      // Attempt to convert the string to a date in the format "YYYY-MM-DD"
      try {
        var dateParts = this.convertStringToRestoreDate(this.state.restoreHeight);
    
       // Attempt to convert date into a monero blockchain height:
       let dateRestoreHeightWallet = await this.dateRestoreWalletPromise;
        height = await dateRestoreHeightWallet.getHeightByDate(dateParts[0], dateParts[1], dateParts[2]);
        console.log("Converted the date " + dateParts[0] + "-" + dateParts[1] + "-" + dateParts[2] + " to the height " + height)
      } catch(e) {
        alertMessage = e;
      }
    }
    
    // If no errors were thrown, "height" is a valid restore height.
    if (alertMessage !== "") {
      //If height was invalid:
      console.log(alertMessage);
      this.setState({
	enteredHeightIsValid: false,
        isAwaitingWalletVerification: false
      });
      return;
    }
    
    let walletWasm = null;
    try {
      let wasmWalletInfo = Object.assign({}, WALLET_INFO);
      wasmWalletInfo.path = "";
      wasmWalletInfo.mnemonic = this.delimitEnteredWalletPhrase();
      wasmWalletInfo.restoreHeight = height;
      walletWasm = await monerojs.createWalletWasm(wasmWalletInfo);
    } catch(e) {
      console.log("Error: " + e);
      this.setState({
	enteredMnemonicIsValid: false,
	isAwaitingWalletVerification: false
      });
      return;
    }
    
    if(this.userCancelledWalletImport){
      return;
    }
    // Both the mnemonic and restore height were valid; thus, we can remove the disposable date-conversion
    // Wallet from memory
    this.dateRestoreWasmWallet = null;
    this.setState({
      isAwaitingWalletVerification: false
    });
    
    this.setState({
      currentHomePage: "Sync_Wallet_Page",
      lastHomePage: "Import_Wallet",
      wallet: walletWasm
    });
    
    // Create a wallet listener to keep app.js updated on the wallet's balance etc.
    this.walletUpdater = new walletListener(this);
    let that=this;
    walletWasm.sync(this.walletUpdater).then(async () => {
      
      if(!that.userCancelledWalletSync && !that.userCancelledWalletImport){
        // This code should only run if wallet.sync finished because the wallet finished syncing
        // And not because the user cancelled the sync
        that.walletUpdater.setWalletIsSynchronized(true);
        await that._initMain();
        let balance = await walletWasm.getBalance();
        let availableBalance = await walletWasm.getUnlockedBalance();
        let walletIsFunded = availableBalance >= FUNDED_WALLET_MINIMUM_BALANCE;
        that.setState({
          walletIsSynced: true,
          balance: balance,
          availableBalance: availableBalance,
          currentHomePage: "Wallet",
          walletIsFunded: walletIsFunded
        });
        qrcode.toDataURL(that.walletAddress, function(err, url){
            let code = <QR_Code url={url} />;
            that.setState({
              depositQrCode: code
            });
          }
        );

      } else {
        // Reset the wallet sync cancellation indicator variable so that any completed
        // syncs in the future are not misinterpretted as cancelled syncs by default
        that.userCancelledWalletSync = false;
        that.userCancelledWalletImport = false;
      }
    });
    

  }

setCurrentSyncProgress(percentDone){
  this.setState({walletSyncProgress: percentDone});
}
  
setEnteredPhrase(mnemonic){
  this.setState({
    enteredPhrase: mnemonic,
    enteredMnemonicIsValid: true
  });
}

async startGeneratingTxs(){
  await this.txGenerator.start();
  this.setState({
    isGeneratingTxs: true
  })
}

async stopGeneratingTxs(){
  this.txGenerator.stop();
  this.setState({
    isGeneratingTxs: false
  })
}

async generateWallet(){
  
  let walletKeys = null
  try {
    walletKeys = await monerojs.createWalletKeys(WALLET_INFO);
  } catch(error) {
    console.log("failed to create keys-only wallet with error: " + error);
    return;
  }
  let newPhrase = await walletKeys.getMnemonic();
  
  this.setState({
    walletPhrase: newPhrase
  });
  let wasmWalletInfo = Object.assign({}, WALLET_INFO);
  wasmWalletInfo.mnemonic = newPhrase;
  wasmWalletInfo.path = "";
  
  // set restore height to daemon's current height
  let daemonConnection = new MoneroRpcConnection(WALLET_INFO.serverUri, WALLET_INFO.serverUsername, WALLET_INFO.serverPassword);    // TODO: factor out common daemon reference so this code is not duplicated
  let daemon = monerojs.connectToDaemonRpc({
    server: daemonConnection,
    proxyToWorker: true
  });
  wasmWalletInfo.restoreHeight = await daemon.getHeight();
  
  // create wallet promise which syncs when resolved
  let walletPromise = monerojs.createWalletWasm(wasmWalletInfo);
  walletPromise.then(async function(wallet) {
    await wallet.sync();
  })
  
  this.setState({
    wallet: walletPromise  // store promise for later resolution
  });
}

  /**
   * Common helper to initialize the main page after the wallet is created and synced.
   *
   * Creates the tx generator, listens for event notifications, and starts background synchronization.
   */
  async _initMain() {
    
    // resolve wallet promise
    // TODO (woodser): create new wallet button needs greyed while this loads
    let wallet = await this.state.wallet;
    
    // Keep track of the wallet's address
    this.walletAddress = await wallet.getAddress(0,0);
    
    // If the user hit "Or go back" before the wallet finished building, abandon wallet creation
    // and do NOT proceed to wallet page
    if (this.userCancelledWalletConfirmation) return;
        
    // create transaction generator
    this.createTxGenerator(wallet);
            
    // register listener to handle notifications from tx generator
    let that = this;
    await this.txGenerator.addListener(new class extends MoneroTxGeneratorListener {
      
      // handle transaction notifications
      async onTransaction(tx, balance, unlockedBalance, numTxsGenerated, totalFees, numSplitOutputs, numBlocksToNextUnlock, numBlocksToLastUnlock) {
        console.log("MoneroTxGeneratorListener.onTransaction(" + balance.toString() + ", " + unlockedBalance.toString() + ")");
        console.log("Tx has " + tx.getOutgoingTransfer().getDestinations().length + " outputs");
        console.log("MoneroTxGenerator numSplitOutputs: " + numSplitOutputs);
        console.log("MoneroTxGenerator getNumBlocksToNextUnlock: " + numBlocksToNextUnlock);
        console.log("MoneroTxGenerator getNumBlocksToLastUnlock: " + numBlocksToLastUnlock);
        
        let isCycling = false;
        let splitOutputs = false;
        
        if (tx.getOutgoingTransfer().getDestinations().length == 1) {
          isCycling = true;
        } else if (tx.getOutgoingTransfer().getDestinations().length > 1) {
          splitOutputs = true;
        }
        
        that.setState({
          transactionsGenerated: numTxsGenerated,
          balance: balance,
          availableBalance: unlockedBalance,
          totalFees: totalFees,
          blocksToNextUnlock: numBlocksToNextUnlock,
          isCycling: isCycling,
          splitOutputs: splitOutputs
        });
        that.playMuscleAnimation.bind(that)();
      }
      
      // handle notifications of blocks added to the chain
      async onNewBlock(height, balance, unlockedBalance, numBlocksToNextUnlock, numBlocksToLastUnlock) {
        console.log("MoneroTxGeneratorListener.onNewBlock({height: " + height + ", balance: " + balance.toString() + ", unlockedBalance: " + unlockedBalance.toString() + ", numBlocksToNextUnlock: " + numBlocksToNextUnlock + ", numBlocksToLastUnlock: " + numBlocksToLastUnlock + "}");
      }
    });
    
    // register listener to handle balance notifications
    // TODO: register once wherever is appropriate, but need to update state with updated balances from wallet listener
    await wallet.addListener(new class extends MoneroWalletListener {
      async onBalancesChanged(newBalance, newUnlockedBalance) {
        console.log("MoneroWalletListener.onBalancesChanged(" + newBalance.toString() + ", " + newUnlockedBalance.toString() + ")");
        
        // Define an object whos contents vary depending on whether or not the wallet just received sufficient funds
        // This prevents having to call setstate twice consecutively if that is the case
        let stateObject = {
          balance: newBalance,
          availableBalance: newUnlockedBalance
        };
        if (!that.state.walletIsFunded && newBalance >= FUNDED_WALLET_MINIMUM_BALANCE){
          Object.assign(stateObject, {walletIsFunded: true}) 
        }
        that.setState(stateObject);
      }
      
      async onOutputReceived(output){
	if(!output.isConfirmed){
	  that.setState({
	    isAwaitingDeposit: false
	  })
	}
      };
    });
    
    // start syncing wallet in background if the user has not cancelled wallet creation
    console.log("Wallet mnemonic: " + await wallet.getMnemonic());
    console.log("Wallet address: " + await wallet.getPrimaryAddress());
    await wallet.startSyncing();
  }
  
  playMuscleAnimation(){
    this.setState({
      flexLogo: flexingLogo
    });
    let that = this;
    setTimeout(function() {
      that.setState({
        flexLogo: relaxingLogo
      });
    }, 1000);
  }

  logout() {

    this.setState ({
      currentHomePage: "Welcome",
      enteredPhrase: "",
      wallet: null,
      walletPhrase: "",
      phraseIsConfirmed: false,
      walletSyncProgress: 0,
      restoreHeight: 0,
      walletIsSynced: false,
      balance: 0,
      availableBalance: 0,
      isGeneratingTxs: false,
      walletIsFunded: false,
      transactionsGenerated: 0,
      totalFees: 0,
      enteredMnemonicIsValid: true,
      enteredHeightIsValid: true,
      isAwaitingWalletVerification: false,
      depositQrCode: null,
      isAwaitingDeposit: false,
      blocksToNextUnlock: -1,
      isCycling: isCycling
    });
    this.txGenerator = null;
    this.walletUpdater = null;
  }
  
  delimitEnteredWalletPhrase(){
    // Remove any extra whitespaces
    let enteredPhraseCopy = this.state.enteredPhrase;
    enteredPhraseCopy = enteredPhraseCopy.replace(/ +(?= )/g,'').trim();
    return(enteredPhraseCopy);
  }
  
  async confirmWallet() {
    this.setState({
      isAwaitingWalletVerification: true
    });
    let walletPhrase = await this.state.walletPhrase;
    if (this.delimitEnteredWalletPhrase() === walletPhrase) {
      
      // Create a wallet event listener
      this.walletUpdater = new walletListener(this);
      this.walletUpdater.setWalletIsSynchronized(true);
      
      // initialize main page with listening, background sync, etc
      await this._initMain();
      
      // If the user hit "Or go back" before the wallet finished building, abandon wallet creation
      // and do NOT proceed to wallet page
      if(this.userCancelledWalletConfirmation){
	this.userCancelledWalletConfirmation = false;
	this.setState({
	  isAwaitingWalletVerification: false
	});
	return;
      }
      
      this.setState ({
        phraseIsConfirmed: true,
        lastHomePage: "Confirm_Wallet",
        walletIsSynced: true,
        currentHomePage: "Wallet",
        isAwaitingWalletVerification: false
      });
      let that = this;
      qrcode.toDataURL(this.walletAddress, function(err, url){
          let code = <QR_Code url={url} />;
          that.setState({
            depositQrCode: code
          });
        }
      );
      
    } else {
      this.setState({
        enteredMnemonicIsValid: false,
	isAwaitingWalletVerification: false
      });
    }
  }
  
  async confirmAbortWalletSynchronization() {
    let doAbort = confirm("All synchronization will be lost. Are you sure you wish to continue?");
    
    if (doAbort){
      
      this.setState({
        walletPhrase: "",
        phraseIsConfirmed: false,
        walletSyncProgress: 0,
        balance: 0,
        availableBalance: 0,
        enteredMnemonicIsValid: true,
        enteredHeightIsValid: true,
        currentHomePage: "Import_Wallet"
      });
      /*
       * First, set a class variable so that the importWallet function 
       * can know that the wallet sync function finished because it was cancelled
       * and not because the wallet actually finished syncing
       */
      this.userCancelledWalletSync = true;      
      await this.state.wallet.stopSyncing();
    }
  }
  
  setCurrentHomePage(pageName){
    this.setState({
      currentHomePage: pageName
    });
  }
  
  confirmAnimationLoaded(){
    /*
     * For reasons I don't entirely understand, it is necessary to separate the <img>'s "onLoad" function
     * call from the change in state with a timeout delay - even if the delay is set to zero!
     * Otherwise, the imagine will not ACTUALLY finish loading 
     */
    setTimeout(() => {
      this.setState({
	animationIsLoaded: true
      });
	    
    }, 0);
  }
  
  cancelImport(){
    this.userCancelledWalletImport = true;
    this.logout();
  }
  
  cancelConfirmation(){
    /*
     * If the user cancels the wallet import by hitting "or go back", this.state.wallet will remain a promise
     * to the cancelled wallet. "stopSyncing" must be run on this wallet, but cannot until the promise resolves
     * by which point the value of state.wallet may have changed do to the user generating a new phrase or 
     * importing a different wallet in the meantime.
     * Thus, condemnedWallet allows the app to keep track of the wallet and run "stopSyncing" on it when ready.
     */
    this.userCancelledWalletConfirmation = true;
    this.setState({
      isAwaitingWalletVerification: false
    });
  }
  
  notifyIntentToDeposit() {
    this.setState({
      isAwaitingDeposit: true
    });
  }
  
  render(){
    if(this.state.animationIsLoaded){
      return(
        <div id="app_container">
          <Router>
            <Banner 
              walletIsSynced={this.state.walletIsSynced}
              flexLogo = {this.state.flexLogo}
              notifyIntentToDeposit = {this.notifyIntentToDeposit.bind(this)}
            />
            <Switch>
              <Route exact path="/" render={() => <Home
                generateWallet={this.generateWallet.bind(this)}
                confirmWallet={this.confirmWallet.bind(this)}
                restoreWallet={this.restoreWallet.bind(this)}
                setEnteredPhrase={this.setEnteredPhrase.bind(this)}
                logout={this.logout.bind(this)}
                walletSyncProgress = {this.state.walletSyncProgress}
                setRestoreHeight = {this.setRestoreHeight.bind(this)}
                walletPhrase = {this.state.walletPhrase}
                currentHomePage = {this.state.currentHomePage}
                balance = {this.state.balance}
                setCurrentHomePage = {this.setCurrentHomePage.bind(this)}
                lastHomePage = {this.state.lastHomePage}
                availableBalance = {this.state.availableBalance}
                confirmAbortWalletSynchronization = {this.confirmAbortWalletSynchronization.bind(this)}
                coreModuleLoaded = {this.state.coreModuleLoaded}
                keysModuleLoaded = {this.state.keysModuleLoaded}
                isGeneratingTxs = {this.state.isGeneratingTxs}
                walletIsFunded = {this.state.walletIsFunded}
                startGeneratingTxs = {this.startGeneratingTxs.bind(this)}
                stopGeneratingTxs = {this.stopGeneratingTxs.bind(this)}
                transactionsGenerated = {this.state.transactionsGenerated}
                totalFees = {this.state.totalFees}
                createDateConversionWallet = {this.createDateConversionWallet.bind(this)}
                enteredMnemonicIsValid = {this.state.enteredMnemonicIsValid}
                enteredHeightIsValid = {this.state.enteredHeightIsValid}
                cancelImport = {this.cancelImport.bind(this)}
                cancelConfirmation = {this.cancelConfirmation.bind(this)}
                forceWait = {this.state.isAwaitingWalletVerification}
                blocksToUnlock = {this.state.blocksToUnlock}
                isCycling = {this.state.isCycling}
                splitOutputs = {this.state.splitOutputs}
              />} />
              <Route path="/backup" render={(props) => <Backup
                {...props}
              />} />
              <Route path="/deposit" render={() => <Deposit
                depositQrCode = {this.state.depositQrCode}
                walletAddress = {this.walletAddress}
                
                // TODO: just becaus the wallet is funded doesn't mean a deposit was made
                // create an "isAwaitingDeposit" state variable
                // set to "true" when user opens deposit page
                // set to "false" when an output is received
                xmrWasDeposited = {!this.state.isAwaitingDeposit}

                setCurrentHomePage = {this.setCurrentHomePage.bind(this)}
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
    } else {
      return (
	<div id="spinner_loader">
	  <Loading_Animation notifySpinnerLoaded = {this.confirmAnimationLoaded.bind(this)} hide={true} />
	</div>
      );
    }
  }
}

function default_page(){
  return <h1>ERROR - invalid url path!</h1>
}
            
/**
 * Print sync progress every X blocks.
 */
class walletListener extends MoneroWalletListener {
              
  constructor(callingComponent) { // callingComponent is "App" in this case
    super();
    this.callingComponent = callingComponent;
    this.syncResolution = 0.05;
    this.lastIncrement = 0;
    this.walletIsSynchronized = false;
  }
              
  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    this.callingComponent.setCurrentSyncProgress(percentDone*100); 
    if (percentDone >= this.lastIncrement + this.syncResolution) {
      this.lastIncrement += this.syncResolution;
    }
  }
  
  onBalancesChanged(newBalance, newUnlockedBalance){
    this.callingComponent.setBalances(newBalance, newUnlockedBalance); 
    if (this.walletIsSynchronized) {
      if (newUnlockedBalance >= FUNDED_WALLET_MINIMUM_BALANCE && !callingComponent.state.walletIsFunded){
	callingComponent.setState({
	  walletIsFunded: true
	});
      } else if (newUnlockedBalance < FUNDED_WALLET_MINIMUM_BALANCE && callingComponent.state.walletIsFunded){
	callingComponent.setState({
	  walletIsFunded: false
	});
      }
    }
  }
  
  setWalletIsSynchronized(value) {
    this.walletIsSynchronized = value;
  }
}

export default App;
