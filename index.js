require("./utils");
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const port = process.env.PORT || 3000;
const app = express();
const bcrypt = require("bcrypt");
const saltRounds = 12;

const database = include("databaseConnection");
const db_utils = include("database/db_utils");
const db_users = include("database/user");
const db_tasks = include("database/task");
const success = db_utils.printMySQLVersion();

app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

const expireTime = 1 * 60 * 60 * 1000;

var users = [];

/* secret information section */
const mongodb_user = process.env.MONGODB_USERNAME;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGO_SECRET_SESSIONS;

const node_session_secret = process.env.NODE_SESSIONS_SECRET;
var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@database.dqrkyqg.mongodb.net/sessions`,
  crypto: {
    secret: mongodb_session_secret,
  },
});

app.use(
  session({
    secret: node_session_secret,
    store: mongoStore, //default is memory store
    saveUninitialized: false,
    resave: true,
  })
);

app.get("/", (req, res) => {
  if (!req.session.authenticated) {
    res.render("index");
  } else {
    res.render("member", {
      name: req.session.username,
      user_type: req.session.user_type,
    });
  }
});

app.post("/signOut", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/logIn", (req, res) => {
  var msg = req.query.msg;
  res.render("login", { msg: msg });
});

app.get("/admin", async (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  if (req.session.user_type == "user") {
    res.redirect("/todos");
    return;
  }
  const users = await db_users.getAllUsers(req.session.user_id);
  res.render("admin", { name: req.session.username, users: users });
});

app.get("/members", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
  }
  let randomNumber = Math.floor(Math.random() * 4 + 1);
  res.render("lounge", { name: req.session.username, number: randomNumber });
});

app.post("/loggingIn", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const user = await db_users.getUser(username);
  console.log(user);

  if (user) {
    if (bcrypt.compareSync(password, user.password)) {
      req.session.authenticated = true;
      req.session.username = user.username;
      req.session.user_id = user.user_id;
      req.session.user_type = user.user_type;
      req.session.cookie.maxAge = expireTime;

      res.redirect("/loggedIn");
      return;
    }
  }
  msg = "Username and Password not found";
  //user and password combination not found
  res.redirect(`/logIn?msg=${msg}`);
});

app.get("/users/:user_id", async (req, res) => {
  const user_id = req.params.user_id;

  if (!req.session.authenticated || req.session.user_type == "user") {
    res.redirect("/");
    return;
  }
  const username = await db_users.getUserById(user_id);
  const tasks = await db_tasks.getTasks(user_id);

  console.log(username.username, tasks);

  res.render("users", {
    user: username.username,
    tasks: tasks,
    name: req.session.username,
  });
});

app.get("/todos", async (req, res) => {
  const empty = req.query.empty;
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  }
  if (req.session.user_type === "admin") {
    res.redirect("/admin");
    return;
  }
  const tasks = await db_tasks.getTasks(req.session.user_id);

  res.render("tasks", {
    name: req.session.username,
    empty: empty,
    tasks: tasks,
  });
});

app.post("/addTask", async (req, res) => {
  const user_id = req.session.user_id;
  const description = req.body.task;
  if (description === "") {
    res.redirect("/todos?empty=true");
    return;
  }
  await db_tasks.createTask({
    user_id: user_id,
    description: description,
  });
  res.redirect("/todos");
});

app.get("/loggedIn", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/login");
    return;
  }
  if (req.session.user_type === "admin") {
    res.redirect("/admin");
  }
  if (req.session.user_type === "user") {
    res.redirect("/todos");
  }
});

app.get("/signUp", async (req, res) => {
  let msg = req.query.msg;
  let usernameNotUnique = req.query.usernameNotUnique;
  if (msg) {
    msg = JSON.parse(decodeURIComponent(msg));
  }
  res.render("signUp", { msg: msg, userNotUnique: usernameNotUnique });
});

app.post("/submitUser", async (req, res) => {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  let message = [];
  if (!name || !email || !password) {
    if (!name) {
      message.push("Name");
    }
    if (!email) {
      message.push("Email");
    }
    if (!password) {
      message.push("Password");
    }
    message = encodeURIComponent(JSON.stringify(message));
    res.redirect(`/signUp?msg=${message}`);
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  const success = await db_users.createUser({
    name: name,
    email: email,
    password: hashedPassword,
  });

  if (success) {
    res.redirect("/login");
  } else {
    res.redirect(`/signUp?usernameNotUnique=${true}`);
  }
});

app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
  res.status(404);
  res.render("404");
});

app.listen(port, () => {
  console.log("Node application listening to port " + port);
});
