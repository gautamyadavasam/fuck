// Load environment variables
require("dotenv").config();

// Import required modules
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Allow form data parsing
app.use(cors());
app.set("view engine", "ejs");

// Serve static files from "public" directory
app.use(express.static("public"));

// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root123",
    database: "ngo_db",
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed: " + err.message);
        process.exit(1);
    }
    console.log("✅ MySQL Connected...");
});

// Setup multer for profile picture uploads
const storage = multer.diskStorage({
    destination: "public/uploads/", // Save images in public/uploads
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
        return cb(null, true);
    } else {
        return cb(new Error("Only images are allowed!"));
    }
};

// Initialize multer upload
const upload = multer({ storage, fileFilter });

/** 
 * User Registration with Image Upload 
 */
app.post("/register", upload.single("profile_pic"), async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const profilePic = req.file ? req.file.filename : null; // Save filename

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO users (name, email, phone, password, profile_pic) VALUES (?, ?, ?, ?, ?)",
            [name, email, phone, hashedPassword, profilePic],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "✅ User registered successfully!" });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** 
 * Serve Profile Picture (Access Images by URL) 
 */
app.get("/uploads/:filename", (req, res) => {
    res.sendFile(path.join(__dirname, "public/uploads", req.params.filename));
});

/** 
 * User Login
 */
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
        if (err || result.length === 0) return res.status(400).json({ error: "User not found" });

        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token, user });
    });
});

/** 
 * Get User Profile 
 */
app.get("/profile/:id", (req, res) => {
    db.query("SELECT * FROM users WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result[0]);
    });
});

/** 
 * Make a Donation
 */
app.post("/donate", (req, res) => {
    const { user_id, amount, payment_method, transaction_id } = req.body;

    db.query(
        "INSERT INTO donations (user_id, amount, payment_method, transaction_id) VALUES (?, ?, ?, ?)",
        [user_id, amount, payment_method, transaction_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "✅ Donation successful!" });
        }
    );
});

/** 
 * Get All Donations (with User Details) 
 */
app.get("/donations", (req, res) => {
    db.query(
        "SELECT users.name, users.profile_pic, donations.amount, donations.payment_method, donations.donated_at FROM donations JOIN users ON donations.user_id = users.id ORDER BY donations.donated_at DESC",
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(result);
        }
    );
});

/** 
 * Default Route 
 */
app.get("/", (req, res) => {
    res.send("🌍 Welcome to the NGO Website Backend!");
});

/** 
 * Start Server 
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
