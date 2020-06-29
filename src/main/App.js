import React from 'react';
import ReactDOM from 'react-dom';
import "./App.css";

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render(){
    return(
      <div>
        <h1>This is a test component</h1>
        <h2>And it appears to be working :)</h2>
      </div>
    );
  }
}

export default App;
