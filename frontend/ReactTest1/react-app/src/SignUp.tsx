import React, { useState } from 'react';
import { Link } from "react-router-dom"; // Import Link here


const SignUp = () => {
  const [action, setAction] = useState("Sign Up");
  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [username, setUsername] = useState("");

const handleSubmit = () => {
  if (action === "Log In") {
    if (email && password) {
      alert("Successfully logged in!");
    } else {
      alert("Please fill in both email and password.");
    }
  } else {
    if (username && email && password) {
      alert("Account created successfully!");
    } else {
      alert("Please fill in all fields.");
    }
  }
};

 return (
   <div className="signup-container">
     <div className="signup-header">
     <Link to="/">
          <button className="back-button">← Go Back ←</button>
        </Link>     
       <div className = "text">{action}</div>
       <div className = "underline"></div>
     </div>
     <div className ="inputs">
     {action === "Sign Up" && (
        <div className="input">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
      )}
      <div className="input">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="input">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
     <div className="forgot-password">Forgotten Password? <span>Click here</span>
     </div>
     <div className="submit_container">
          <div
            className={action === "Log In" ? "submit gray" : "submit"}
            onClick={() => setAction("Sign Up")}
          >
            Sign Up
          </div>
          <div
            className={action === "Sign Up" ? "submit gray" : "submit"}
            onClick={() => setAction("Log In")}
          >
            Log In
          </div>
        </div>

        <button className="submit" onClick={handleSubmit}>
          {action}
        </button>
      </div>
    </div>
  );
};

export default SignUp;
