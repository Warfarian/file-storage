const express = require("express");
const app = express();
const path = require("node:path");
const router = require("./routes/router");
const passport = require("passport");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } =  require('@prisma/client');
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;

require("dotenv").config();

const PORT = process.env.PORT;

app.use(express.urlencoded({extended:false}));


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

app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try{
            const user = await prisma.user.findUnique({where: {
                username
            }});
            if (!user){
                return done(null,false, {message:"Incorrect username"});
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid){
                return done(null, false, {message:"Incorrect password"});
            }
            return done(null,user);
        }catch(err){
            return done(err);
        }
    })
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});




app.use(express.static(path.join(__dirname,"public")));

// views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//routes
  app.use("/", router);
  app.use("/register", router);
  app.use("/home", router);
app.use("/logout",(req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  })
  
app.get("/log-out", );



app.listen(PORT , () => console.log(`App listening on port ${PORT}`));