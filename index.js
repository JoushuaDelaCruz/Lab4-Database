require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const port = process.env.PORT || 3000;
const app = express();
const bcrypt = require("bcrypt");
const saltRounds = 12;

app.use(express.urlencoded({ extended: false }))
const expireTime = 1 * 60 * 60 * 1000;

var users = []

/* secret information section */
const mongodb_user = process.env.MONGODB_USERNAME;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGO_SECRET_SESSIONS;

const node_session_secret = process.env.NODE_SESSIONS_SECRET
var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@database.dqrkyqg.mongodb.net/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
})

app.use(session({
    secret: node_session_secret,
    store: mongoStore, //default is memory store 
    saveUninitialized: false,
    resave: true
}
));

app.get("/", (req, res) => {
    if (!req.session.authenticated) {
        var html = `<h1> Welcome! </h1>
                <form action='/logIn' method='GET'>
                        <button>Login</button>
                </form>
                <form action='/signUp' method='GET'>
                        <button>Sign up</button>
                </form>`
        res.send(html);
    } else {
        for (i = 0; i < users.length; i++) {
            if (users[i].email == req.session.email) {
                var name = users[i].name
            }
        }
        var html = `
        <h2> Hello, ${name} </h2>
        <form action='/members' method='GET'>
            <button>Go to Members Area</button>
        </form>
        <form action='/signOut' method='POST'>
            <button type='submit'>Log out</button>
        </form>
        `;
        res.send(html)
    }
})

app.post('/signOut', (req, res) => {
    req.session.destroy();
    res.redirect("/")
})

app.get('/logIn', (req, res) => {
    var msg = req.query.msg
    var html = `
    <h2> Log In </h2>
    <form action='/loggingIn' method='post'>
    <br>
    <input name='email' type='text' placeholder='email'>
    <br>
    <input name='password' type='password' placeholder='password'>
    <br>
    <button>Submit</button>
    </form>
    <h2> Log In </h2>
    <form action='/signUp' method='post'>
    No Account yet? <button>Sign Up</button>
    </form>
    `;
    if (msg) {
        html += msg + "<br> <img src='/userNotFound.gif' style='width:300px;'>"
    }
    res.send(html);
});

app.get("/members", (req, res) => {
    if (!req.session.authenticated) {
        res.redirect("/");
    }
    let randomNumber = Math.floor(Math.random() * 3) + 1
    var html;
    for (i = 0; i < users.length; i++) {
        if (users[i].email == req.session.email) {
            var name = users[i].name
        }
    }
    if (randomNumber == 1) {
        html = `<h1> He said, 'Hi, ${name}!': </h1> <img src='/heyy.gif' style='width:250px;'>`
    } else if (randomNumber == 2) {
        html = `<h1> Isn't he a cutey, ${name}?!</h1> <img src='/winkey.gif' style='width:250px;'> `
    } else {
        html = `<h1> Hey ${name}: </h1> <img src='/heyy.gif' style='width:250px;'>`
    }
    html += `<form action='/signOut' method='POST'>
            <button type='submit'>Log out</button>
            </form>
            <form action="/" method="GET">
            <button>Homepage</button>
            </form>`
    res.send(html)
})

app.post('/loggingIn', (req, res) => {
    var email = req.body.email;
    var password = req.body.password;


    var usershtml = "";
    for (i = 0; i < users.length; i++) {
        if (users[i].email == email) {
            if (bcrypt.compareSync(password, users[i].password)) {
                req.session.authenticated = true;
                req.session.email = email;
                req.session.cookie.maxAge = expireTime;

                res.redirect('/');
                return;
            }
        }
    }
    msg = "User and Password not found"
    //user and password combination not found
    res.redirect(`/logIn?msg=${msg}`);
});

app.get('/loggedIn', (req, res) => {
    if (!req.session.authenticated) {
        res.redirect('/login');
    }
    var html = `
    You are logged in!
    `;
    res.send(html);
});


app.get('/signUp', (req, res) => {
    var msg = req.query.msg
    var html = `
    <h3> Create a User </h3>
    <form action='/submitUser' method='post'>
    <input name='name' type='text' placeholder='Name'>
    <br>
    <input name='email' type='text' placeholder='Email'>
    <br>
    <input name='password' type='password' placeholder='Password'>
    <br>
    <button>Submit</button>
    <br>
    </form>
    <form action="/" method="GET">
    <button>Homepage</button>
    </form>
    `;

    if (msg) {
        html += msg
        html += "<br> <img src='/angry.gif' style='width:300px;'>"
    }

    res.send(html);
});

app.post('/submitUser', (req, res) => {
    var name = req.body.name
    var email = req.body.email;
    var password = req.body.password;
    if (!name || !email || !password) {
        let message = "<h4 style='color:red;'> Please provide the following fields: <h4> <ul>"
        if (!name) {
            message += "<li> Name </li>"
        }
        if (!email) {
            message += "<li> email </li>"
        }
        if (!password) {
            message += "<li> Password </li>"
        }
        message += "</ul>"
        res.redirect(`/signUp?msg=${message}`)
    }

    var hashedPassword = bcrypt.hashSync(password, saltRounds)

    users.push({ name: name, email: email, password: hashedPassword });

    console.log(users);

    res.redirect('/logIn');
});

app.get("/dog/:id", (req, res) => {
    var dog = req.params.id;

    switch (parseInt(dog)) {
        case 1: res.send("He said, 'Hi!':  <img src='/heyy.gif' style='width:250px;'>")
        case 2: res.send("Isn't he cute?!:  <img src='/winkey.gif' style='width:250px;'>")
        default: res.send(`Invalid dog id: ${dog}`)
    }
})

app.use(express.static(__dirname + "/public"))

app.get("*", (req, res) => {
    res.status(404)
    res.send("<h2 style='color: red;'> Page not Found - 404 </h2> <img src='/error.gif' style='width:250px;'>")
})

app.listen(port, () => {
    console.log("Node application listening to port " + port)
})