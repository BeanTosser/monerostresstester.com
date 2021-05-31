import React from 'react';
import ReactDOM from 'react-dom';
import "./app.css";

import Banner from "./components/Banner.js";
import Home from "./components/pages/Home.js";
import Deposit from "./components/pages/Deposit.js";
import SignOut from "./components/pages/SignOut.js";
import Save_Phrase_Page from "./components/pages/Save_Phrase_Page.js";
import Withdraw from "./components/pages/Withdraw.js";
import {Notification_Bar, Loading_Animation, getLoadingAnimationFile} from "./components/Widgets.js";

import QR_Code from "./components/QR_Code.js";
import qrcode from './qrcode.js';

import {HashRouter as Router, Link, Route, Switch, Redirect} from 'react-router-dom';
//import { BrowserRouter as Link, NavLink } from "react-router-dom";
import MoneroTxGenerator from './MoneroTxGenerator.js';
import MoneroTxGeneratorListener from './MoneroTxGeneratorListener.js';

import flexingLogo from './img/muscleFlex.gif';
import relaxingLogo from './img/muscleRelax.gif';

/*
 * The following regexp finds the following multi-line "string"
 * startblab\n(.+|\n)+endblab
 */
/*
startblab
adf f 24ffe
ef 2e 2e
f2ef e2fff
endblab
*/

const DEBUG = true;

const monerojs = require("monero-javascript");
const LibraryUtils = monerojs.LibraryUtils;
const MoneroWalletListener = monerojs.MoneroWalletListener;
const MoneroWallet = monerojs.MoneroWallet;
const MoneroRpcConnection = monerojs.MoneroRpcConnection;
const MoneroUtils = monerojs.MoneroUtils;
const BigInteger = monerojs.BigInteger;

/* 
 * A wallet must contain at least this many atomic units to be considered "funded" 
 * and thus allowed to generate transactions
 */
const FUNDED_WALLET_MINIMUM_BALANCE = 0.000000000001;
/*
 * WALLET_INFO is a the basic configuration object ot pass to the walletKeys.createWallet() method
 * in order to create a new, random keys-only wallet
 * It is also used as the base to create configuration objects for the WASM wallets that will follow
 * by copying then adding an empty path ("") property and, in the case of a generated wallet,
 * the mnemonic from the generated keys-only wallet.
 */
const WALLET_INFO = {
    password = "supersecretpassword123";
    networkType = "stagenet";
    serverUri = "http://localhost:38081";
    serverUsername = "superuser";
    serverPassword = abctesting123;
}

