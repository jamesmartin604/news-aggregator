import React, { useState } from "react";
import { Link } from "react-router-dom";

const SignUp = () => {
  const [action, setAction] = useState("Sign Up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const isDarkMode = JSON.parse(localStorage.getItem("isDarkMode"));

  const enterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const usersBefore = localStorage.getItem("users");
    const users = usersBefore ? JSON.parse(usersBefore) : [];

    if (action === "Log In") {
      const matchingUser = users.find(
        (user: any) => user.username === username && user.password === password
      );

      if (matchingUser) {
        alert("Successfully logged in!");
      } else {
        alert("Wrong username or password. Try again or sign in first.");
      }
    } else {
      const usernameExists = users.some(
        (user: any) => user.username === username
      );

      if (usernameExists) {
        alert("Username taken. Please choose another.");
        return;
      }

      if (username && email && password) {
        const newUser = { username, email, password };
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));
        alert("Account created successfully!");
        setAction("Log In");
        setUsername("");
        setEmail("");
        setPassword("");
      } else {
        alert("Please fill in all fields.");
      }
    }
  };
  return (
    <div className={`signup-body ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      <div className="signup-container">
        <div className="signup-header">
          <Link to="/">
            <button className="back-button">← Go Back ←</button>
          </Link>
          <div className="text">{action}</div>
          <div className="underline"></div>
        </div>
        <div className="inputs">
          {action === "Sign Up" && (
            <div className="input">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={enterKey}
              />
            </div>
          )}
          <div className="input">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={enterKey}
            />
          </div>

          <div className="input">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={enterKey}
            />
          </div>
          <div className="submit-container">
            <div className="TwoButtons">
              <div
                className={action === "Log In" ? "submit" : "submit gray"}
                onClick={() => setAction("Sign Up")}
              >
                New User
              </div>
              <div
                className={action === "Sign Up" ? "submit" : "submit gray"}
                onClick={() => setAction("Log In")}
              >
                Returning User
              </div>
            </div>
            <button className="submit" onClick={handleSubmit}>
              {action}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
