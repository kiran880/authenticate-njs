const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const path = require("path");
const app = express();
const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running...");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
//App1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const selectUserQuery = `
    SELECT * 
    FROM user
    WHERE username= '${username}';
  `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (`${password}`.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = `
     INSERT INTO user(username,name,password,gender,location)
     VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');
    `;
      await db.run(query);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
//App2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT * 
    FROM user
    WHERE username= '${username}';
  `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isCorrectPassword = await bcrypt.compare(password, dbUser.password);
    if (isCorrectPassword) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//App3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `
    SELECT * 
    FROM user
    WHERE username= '${username}';
  `;
  const dbUser = await db.get(selectUserQuery);
  const isCorrectPassword = await bcrypt.compare(
    `${oldPassword}`,
    dbUser.password
  );
  if (isCorrectPassword) {
    if (`${newPassword}`.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword2 = await bcrypt.hash(newPassword, 10);
      const query = `
     UPDATE user
     SET password= '${hashedPassword2}'
     WHERE username= '${username}';
    `;
      await db.run(query);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
