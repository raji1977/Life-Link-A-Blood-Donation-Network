// ======== LifeLink Blood Donation Server.js ========
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(express.json());

// ====== MongoDB Connection ======
mongoose
  .connect("mongo DB Atlas connection string here", {)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ====== Schemas ======
const donorSchema = new mongoose.Schema({
  name: String,
  blood_group: String,
  last_donation: Date,
  health_conditions: [String],
  email: String,
  phone: String,
});

const requestSchema = new mongoose.Schema({
  hospital: String,
  blood_group: String,
  units: Number,
  priority: String,
  location: String,
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

const matchSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "Donor" },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
  matchedAt: { type: Date, default: Date.now },
});

const Donor = mongoose.model("Donor", donorSchema);
const Request = mongoose.model("Request", requestSchema);
const MatchHistory = mongoose.model("MatchHistory", matchSchema);

// ====== Email & SMS Credentials (Direct) ======
const EMAIL_USER = "email of your gmail account here";
const EMAIL_PASS = ""; // App password
const TWILIO_SID = "";
const TWILIO_AUTH = "";
const TWILIO_NUMBER = "+XXXXXxxxxx"; // Replace with valid Twilio number

// ====== Setup Mail + Twilio ======
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

const twilioClient = twilio(TWILIO_SID, TWILIO_AUTH);

// ====== Health Check ======
app.get("/", (req, res) => {
  res.json({ message: "🩸 LifeLink Blood Donation Server is Active!" });
});

// ====== Donor Register ======
app.post("/donor-register", async (req, res) => {
  try {
    const { name, blood_group, last_donation, health_conditions, email, phone } = req.body;
    const donor = new Donor({ name, blood_group, last_donation, health_conditions, email, phone });
    await donor.save();
    res.json({ message: "✅ Donor registered successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Failed to register donor." });
  }
});

// ====== Eligible Donors ======
app.get("/eligible-donors", async (req, res) => {
  try {
    const donors = await Donor.find();
    const eligible = donors.filter((d) => {
      const last = new Date(d.last_donation);
      const diff = (new Date() - last) / (1000 * 60 * 60 * 24);
      return diff > 90 && !d.health_conditions.includes("defer");
    });
    res.json(eligible);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Error fetching eligible donors." });
  }
});

// ====== Create Blood Request ======
app.post("/api/requests", async (req, res) => {
  try {
    const { hospital, blood_group, units, priority, location } = req.body;
    const newRequest = new Request({ hospital, blood_group, units, priority, location });
    await newRequest.save();

    // Notify eligible donors
    const donors = await Donor.find({ blood_group });
    const eligible = donors.filter((d) => {
      const diff = (new Date() - new Date(d.last_donation)) / (1000 * 60 * 60 * 24);
      return diff > 90 && !d.health_conditions.includes("defer");
    });

    for (const donor of eligible) {
      if (donor.email) {
        await transporter.sendMail({
          from: EMAIL_USER,
          to: donor.email,
          subject: "Urgent Blood Requirement - LifeLink",
          text: `Dear ${donor.name},\n\nA hospital (${hospital}) needs ${units} units of ${blood_group} blood urgently.\nPriority: ${priority}\nLocation: ${location}\n\nPlease consider donating.\n– LifeLink Team`,
        });
      }

      if (donor.phone && TWILIO_NUMBER.length > 2) {
        await twilioClient.messages.create({
          from: TWILIO_NUMBER,
          to: donor.phone,
          body: `Urgent: ${units} units of ${blood_group} blood needed at ${hospital}, ${location}. Priority: ${priority}. – LifeLink`,
        });
      }

      const match = new MatchHistory({ donorId: donor._id, requestId: newRequest._id });
      await match.save();
    }

    res.json({ message: "🩸 Request created and notifications sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Failed to create request." });
  }
});

// ====== Get All Requests ======
app.get("/api/requests", async (req, res) => {
  const requests = await Request.find().sort({ createdAt: -1 });
  res.json(requests);
});

// ====== Smart Match ======
app.post("/api/smart-match", async (req, res) => {
  const { blood_group } = req.body;
  try {
    const donors = await Donor.find({ blood_group });
    const eligible = donors.filter((d) => {
      const diff = (new Date() - new Date(d.last_donation)) / (1000 * 60 * 60 * 24);
      return diff > 90 && !d.health_conditions.includes("defer");
    });
    res.json({ matches: eligible });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Smart match error." });
  }
});

// ====== Analytics ======
app.get("/api/analytics", async (req, res) => {
  const totalDonors = await Donor.aggregate([{ $group: { _id: "$blood_group", count: { $sum: 1 } } }]);
  const activeRequests = await Request.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]);
  const requestsByLocation = await Request.aggregate([{ $group: { _id: "$location", count: { $sum: 1 } } }]);

  res.json({ totalDonors, activeRequests, requestsByLocation });
});

// ====== Notify Donors (SMS) ======
app.post("/api/notify-donors", async (req, res) => {
  const { blood_group, message } = req.body;
  try {
    const donors = await Donor.find({ blood_group });
    for (const d of donors) {
      if (d.phone && TWILIO_NUMBER.length > 2) {
        await twilioClient.messages.create({ from: TWILIO_NUMBER, to: d.phone, body: message });
      }
    }
    res.json({ message: "📢 SMS sent to eligible donors!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Failed to send SMS." });
  }
});

// ====== Email Donors ======
app.post("/api/email-donors", async (req, res) => {
  const { blood_group, subject, message } = req.body;
  try {
    const donors = await Donor.find({ blood_group });
    for (const d of donors) {
      if (d.email) {
        await transporter.sendMail({
          from: EMAIL_USER,
          to: d.email,
          subject,
          text: message,
        });
      }
    }
    res.json({ message: "📧 Emails sent to donors successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Failed to send emails." });
  }
});

// ====== Match History ======
app.get("/api/match-history", async (req, res) => {
  try {
    const matches = await MatchHistory.find()
      .populate("donorId", "name blood_group")
      .populate("requestId", "hospital status")
      .sort({ matchedAt: -1 });
    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Error fetching match history." });
  }
});

// ====== Server Listen ======
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 LifeLink Blood Donation Server running on port ${PORT}`));
