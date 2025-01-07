
// prisma stuff 

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();  
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcryptjs");
const fileUpload = require("express-fileupload");
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

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

function fileHandler(req,res) {
    
}

function fileDownloader(req, res) {
    // const filePath = __dirname + "/uploads/sample.txt"; 
    // res.download(filePath, function (err) {
    //     if (err) {
    //         console.log(err);
    //         res.status(500).send("Failed to download the file.");
    //     }
    // });
}

async function createFolder(req,res) {
  const { folderName } = req.body;
  const username = req.user.username;
  const user = await prisma.user.findUnique({where:{username:username}});
  const folder = await prisma.folder.create({
    data: {
      createdAt: new Date(new Date() - 3600 * 1000 * 3).toISOString(), 
      user: {
        connect: {
          id: user.id, 
        },
      },
    },
  });
  
  res.render("upload", {username: username})
}


module.exports = { renderLoginForm, renderRegisterForm, createUser, fileHandler,fileDownloader, createFolder}