const { Router } = require("express");
const router = Router();
const passport = require("passport");
const usersController = require("../controllers/usersController");

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
router.get("/showFolders", usersController.showFolders); 
router.get("/viewFolder", usersController.viewFolder); 
router.get("/upload", usersController.fileHandler);
router.post("/updateFolderDetails", usersController.renderUpdateFolderForm);
router.post("/updateFolder", usersController.updateFolder);
router.post("/showFolders", usersController.deleteFolders); 
router.post("/register", usersController.createUser); 
router.post("/upload", usersController.fileHandler); 
router.post("/newFolder", usersController.createFolder); 

module.exports = router;
