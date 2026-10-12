
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const User = require("./models/User");
const Complaint = require("./models/Complaint");

dotenv.config();

const app = express();

// Verification codes for demo/testing.
// In production, set these in your backend .env file.
const ADMIN_VERIFICATION_CODE =
  process.env.ADMIN_VERIFICATION_CODE || "CP-ADMIN-2026";

const STAFF_VERIFICATION_CODE =
  process.env.STAFF_VERIFICATION_CODE || "CP-STAFF-2026";

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
  "https://civic-plus-civic-issues-reporting-s.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman and server-to-server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Test route
app.get("/", (req, res) => {
  res.send("CivicPlus Server is running");
});

// ==================================================
// REGISTER API — WITH SERVER-SIDE CODE VALIDATION
// ==================================================
app.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      verificationCode,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required",
      });
    }

    // Validate role
    const allowedRoles = ["Citizen", "Admin", "Field Staff"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    // Validate Government Admin verification code
    if (
      role === "Admin" &&
      verificationCode !== ADMIN_VERIFICATION_CODE
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid Government Admin Verification Code",
      });
    }

    // Validate Field Staff verification code
    if (
      role === "Field Staff" &&
      verificationCode !== STAFF_VERIFICATION_CODE
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid Field Staff Verification Code",
      });
    }

    // Check if email is already registered
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // IMPORTANT:
    // Save only user fields, never save the verification code.
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
    });

    await user.save();

    // Do not return the password to the client
    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error("Registration error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "Registration failed",
    });
  }
});

// ==================================================
// LOGIN API
// ==================================================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email?.trim().toLowerCase(),
      password,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.json({
      success: true,
      user: safeUser,
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================================================
// SUBMIT COMPLAINT API
// ==================================================
app.post("/complaint", async (req, res) => {
  try {
    console.log("Received complaint:", req.body);

    const { category } = req.body;
    const normalizedCategory = category?.trim().toLowerCase();

    let department = "General";
    let assignedStaff = "";

    if (normalizedCategory === "garbage") {
      department = "Sanitation";
      assignedStaff = "garbage@gmail.com";
    } else if (normalizedCategory === "water issue") {
      department = "Water";
      assignedStaff = "water@gmail.com";
    } else if (normalizedCategory === "pothole") {
      department = "Road";
      assignedStaff = "road@gmail.com";
    } else if (
      normalizedCategory === "streetlight" ||
      normalizedCategory === "street light"
    ) {
      department = "Electrical";
      assignedStaff = "electrical@gmail.com";
    }

    const complaint = new Complaint({
      ...req.body,
      department,
      assignedStaff,
      status: req.body.status || "Pending",
    });

    await complaint.save();

    console.log("COMPLAINT SAVED TO MONGODB:");
    console.log({
      id: complaint._id,
      userId: complaint.userId,
      userName: complaint.userName,
      userEmail: complaint.userEmail,
      category: complaint.category,
      department: complaint.department,
      assignedStaff: complaint.assignedStaff,
      status: complaint.status,
    });

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (err) {
    console.error("Complaint save error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================================================
// GET ALL COMPLAINTS
// ==================================================
app.get("/complaints", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({
      createdAt: -1,
    });

    return res.json(complaints);
  } catch (err) {
    console.error("Fetch complaints error:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
});

// ==================================================
// UPDATE COMPLAINT STATUS
// ==================================================
app.patch("/complaints/:id/status", async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    return res.json({
      success: true,
      complaint,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================================================
// UPDATE COMPLAINT ASSIGNMENT OR STATUS
// ==================================================
app.patch("/complaints/:id", async (req, res) => {
  try {
    const updateData = {};

    if (req.body.status !== undefined) {
      updateData.status = req.body.status;
    }

    if (req.body.assignedStaff !== undefined) {
      updateData.assignedStaff = req.body.assignedStaff;
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    return res.json({
      success: true,
      complaint,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==================================================
// SEED DEMO USERS
// ==================================================
app.get("/seed", async (req, res) => {
  try {
    await User.deleteMany();

    await User.insertMany([
      {
        name: "Admin",
        email: "admin@gmail.com",
        password: "admin123",
        role: "Admin",
      },
      {
        name: "Citizen 1",
        email: "citizen@gmail.com",
        password: "123456",
        role: "Citizen",
      },
      {
        name: "Citizen 2",
        email: "citizen2@gmail.com",
        password: "123456",
        role: "Citizen",
      },
      {
        name: "Arun (Water)",
        email: "water@gmail.com",
        password: "123456",
        role: "Field Staff",
      },
      {
        name: "Priya (Sanitation)",
        email: "garbage@gmail.com",
        password: "123456",
        role: "Field Staff",
      },
      {
        name: "Kumar (Roads)",
        email: "road@gmail.com",
        password: "123456",
        role: "Field Staff",
      },
      {
        name: "Lakshmi (Electrical)",
        email: "electrical@gmail.com",
        password: "123456",
        role: "Field Staff",
      },
    ]);

    return res.send("Demo users added");
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

// ==================================================
// CONNECT TO MONGODB AND START SERVER
// ==================================================
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from backend environment");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Database Connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup error:", err.message);
  }
}

startServer();
