import React from 'react';
import ReactDOM from 'react-dom';
import "./app.css";

import Banner from "./components/Banner.js";
import Home from "./components/pages/Home.js";
import Deposit from "./components/pages/Deposit.js";
import SignOut from "./components/pages/SignOut.js";
import Backup from "./components/pages/Backup.js";
import Withdraw from "./components/pages/Withdraw.js";
import {HashRouter as Router, Route, Switch, Redirect} from 'react-router-dom';

//TEMPORARY values for testing the progress bar
const TEST_SYNC_UPDATE_INTERVAL = 0.1;
const TEST_SYNC_TIMER_INTERVAL = 20;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      walletPhrase: "",
      phraseIsConfirmed: false,
      walletSyncProgress: 0
    };
  }

  componentDidMount() {
    this._isMounted = true;
  }
  componentWillUnmount() {
    this._isMounted = false;
  }

  generateWallet(){
    alert("Generating new wallet phrase");
    let newPhrase = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 100);
    this.setState ({
      walletPhrase: newPhrase
    });
  }

  deleteWallet() {
    alert("Deleting wallet");
    this.setState ({
      walletPhrase: "",
      phraseIsConfirmed: false,
      walletSyncProgress: 0
    })
  }

  confirmWallet() {
    alert("Confirming wallet");
    this.setState ({
      phraseIsConfirmed: true
    })
  }
  //Called when the user clicks "continue" after entering a valid new (for restore) or confirm (for create new) seed phrase.
  synchronizeWallet() {
    this.timer = setInterval(this.updateSyncProgress.bind(this), TEST_SYNC_TIMER_INTERVAL);
  }
  updateSyncProgress() {
    if(this._isMounted){
      if(this.state.walletSyncProgress < 100) {
        this.setState((state) => ({
          walletSyncProgress: state.walletSyncProgress + TEST_SYNC_UPDATE_INTERVAL
        }));
      } else {
        clearInterval(this.timer);
      }
    }
  }

  render(){
    return(
      <div id="app_container">
        <Router>
          <Banner />
          <Switch>
            <Route exact path="/" render={() => {
              alert("Redirection to 'Home'");
              return(
                <Redirect to="/home" />
              );
            }} />
            <Route path="/home" render={() => <Home
              walletPhrase={this.state.walletPhrase}
              generateWallet={this.generateWallet.bind(this)}
              confirmWallet={this.confirmWallet.bind(this)}
              deleteWallet={this.deleteWallet.bind(this)}
              handleConfirm={this.synchronizeWallet.bind(this)}
              walletSyncProgress = {Math.trunc(this.state.walletSyncProgress)}
            />} />
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

export default App;
