const express = require("express");
const app = express();
const path = require("node:path");
const router = require("./routes/router");
const passport = require("passport");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } =  require('@prisma/client');
const prisma = new PrismaClient();
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;

require("dotenv").config();

const PORT = process.env.PORT;

app.use(express.urlencoded({extended:false}));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


app.use("/", router);
app.use("/register", router);

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
    }),
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
})
);

app.use(passport.session());


app.use(express.static(path.join(__dirname,"public")));

app.listen(PORT , () => console.log(`App listening on port ${PORT}`));