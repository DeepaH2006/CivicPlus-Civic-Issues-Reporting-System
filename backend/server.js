const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const User = require("./models/User");
const Complaint = require("./models/Complaint");

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests from Postman / server-side tools / same-origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Increase request payload limit
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Test route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Register API
app.post("/register", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.send("User registered");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Login API
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Submit complaint API
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

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (err) {
    console.error("Complaint save error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Get all complaints
app.get("/complaints", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error("Fetch complaints error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update complaint status
app.patch("/complaints/:id/status", async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update complaint assignment or status
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
      { new: true }
    );

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Seed demo users
app.get("/seed", async (req, res) => {
  try {
    await User.deleteMany();

    await User.insertMany([
      { name: "Admin", email: "admin@gmail.com", password: "admin123", role: "Admin" },
      { name: "Citizen 1", email: "citizen@gmail.com", password: "123456", role: "Citizen" },
      { name: "Citizen 2", email: "citizen2@gmail.com", password: "123456", role: "Citizen" },
      { name: "Arun (Water)", email: "water@gmail.com", password: "123456", role: "Field Staff" },
      { name: "Priya (Sanitation)", email: "garbage@gmail.com", password: "123456", role: "Field Staff" },
      { name: "Kumar (Roads)", email: "road@gmail.com", password: "123456", role: "Field Staff" },
      { name: "Lakshmi (Electrical)", email: "electrical@gmail.com", password: "123456", role: "Field Staff" }
    ]);

    res.send("Demo users added");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database Connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.log("❌ Database connection error:");
    console.log(err.message);
  }
}

startServer();