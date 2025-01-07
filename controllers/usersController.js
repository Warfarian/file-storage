// prisma stuff 

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();  
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcryptjs");
const fileUpload = require("express-fileupload");
const { createClient } = require('@supabase/supabase-js');
require("dotenv").config();
const supabase = require('../config/supabase'); 
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

async function fileHandler(req, res) {
  try {
    const { folderId } = req.query;
    
    // Validate folderId
    if (!folderId || isNaN(parseInt(folderId))) {
      return res.status(400).json({ error: "Invalid folder ID" });
    }

    // File validation
    if (!req.files?.uploadedFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.files.uploadedFile;
    
    // Basic file validation
    if (!file.name || !file.data) {
      return res.status(400).json({ error: "Invalid file format" });
    }

    // Create safe filename
    const fileExtension = file.name.split('.').pop();
    const safeFileName = `${Date.now()}_${Buffer.from(file.name).toString('base64')}`;
    const fileName = `${safeFileName}.${fileExtension}`;
    const filePath = `${folderId}/${fileName}`;

    // Upload to Supabase
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("file_storage")
      .upload(filePath, file.data, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res.status(500).json({
        error: "Failed to upload file to storage",
      });
    }

    // Get public URL
    const { data: publicUrlData, error: urlError } = await supabase.storage
      .from("file_storage")
      .getPublicUrl(filePath);

    if (urlError) {
      console.error("Public URL error:", urlError);
      return res.status(500).json({
        error: "Failed to generate public URL",
      });
    }

    // Create database entry
    try {
      // Create new file entry
      await prisma.file.create({
        data: {
          fileURL: publicUrlData.publicUrl,
          size: file.size,
          folder: {
            connect: {
              folderId: parseInt(folderId)
            }
          }
        }
      });

      // Fetch all files in the folder
      const allFiles = await prisma.file.findMany({
        where: {
          folderId: parseInt(folderId)
        },
        orderBy: {
          fileId: 'desc'  // Show newest files first
        }
      });

      // Get original filenames from fileURLs
      const files = allFiles.map(dbFile => {
        // Extract the base64 encoded filename from the URL
        const urlParts = dbFile.fileURL.split('/');
        const encodedFileName = urlParts[urlParts.length - 1].split('_')[1]?.split('.')[0];
        let originalName = '';
        
        try {
          // Decode the base64 filename
          originalName = Buffer.from(encodedFileName, 'base64').toString();
        } catch (e) {
          originalName = "Unknown filename";
        }

        return {
          name: originalName,
          size: dbFile.size,
          uploadedAt: new Date().toISOString(),
          fileURL: dbFile.fileURL
        };
      });
      
      // Return success response with all files
      return res.render("viewFolder", {
        folderId,
        files
      });

    } catch (prismaError) {
      console.error("Database error:", prismaError);
      // If database entry fails, we should clean up the uploaded file
      await supabase.storage
        .from("file_storage")
        .remove([filePath]);
        
      return res.status(500).json({
        error: "Failed to save file information",
      });
    }

  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({
      error: "An unexpected error occurred",
    });
  }
}

async function createFolder(req,res) {
  const { folderName } = req.body;
  const username = req.user.username;
  const user = await prisma.user.findUnique({where:{username:username}});
  const folder = await prisma.folder.create({
    data: {
      createdAt: new Date(new Date() - 3600 * 1000 * 3).toISOString(), 
      folderName: folderName,
      user: {
        connect: {
          id: user.id, 
        },
      },
    },
  });
  
  res.redirect("showFolders")
}

async function showFolders(req,res) {
  const userId = req.user.id;
  const folders = await prisma.folder.findMany({
    where:{
      userId: userId
    }
  })
  
    res.render("showFolders",{folders:folders})
}

async function deleteFolders(req,res) {
  const userId = req.user.id;
  const { folderId } = req.body;
  const deleteFolder = await prisma.folder.delete({
    where:{
      folderId: parseInt(folderId)
    }
  })
  res.redirect("showFolders");
}

async function updateFolder(req, res) {
  const { folderId, folderName } = req.body;  // The folderId and folderName are sent in the body
  
  const folder = await prisma.folder.findUnique({
    where: { folderId: parseInt(folderId) },
  });

  if (folder) {
    // Update the folder's name
    await prisma.folder.update({
      where: { folderId: parseInt(folderId) },
      data: { folderName: folderName },
    });

    // After update, redirect back to the showFolders page
    res.redirect("/showFolders");
  } else {
    res.status(404).send("Folder not found");
  }
}

async function renderUpdateFolderForm(req, res) {
  const { folderId } = req.body;
  const folder = await prisma.folder.findUnique({
    where: { folderId: parseInt(folderId) }
  });
  
  if (folder) {
    res.render("updateFolderDetails", { folder: folder });
  } else {
    res.status(404).send("Folder not found");
  }
}

async function viewFolder(req, res) {
  const { folderId } = req.query;
  
  try {
    // Fetch all files in the folder
    const allFiles = await prisma.file.findMany({
      where: {
        folderId: parseInt(folderId)
      },
      orderBy: {
        fileId: 'desc'  // Show newest files first
      }
    });

    // Get original filenames from fileURLs
    const files = allFiles.map(dbFile => {
      // Extract the base64 encoded filename from the URL
      const urlParts = dbFile.fileURL.split('/');
      const encodedFileName = urlParts[urlParts.length - 1].split('_')[1]?.split('.')[0];
      let originalName = '';
      
      try {
        // Decode the base64 filename
        originalName = Buffer.from(encodedFileName, 'base64').toString();
      } catch (e) {
        originalName = "Unknown filename";
      }

      return {
        name: originalName,
        size: dbFile.size,
        uploadedAt: new Date().toISOString(),
        fileURL: dbFile.fileURL
      };
    });

    res.render("viewFolder", {
      folderId: folderId,
      files: files
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).send("Error fetching files");
  }
}

module.exports = { renderLoginForm, renderRegisterForm, createUser, fileHandler, createFolder, showFolders, deleteFolders,viewFolder, updateFolder, renderUpdateFolderForm}