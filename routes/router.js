const { Router } = require("express");
const router = Router();
const passport = require("passport");
const usersController = require("../controllers/usersController");
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

router.post("/", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/"
  }));

function isAuthenticated (req,res,next){
    if (req.isAuthenticated()){
        return next();
    }
    res.redirect("/");  
}


router.get("/",usersController.renderLoginForm );   
router.get("/home",isAuthenticated, (req,res) => {
    res.render("home")
});   
router.get("/register", usersController.renderRegisterForm); 
router.post("/register", usersController.createUser); 
// router.post("/upload", upload.single("uploadedFile")); 
router.post("/newFolder", usersController.createFolder); 

module.exports = router;
