
// prisma stuff 

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();  
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcryptjs");

function renderLoginForm(req,res){
    res.render("login");
}

function renderRegisterForm(req,res){
    res.render("register");
}

function hashPassword(password) {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(10, function (err, salt) {
        if (err) {
          reject(err);
          return;
        }
  
        bcrypt.hash(password, salt, function (err, hash) {
          if (err) {
            reject(err);
            return;
          }
          resolve(hash);
        });
      });
    });
  }

async function createUser(req,res) {
    let id = uuidv4();
    const { username, email, password } = req.body;
    let hash = await hashPassword(password);
    console.log(id, username, email);
    const users = await prisma.user.create({
        data: {
            id : id,
            username: username,
            email: email,
            password: hash
        },
    });
    res.redirect("/");
}


async function loginUser(req,res) {
    const { username,password } = req.body;
    const dbUser = await prisma.user.findUnique({
        where:{
            username: username
        },
    });
    let isMatch = await bcrypt.compare(password, dbUser.password);
    if (isMatch){
        console.log(isMatch);
        console.log("Passwords match! Logging in");
        res.render("home")
    }
    else{
        console.log(isMatch);
        console.log("Error logging in, check password")
    }
}

module.exports = { renderLoginForm, renderRegisterForm, createUser, loginUser}