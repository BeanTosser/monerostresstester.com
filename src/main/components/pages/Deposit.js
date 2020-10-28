import React from 'react';
import ReactDOM from 'react-dom';



export default function Deposit(props){
  return(
    <>
      <h1>Deposit</h1>
      
      {props.depositQrCode}
    </>
  );
}
