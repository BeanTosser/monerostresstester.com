import React from 'react';
import ReactDOM from 'react-dom';
import './widgets.css';

export function Progress_Bar(props) {
  const progressStyle = {
    width: `${props.progress}%`
  }
  return(
    <div className="progress_bar_container">
      <div className="progress_bar" style={progressStyle}></div>
      <div className="progress_percentage">{`${props.progress}%`}</div>
    </div>
  );
}

// A generic container for the common "box format" of most of the home sub-pages
export function Page_Box(props) {
  return (
    <div className={"page_box " + props.className}>
      {props.children}
    </div>
  );
}

export function Loading_Animation(props) {
  return ( 
    <div className={"loading_animation_container"}>
      <img className="loading_animation" src={props.loadingAnimation} alt="Spinny wheel animation"></img>
    </div>
  );
}

export function Page_Text_Box(props) {
  return(
    <div className="text_box save_phrase_box main_content">
      {props.box_text}
    </div>
  );
}

/*
 * props.isDefault: Denotes whether the box contains the intial, unedited text;
 *   if so, set a css class to use gray text instead of black.
 * props.value:
 */
export class Page_Text_Entry extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      isDefault: true,
      enteredPhrase: ""
    }
  }

  handleChange(e){
    this.setState({
    isDefault: false,
    enteredPhrase: e.target.value,
  });
  this.props.handleTextChange(e.target.value);
  }

  render() {
    return (
      <textarea
        className={this.props.className + " text_box" + ((this.state.isDefault === true) ? " default_value" : " new_value")}
        defaultValue={this.props.value}
        onChange={this.handleChange.bind(this)} 
      />
    );
  }
}

export function Main_Content(props) {
  return(
    <div className="main_content">
      {props.children}
    </div>
  );
}

export function Header(props) {
  return (
    <div className="header">
      <div className="header_text">
        {props.text}
      </div>

      <div className="header_bottom_margin">
        {props.margin_content}
      </div>
    </div>
  );
}
