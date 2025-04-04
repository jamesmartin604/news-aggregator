import React, { useState } from 'react';

const SignUp = () => {
 return (
   <div className="signup-container">
     <div className="signup-header">
       <div className = "text">Sign Up</div>
       <div className = "underline"></div>
     </div>
     <div className ="inputs">
       <div className="input">
         <input type="text" />
       </div>
       <div className="input">
         <input type="email" />
       </div>
       <div className="input">
         <input type="password" />
       </div>
     </div>
     <div className="forgot-password">Forgotten Password? <span>Click here</span>
     </div>
     <div className="submit_container">
       <div className="submit">Sign Up</div>
       <div className="submit">Log In</div>
     </div>
   </div>
 )
}


export default SignUp;
