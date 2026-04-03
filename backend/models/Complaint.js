/*const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema({
  userId: { type: String, default: "" },
  userName: { type: String, default: "" },
  category: { type: String, default: "" },
  description: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  priority: { type: String, default: "Medium" },
  status: { type: String, default: "Pending" },
  department: { type: String, default: "General" },
  assignedStaff: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});*/

const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  category: String,
  description: String,
  imageUrl: String,
  latitude: Number,
  longitude: Number,
  priority: String,
  status: { type: String, default: "Pending" },
  department: String,
  assignedStaff: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Complaint", ComplaintSchema);