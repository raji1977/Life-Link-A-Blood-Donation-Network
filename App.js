import React, { useState, useEffect } from "react";
import './App.css';

function App() {
  const [donor, setDonor] = useState({ name: "", blood_group: "", last_donation: "", health_conditions: "", phone: "", email: "" });
  const [eligibleDonors, setEligibleDonors] = useState([]);
  const [request, setRequest] = useState({ hospital: "", blood_group: "", units: "", priority: "Medium", location: "" });
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [analytics, setAnalytics] = useState({ totalDonors: [], activeRequests: [], requestsByLocation: [] });

  const [smsMsg, setSmsMsg] = useState("");
  const [emailMsg, setEmailMsg] = useState("");

  // ===== Donor Registration =====
  const handleDonorSubmit = async (e) => {
    e.preventDefault();
    if (!donor.name || !donor.blood_group || !donor.last_donation || !donor.phone || !donor.email) {
      alert("Please fill all required fields.");
      return;
    }
    const res = await fetch("http://localhost:5000/donor-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...donor,
        health_conditions: donor.health_conditions ? donor.health_conditions.split(",").map(h => h.trim()) : []
      }),
    });
    const data = await res.json();
    alert(data.message);
    setDonor({ name: "", blood_group: "", last_donation: "", health_conditions: "", phone: "", email: "" });
    fetchEligible();
    fetchAnalytics();
  };

  const fetchEligible = async () => {
    const res = await fetch("http://localhost:5000/eligible-donors");
    const data = await res.json();
    setEligibleDonors(data);
  };

  // ===== Requests =====
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!request.hospital || !request.blood_group || !request.units || !request.priority || !request.location) {
      alert("Please fill all fields for the request.");
      return;
    }
    const res = await fetch("http://localhost:5000/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const data = await res.json();
    alert(data.message);
    setRequest({ hospital: "", blood_group: "", units: "", priority: "Medium", location: "" });
    fetchRequests();
    fetchAnalytics();
  };

  const fetchRequests = async () => {
    const res = await fetch("http://localhost:5000/api/requests");
    const data = await res.json();
    setRequests(data);
  };

  // ===== Smart Match =====
  const handleSmartMatch = async () => {
    if (!request.blood_group) { alert("Select blood group for smart match"); return; }
    const res = await fetch("http://localhost:5000/api/smart-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blood_group: request.blood_group }),
    });
    const data = await res.json();
    setMatches(data.matches);
    fetchMatchHistory();
  };

  // ===== Match History =====
  const fetchMatchHistory = async () => {
    const res = await fetch("http://localhost:5000/api/match-history");
    const data = await res.json();
    setMatchHistory(data);
  };

  // ===== Notifications =====
  const handleNotifySMS = async () => {
    if (!request.blood_group || !smsMsg) { alert("Enter blood group and SMS message"); return; }
    const res = await fetch("http://localhost:5000/api/notify-donors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blood_group: request.blood_group, message: smsMsg }),
    });
    const data = await res.json();
    alert(data.message);
    setSmsMsg("");
  };

  const handleEmail = async () => {
    if (!request.blood_group || !emailMsg) { alert("Enter blood group and Email message"); return; }
    const res = await fetch("http://localhost:5000/api/email-donors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blood_group: request.blood_group, subject: "Blood Donation Alert", message: emailMsg }),
    });
    const data = await res.json();
    alert(data.message);
    setEmailMsg("");
  };

  // ===== Analytics =====
  const fetchAnalytics = async () => {
    const res = await fetch("http://localhost:5000/api/analytics");
    const data = await res.json();
    setAnalytics(data);
  };

  useEffect(() => {
    fetchRequests();
    fetchEligible();
    fetchMatchHistory();
    fetchAnalytics();
  }, []);

  return (
    <div style={{ padding: "1rem", fontFamily: "Arial", background: "#FAFAFA" }}>
      <h1 style={{ color: "#D32F2F" }}>🩸 LifeLink - A Blood Donation Network</h1>

      {/* Donor Registration */}
      <section style={{ background: "#FFE6E6", padding: "15px", borderRadius: "10px", margin: "10px 0" }}>
        <h2>Register Donor</h2>
        <form onSubmit={handleDonorSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input placeholder="Name" value={donor.name} onChange={e => setDonor({ ...donor, name: e.target.value })} />
          <input placeholder="Blood Group" value={donor.blood_group} onChange={e => setDonor({ ...donor, blood_group: e.target.value })} />
          <input type="date" value={donor.last_donation} onChange={e => setDonor({ ...donor, last_donation: e.target.value })} />
          <input placeholder="Health Conditions (comma separated)" value={donor.health_conditions} onChange={e => setDonor({ ...donor, health_conditions: e.target.value })} />
          <input placeholder="Phone Number" value={donor.phone} onChange={e => setDonor({ ...donor, phone: e.target.value })} />
          <input placeholder="Email" value={donor.email} onChange={e => setDonor({ ...donor, email: e.target.value })} />
          <button type="submit" style={{ background: "#D32F2F", color: "#FFF", padding: "10px", border: "none", borderRadius: "8px" }}>Add Donor</button>
        </form>
        <button onClick={fetchEligible} style={{ marginTop: "10px" }}>Show Eligible Donors</button>
        <ul>{eligibleDonors.map((d, i) => (<li key={i}>{d.name} - {d.blood_group} - {d.phone} - {d.email}</li>))}</ul>
      </section>

      {/* Blood Requests */}
      <section style={{ background: "#F9F9F9", padding: "15px", borderRadius: "10px", margin: "10px 0" }}>
        <h2>Organize Blood Request</h2>
        <form onSubmit={handleRequestSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input placeholder="Hospital Name" value={request.hospital} onChange={e => setRequest({ ...request, hospital: e.target.value })} />
          <input placeholder="Blood Group" value={request.blood_group} onChange={e => setRequest({ ...request, blood_group: e.target.value })} />
          <input placeholder="Units Needed" type="number" value={request.units} onChange={e => setRequest({ ...request, units: e.target.value })} />
          <select value={request.priority} onChange={e => setRequest({ ...request, priority: e.target.value })}>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
          <input placeholder="Location/District" value={request.location} onChange={e => setRequest({ ...request, location: e.target.value })} />
          <button type="submit" style={{ background: "#D32F2F", color: "#FFF", padding: "10px", border: "none", borderRadius: "8px" }}>Submit Request</button>
        </form>

        <button onClick={handleSmartMatch} style={{ marginTop: "10px", background: "#1976D2", color: "#FFF", padding: "10px", border: "none", borderRadius: "8px" }}>🧠 Smart Match Donors</button>

        <h3>Smart Matches</h3>
        <ul>{matches.map((m, i) => (<li key={i}>{m.name} - {m.blood_group} - {m.phone} - {m.email}</li>))}</ul>

        {/* Bottom Buttons for SMS and Email */}
        <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
          <input placeholder="SMS Message" value={smsMsg} onChange={e => setSmsMsg(e.target.value)} style={{ flex: 1 }} />
          <button onClick={handleNotifySMS} style={{ background: "#FBC02D", padding: "10px", color: "#000", border: "none", borderRadius: "8px" }}>📢 Send SMS</button>

          <input placeholder="Email Message" value={emailMsg} onChange={e => setEmailMsg(e.target.value)} style={{ flex: 1 }} />
          <button onClick={handleEmail} style={{ background: "#388E3C", padding: "10px", color: "#FFF", border: "none", borderRadius: "8px" }}>📧 Send Email</button>
        </div>
      </section>

      {/* Analytics */}
      <section style={{ background:"#E8F5E9", padding:"15px", borderRadius:"10px", margin:"10px 0" }}>
        <h2>Analytics Dashboard</h2>
        <div>
          <h4>Total Donors by Blood Group</h4>
          <ul>{analytics.totalDonors.map((a,i)=><li key={i}>{a._id}: {a.count}</li>)}</ul>
        </div>
        <div>
          <h4>Active Requests by Priority</h4>
          <ul>{analytics.activeRequests.map((a,i)=><li key={i}>{a._id}: {a.count}</li>)}</ul>
        </div>
        <div>
          <h4>Active Requests by Location</h4>
          <ul>{analytics.requestsByLocation.map((a,i)=><li key={i}>{a._id}: {a.count}</li>)}</ul>
        </div>
      </section>

      {/* Match History */}
      <section style={{ background:"#FFF3E0", padding:"15px", borderRadius:"10px", margin:"10px 0" }}>
        <h2>Match History</h2>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr><th>Donor</th><th>Blood</th><th>Hospital</th><th>Status</th><th>Matched At</th></tr>
          </thead>
          <tbody>
            {matchHistory.map((m,i)=>(
              <tr key={i}>
                <td>{m.donorId.name}</td>
                <td>{m.donorId.blood_group}</td>
                <td>{m.requestId.hospital}</td>
                <td>{m.requestId.status}</td>
                <td>{new Date(m.matchedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default App;
