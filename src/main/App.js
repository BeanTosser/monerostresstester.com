import React from 'react';
import ReactDOM from 'react-dom';
import "./App.css";
import Banner from "./components/Banner.js";
import Home from "./components/Home.js";

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render(){
    return(
      <div id="app_container">
        <Banner />
        <Home />
      </div>
    );
  }
}

export default App;
