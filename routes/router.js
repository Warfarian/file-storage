const { Router } = require("express");
const router = Router();
const usersController = require("../controllers/usersController");


router.get("/",usersController.renderLoginForm );   
router.get("/register", usersController.renderRegisterForm);  
router.post("/", usersController.loginUser); 
router.post("/register", usersController.createUser); 

module.exports = router;
