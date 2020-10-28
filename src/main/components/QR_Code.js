import React from 'react';
import ReactDOM from 'react-dom';

export default function QR_Code (props) {
  if (props.url){
    return(
      <img src={props.url} alt="QR Code goes here" />
    );
  }
}