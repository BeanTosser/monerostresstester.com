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

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      walletPhrase: "",
      phraseIsConfirmed: false
    };
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
      phraseIsConfirmed: false
    })
  }

  confirmWallet() {
    alert("Confirming wallet");
    this.setState ({
      phraseIsConfirmed: true
    })
  }

  render(){
    return(
      <div id="app_container">
        <Router>
          <Banner />
          <Switch>
            {/*
            <Route path="/" exact render={() => <Home
              walletPhrase={this.state.walletPhrase}
              generateWallet={this.generateWallet.bind(this)}
              confirmWallet={this.confirmWallet.bind(this)}
              deleteWallet={this.deleteWallet.bind(this)}
            />} />
            <Route path="/deposit" render={() => <Deposit />} />
            <Route path="/signOut" render={() => <SignOut />} />
            <Route path="/backup" render={() => <Backup />} />
            <Route path="/withdraw" render={() => <Withdraw />} />
            */}
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
            />} />
          </Switch>
        </Router>
      </div>
    );
  }
}

export default App;