export default function App(props) {
  
  let withdrawAmountTextPrompt = 'Enter amount to withdraw or click "Send all" to withdraw all funds';
  let withdrawAmountSendAllText = "All available funds";
  let withdrawAddressTextPrompt = "Enter destination wallet address..";
  
  // Force the loading animation to preload
  const img = new Image();
  img.src = getLoadingAnimationFile();
  
  
  // print current version of monero-javascript
  
  /*
   * Member Variables
   * No need to store these in state since no components need to re-render when their values are set
   */
  let txGenerator = null;
  let walletAddress = "empty";
  let wallet = null;
  let enteredText = "";
  let restoreHeight = 0;
  let lastHomePage = "";
  let animationIsLoaded = false;
  
  // new (due to converting to functional component):
  let dateRestoreWalletPromise = null;
  let walletUpdater = null;
  
  //Start loading the Keys-only and full wallet modules
  
  //First, load the keys-only wallet module  
    LibraryUtils.loadKeysModule().then(
      function() {
	
	setKeysModuleLoaded(true)

	// Load the full module
	LibraryUtils.loadFullModule().then(
	  function() {
	    setCoreModuleLoaded(true);
	  }
	).catch(
	  function(error) {
	    console.log("Failed to load full wallet module!");
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
    
  const [walletPhrase, setwalletPhrase] = useState("");
  const [phraseIsConfirmed, setphraseIsConfirmed] = useState(false);
  const [walletSyncProgress, setwalletSyncProgress] = useState(0);
  const [walletIsSynced, setwalletIsSynced] = useState(false);
  const [balance, setbalance] = useState(0);
  const [availableBalance, setavailableBalance] = useState(0);
  const [currentHomePage, setcurrentHomePage] = useState("Welcome");
  const [isGeneratingTxs, setisGeneratingTxs] = useState(false);
  const [transactionsGenerated, settransactionsGenerated] = useState(0);
  const [totalFees, settotalFees] = useState(0);
  const [enteredMnemonicIsValid, setenteredMnemonicIsValid] = useState(true);
  const [enteredHeightIsValid, setenteredHeightIsValid] = useState(true);
  const [isAwaitingWalletVerification, setisAwaitingWalletVerification] = useState(false);
  const [flexLogo, setflexLogo] = useState(relaxingLogo);
  const [depositQrCode, setdepositQrCode] = useState(null);
  const [isAwaitingDeposit, setisAwaitingDeposit] = useState(false);
  const [transactionStatusMessage, settransactionStatusMessage] = useState("");
  const [currentSitePage, setcurrentSitePage] = useState("/");
  
  
  const  createDateConversionWallet = function(){
    // Create a disposable,random wallet to prepare for the possibility that the user will attempt to restore from a date
    // At present, getRestoreHeightFromDate() is (erroneously) an instance method; thus, a wallet instance is
    // required to use it.
    
    dateRestoreWalletPromise = monerojs.createWalletFull({
      password: "supersecretpassword123",
      networkType: "stagenet",
      path: "",
      serverUri: "http://localhost:38081",
      serverUsername: "superuser",
      serverPassword: "abctesting123",
    });

  }
  
  async createTxGenerator(wallet) {
    
    // create daemon with connection
    let daemonConnection = new MoneroRpcConnection(WALLET_INFO.serverUri, WALLET_INFO.serverUsername, WALLET_INFO.serverPassword);
    let daemon = await monerojs.connectToDaemonRpc({
      server: daemonConnection,
      proxyToWorker: true
    });
    
    // create tx generator
    txGenerator = new MoneroTxGenerator(daemon, wallet);
  }
  
  const  setBalances = function(balance, availableBalance){
    setBalance(balance);
    setAvailableBalance(availableBalance);
  }
  
  const  convertStringToRestoreDate = function(str){
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
  
  const  setRestoreHeight = function(height){
    restoreHeight = height;
    setEnteredHeightIsValid(true);
  }
  
  const restoreWallet = async function(){
    
    setIsAwaitingWalletVerification(true);
    
    let alertMessage = "";  
    
    // First, determine whether the user has typed a height, a date, or something else(invalid)
    let height=Number(restoreHeight);
    // If the string is NOT a valid integer, check to see if it is a date and convert accordingly:
    let dateRestoreHeightWallet;
    if(!(height != NaN && height%1 === 0 && height >= 0)) {
      // Attempt to convert the string to a date in the format "YYYY-MM-DD"
      try {
        var dateParts = convertStringToRestoreDate(restoreHeight);
    
        // Attempt to convert date into a monero blockchain height:
        dateRestoreHeightWallet = await dateRestoreWalletPromise;
        height = await dateRestoreHeightWallet.getHeightByDate(dateParts[0], dateParts[1], dateParts[2]);
      } catch(e) {
        alertMessage = e;
      }
    }
    
    // If no errors were thrown, "height" is a valid restore height.
    if (alertMessage !== "") {
      //If height was invalid:
      console.log(alertMessage);
      setenteredHeightIsValid(false,)
      setisAwaitingWalletVerification(false);
      return;
    }
    
    let walletFull = null;
    try {
      let fullWalletInfo = Object.assign({}, WALLET_INFO);
      fullWalletInfo.path = "";
      fullWalletInfo.mnemonic = delimitEnteredWalletPhrase();
      fullWalletInfo.restoreHeight = height;
      walletFull = await monerojs.createWalletFull(fullWalletInfo);
      
    } catch(e) {
      console.log("Error: " + e);
      setenteredMnemonicIsValid(false);
      setisAwaitingWalletVerification(false);
      return;
    }
    
    if(userCancelledWalletImport){
      return;
    }
    // Both the mnemonic and restore height were valid; thus, we can remove the disposable date-conversion
    // Wallet from memory
    dateRestoreHeightWallet = null;

    setisAwaitingWalletVerification(false);

    
    wallet = walletFull;
    
    // Get the mnemonic so we can store it in state and make it available to view on "Backup" page
    let mnemonic = await walletFull.getMnemonic();
    
    lastHomePage = "Import_Wallet";
    

    setcurrentHomePage("Sync_Wallet_Page");

    
    // Create a wallet listener to keep app.js updated on the wallet's balance etc.
    walletUpdater = new walletListener(this);
    
    walletFull.sync(walletUpdater).then(async () => {
      
      if(!that.userCancelledWalletSync && !that.userCancelledWalletImport){
        // This code should only run if wallet.sync finished because the wallet finished syncing
        // And not because the user cancelled the sync
        that.walletUpdater.setWalletIsSynchronized(true);
        await that._initMain();
        let balance = await walletFull.getBalance();
        let availableBalance = await walletFull.getUnlockedBalance();
        setWalletIsSynced(true);
        setBalance(balance);
        setAvailableBalance(availableBalance);
        setCurrentHomePage("Wallet");
        setWalletPhrase(mnemonic);
        qrcode.toDataURL(that.walletAddress, function(err, url){
            let code = <QR_Code url={url} />;

            setdepositQrCode(code);

          }
        );

      } else {
        // Reset the wallet sync cancellation indicator variable so that any syncs
        // completed in the future are not misinterpretted as cancelled syncs by default
        userCancelledWalletSync = false;
        userCancelledWalletImport = false;
      }
    });
    

  }

setCurrentSyncProgress(percentDone){
  setWalletSyncProgress(percentDone);
}
  
setEnteredPhrase(mnemonic){
  enteredText = mnemonic;
  setenteredMnemonicIsValid(true);
}

async startGeneratingTxs(){
  await txGenerator.start();
  setisGeneratingTxs(true);
}

async stopGeneratingTxs(){
  txGenerator.stop();
  setisGeneratingTxs(false);
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
  let walletAddress = await walletKeys.getAddress(0,0);

  setwalletPhrase(newPhrase);

  let fullWalletInfo = Object.assign({}, WALLET_INFO);
  fullWalletInfo.mnemonic = newPhrase;
  fullWalletInfo.path = "";
  
  // set restore height to daemon's current height
  let daemonConnection = new MoneroRpcConnection(WALLET_INFO.serverUri, WALLET_INFO.serverUsername, WALLET_INFO.serverPassword);    // TODO: factor out common daemon reference so this code is not duplicated
  let daemon = await monerojs.connectToDaemonRpc({
    server: daemonConnection,
    proxyToWorker: true
  });
  fullWalletInfo.restoreHeight = await daemon.getHeight();
  
  // create wallet promise which syncs when resolved
  let walletPromise = monerojs.createWalletFull(fullWalletInfo);
  walletPromise.then(async function(wallet) {
    await wallet.sync();
  })
  
  wallet = walletPromise;
}

  /**
   * Common helper to initialize the main page after the wallet is created and synced.
   *
   * Creates the tx generator, listens for event notifications, and starts background synchronization.
   */
  async _initMain() {
    
    // resolve wallet promise
    wallet = await wallet;
    
    // Keep track of the wallet's address
    let walletAddress = await wallet.getAddress(0,0);
    
    // If the user hit "Or go back" before the wallet finished building, abandon wallet creation
    // and do NOT proceed to wallet page
    if (userCancelledWalletConfirmation) return;
        
    // create transaction generator
    await createTxGenerator(this.wallet);
            
    // register listener to handle notifications from tx generator

    await txGenerator.addListener(new class extends MoneroTxGeneratorListener {
      
      async onMessage(msg) {

        settransactionStatusMessage(msg);

      }
      
      // handle transaction notifications
      async onTransaction(tx, numTxsGenerated, totalFees, numSplitOutputs) {
        
        // refresh main ui
        await that.refreshMainState();
      }
      
      async onNumBlocksToUnlock(numBlocksToNextUnlock, numBlocksToLastUnlock) {
        await that.refreshMainState();
      }
    });
    
    // listen for wallet updates to refresh main ui
    await wallet.addListener(new class extends MoneroWalletListener {
        
      async onBalancesChanged(newBalance, newUnlockedBalance) {
        if (newBalance > that.state.balance){

          setisAwaitingDeposit(false,);
          setavailableBalance(newUnlockedBalance,);
          setbalance(newBalance);

        }
        await that.refreshMainState();
      }
    });
    
    // start syncing wallet in background if the user has not cancelled wallet creation
    await wallet.startSyncing(5000);
  }
  
  async refreshMainState() {
    
    // skip if already refreshing
    if (_refreshingMainState) return;
    let _refreshingMainState = true;
    
    // build new state
    let state = {};
    state.balance = await wallet.getBalance();
    state.availableBalance = await wallet.getUnlockedBalance();
    state.transactionsGenerated = txGenerator.getNumTxsGenerated();
    state.totalFees = txGenerator.getTotalFees();
    
    setBalance(state.balance);
    setAvailableBalance(state.availableBalance);
    setTransactionsGenerated(state.transactionsGenerated);
    setTotalFees(state.totalFees);
    
    // pump arms if new tx generated
    let armPump = state.transactionsGenerated > transactionsGenerated;
    if (armPump) playMuscleAnimation();

    // TODO: update balance with time to last unlock if > 0
    this.setState(state);
    let _refreshingMainState = false;
  }
  
  const  playMuscleAnimation = function() {
    setFlexLogo(flexingLogo);
    let that = this;
    setTimeout(function() {
      setFlexLogo(relaxingLogo);
    }, 1000);
  }

  const  logout = function() {

    setwalletPhrase("");
    setphraseIsConfirmed(false);
    setwalletSyncProgress(0);
    setwalletIsSynced(false);
    setbalance(0);
    setavailableBalance(0);
    setcurrentHomePage("Welcome");
    setisGeneratingTxs(false);
    settransactionsGenerated(0);
    settotalFees(0);
    setenteredMnemonicIsValid(true);
    setenteredHeightIsValid(true);
    setisAwaitingWalletVerification(false);
    setflexLogo(relaxingLogo);
    setdepositQrCode(null);
    setisAwaitingDeposit(false);
    settransactionStatusMessage("");
    setcurrentSitePage("/");
    txGenerator = null;
    walletUpdater = null;
    wallet = null;
    restoreHeight = 0;
    lastHomePage = "";
    enteredWithdrawAmountIsValid = true;
    enteredWithdrawAddressIsValid = true;
    withdrawTransaction = null;
  }
  
  const  delimitEnteredWalletPhrase = function(){
    // Remove any extra whitespaces
    let enteredTextCopy = enteredText;
    enteredTextCopy = enteredTextCopy.replace(/ +(?= )/g,'').trim();
    return(enteredTextCopy);
  }
  
  async confirmWallet() {
    
    setisAwaitingWalletVerification(true);

    let walletPhrase = await walletPhrase;
    
    if (delimitEnteredWalletPhrase() === walletPhrase) {
      
      // Create a wallet event listener
      walletUpdater = new walletListener(this);
      walletUpdater.setWalletIsSynchronized(true);
      
      // initialize main page with listening, background sync, etc
      await _initMain();
      
      // If the user hit "Or go back" before the wallet finished building, abandon wallet creation
      // and do NOT proceed to wallet page
      if(userCancelledWalletConfirmation){
	let userCancelledWalletConfirmation = false;
	setisAwaitingWalletVerification(false);
	return;
      }
      // (this|that)\.setState\s\(\{((\n|.+)+&[^[\}\)\;])
      let lastHomePage = "Confirm_Wallet";
      
      setphraseIsConfirmed(true,);
      setwalletIsSynced(true,);
      setcurrentHomePage("Wallet",);
      setisAwaitingWalletVerification(false);
      
      let that = this;
      qrcode.toDataURL(walletAddress, function(err, url){
          let code = <QR_Code url={url} />;
          setdepositQrCode(code);
        }
      );
    } else {
      setenteredMnemonicIsValid(false);
      isAwaitingWalletVerification(false);
    }
  }
  
  async confirmAbortWalletSynchronization() {
    let doAbort = confirm("All synchronization will be lost. Are you sure you wish to continue?");
    
    if (doAbort){
      setwalletPhrase("");
      setphraseIsConfirmed(false);
      setwalletSyncProgress(0);
      setbalance(0);
      setavailableBalance(0);
      setenteredMnemonicIsValid(true);
      setenteredHeightIsValid(true);
      setcurrentHomePage("Import_Wallet");

      /*
       * First, set a class variable so that the importWallet function 
       * can know that the wallet sync function finished because it was cancelled
       * and not because the wallet actually finished syncing
       */
      let userCancelledWalletSync = true;      
      await wallet.stopSyncing();
    }
  }
  
  /*
   * currentHomePage and currentSitePage
   * the "current home page" is the "subpage" of "home" (/#) the user is currently viewing
   * 
   * currentSitePage refers to the ACTUAL page - this could be "home" (/#) but can also be any
   * of the other pages (deposit, withrawl, etc)
   * 
   * currentHomePage becomes irrelevant once the user loads a wallet and gains acces
   * to the other site pages besides home (since home no longer has sub pages
   * once this is the case)
   */
  const  setCurrentHomePage = function(pageName){
    setcurrentHomePage(pageName);
  }
  //(this|that)\.setState\s?\(\{((\n)|(\.+))+
  const  setCurrentSitePage = function(pageName) {
    if(pageName === "/sign_out"){
      let userConfirmedSignout = confirm("Are you sure you want to sign out of this wallet? If you did not record the seed phrase, you will permanently lose access to the wallet and any funds contained therin! Click 'Ok' to continue");
      if(userConfirmedSignout){
        logout();
        console.log("Pagename == 'Sign Out'. Logging out.");
      }
    } else {
      setcurrentSitePage(pageName);
    }
  }
  
  const  confirmAnimationLoaded = function(){
    /*
     * For reasons I don't entirely understand, it is necessary to separate the <img>'s "onLoad" function
     * call from the change in state with a timeout delay - even if the delay is set to zero!
     * Otherwise, the imagine will not ACTUALLY finish loading 
     */
    setTimeout(() => {
      let animationIsLoaded = true;
    }, 0);
  }
  
  const  cancelImport = function(){
    let userCancelledWalletImport = true;
    logout();
  }
  
  const  cancelConfirmation = function(){
    /*
     * If the user cancels the wallet import by hitting "or go back", wallet will remain a promise
     * to the cancelled wallet. "stopSyncing" must be run on this wallet, but cannot until the promise resolves
     * by which point the value of wallet may have changed do to the user generating a new phrase or 
     * importing a different wallet in the meantime.
     * Thus, userCancelledWalletConfirmation allows the app to keep track of the wallet and run "stopSyncing" 
     * on it when ready.
     */
    if(isAwaitingWalletVerification){
      let userCancelledWalletConfirmation = true;
      setisAwaitingWalletVerification(false);
    };
  }
  
  const  notifyIntentToDeposit = function() {
    setisAwaitingDeposit(true);
    setCurrentSitePage("/deposit");
  }
  
  const  render = function(){
    let notificationBar = null;
    
    if(walletIsSynced && !(balance > 0) && currentSitePage != "/deposit"){
      notificationBar = (
	<Notification_Bar content = {
	  <>
            No funds deposited
            &thinsp;
            <Link 
              onClick = {notifyIntentToDeposit.bind(this)}
              to = "/deposit"	
            >
              click to deposit
            </Link>
          </>
	} />
      );
    }
    
    if(animationIsLoaded){
      return(
        <div id="app_container">
          <Router>
            <Banner 
              walletIsSynced={walletIsSynced}
              flexLogo = {flexLogo}
              notifyIntentToDeposit = {notifyIntentToDeposit.bind(this)}
              setCurrentSitePage = {setCurrentSitePage.bind(this)}
            />
            {notificationBar}
            <Switch>
            <Route exact path="/">
              {currentSitePage != "/" ? <Redirect to = {currentSitePage} /> : <Home
                generateWallet={generateWallet.bind(this)}
                confirmWallet={confirmWallet.bind(this)}
                restoreWallet={restoreWallet.bind(this)}
                setEnteredPhrase={setEnteredPhrase.bind(this)}
                logout={logout.bind(this)}
                walletSyncProgress = {walletSyncProgress}
                setRestoreHeight = {setRestoreHeight.bind(this)}
                walletPhrase = {walletPhrase}
                currentHomePage = {currentHomePage}
                balance = {balance}
                setCurrentHomePage = {setCurrentHomePage.bind(this)}
                setCurrentSitePage = {setCurrentSitePage.bind(this)}
                lastHomePage = {lastHomePage}
                availableBalance = {availableBalance}
                confirmAbortWalletSynchronization = {confirmAbortWalletSynchronization.bind(this)}
                coreModuleLoaded = {coreModuleLoaded}
                keysModuleLoaded = {keysModuleLoaded}
                isGeneratingTxs = {isGeneratingTxs}
                startGeneratingTxs = {startGeneratingTxs.bind(this)}
                stopGeneratingTxs = {stopGeneratingTxs.bind(this)}
                transactionsGenerated = {transactionsGenerated}
                totalFees = {totalFees}
                createDateConversionWallet = {createDateConversionWallet.bind(this)}
                enteredMnemonicIsValid = {enteredMnemonicIsValid}
                enteredHeightIsValid = {enteredHeightIsValid}
                cancelImport = {cancelImport.bind(this)}
                cancelConfirmation = {cancelConfirmation.bind(this)}
                forceWait = {isAwaitingWalletVerification}
                transactionStatusMessage = {transactionStatusMessage}
            />}
          </Route>
          <Route path="/backup"> 
            {currentSitePage != "/backup" ? <Redirect to = {currentSitePage} /> : <Save_Phrase_Page 
    	  omit_buttons = {true} 
              text = {walletPhrase}
              verificationUrl = {currentSitePage}
            />}
          </Route>
          <Route path="/deposit">
            {currentSitePage != "/deposit" ? <Redirect to = {currentSitePage} /> : <Deposit
              depositQrCode = {depositQrCode}
              walletAddress = {walletAddress}
              xmrWasDeposited = {!isAwaitingDeposit}
              setCurrentSitePage = {setCurrentSitePage.bind(this)}
              verificationUrl = {currentSitePage}
            />}
          </Route>
          <Route path="/withdraw">
    	    {currentSitePage != "/withdraw" ? <Redirect to = {currentSitePage} /> : <Withdraw
              availableBalance = {availableBalance}
              totalBalance = {balance}
              wallet = {wallet}
              isGeneratingTxs = {isGeneratingTxs}
            /> }
          </Route>
          <Route>
            <Redirect to = {currentSitePage} />
          </Route>
        </Switch>
      </Router>
    </div>
      );
    } else {
      return (
	<div id="spinner_loader">
	  <Loading_Animation notifySpinnerLoaded = {confirmAnimationLoaded.bind(this)} hide={true} />
	</div>
      );
    }
  }
}

function default_page(){
  return <h1>ERROR - invalid url path!</h1>
}
            
/*
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
    callingComponent.setCurrentSyncProgress(percentDone*100); 
    if (percentDone >= lastIncrement + this.syncResolution) {
      lastIncrement += this.syncResolution;
    }
  }
  
  onBalancesChanged(newBalance, newUnlockedBalance){
    callingComponent.setBalances(newBalance, newUnlockedBalance); 
  }
  
  setWalletIsSynchronized(value) {
    this.walletIsSynchronized = value;
  }
}

export default App;
