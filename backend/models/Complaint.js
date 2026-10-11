
const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: "",
  },

  userName: {
    type: String,
    default: "",
  },

  userEmail: {
    type: String,
    default: "",
  },

  category: {
    type: String,
    default: "",
  },

  description: {
    type: String,
    default: "",
  },

  imageUrl: {
    type: String,
    default: "",
  },

  // Manually entered or GPS-derived address
  address: {
    type: String,
    default: "",
    trim: true,
  },

  // GPS coordinates; null when unavailable
  latitude: {
    type: Number,
    default: null,
  },

  longitude: {
    type: Number,
    default: null,
  },

  // Indicates how the location was selected
  locationSource: {
    type: String,
    enum: ["gps", "manual", "map", ""],
    default: "",
  },

  // GPS accuracy in meters, if available
  locationAccuracy: {
    type: Number,
    default: null,
  },

  priority: {
    type: String,
    default: "Medium",
  },

  status: {
    type: String,
    default: "Pending",
  },

  department: {
    type: String,
    default: "General",
  },

  assignedStaff: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Complaint", ComplaintSchema);
