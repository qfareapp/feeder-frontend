import React, { useState } from "react";
import axios from "axios";

const SocietyForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    registrationNumber: "",
    address: "",
    contactPerson: "",
    phone: "",
    email: "",
    alternateContact: "",
    gst: "",
    logo: "",
    flats: "",
    commuters: "",
    peakMorning: "",
    peakEvening: "",
    verificationSystem: "",
    pickupPoint: "",
    parkingAvailable: "",
    chargingAvailable: "",
    securityProtocol: "",
    commChannel: "",
    operationMode: "",
    paymentPref: "",
    corporateTieups: "",
    insurance: "",
    contractDuration: "",
    specialTerms: "",
    reportFrequency: "",
    feedbackMechanism: "",
    dataPrivacy: "",
  });

  // Handle input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit to backend
  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // ✅ send the entire formData object
    const res = await axios.post("http://localhost:5000/api/societies", formData);

    alert("✅ Society submitted successfully!");
    console.log(res.data);

    // ✅ optionally reset form after submit
    setFormData({
      name: "",
      registrationNumber: "",
      address: "",
      contactPerson: "",
      phone: "",
      email: "",
      alternateContact: "",
      gst: "",
      logo: "",
      flats: "",
      commuters: "",
      peakMorning: "",
      peakEvening: "",
      verificationSystem: "",
      pickupPoint: "",
      parkingAvailable: "",
      chargingAvailable: "",
      securityProtocol: "",
      commChannel: "",
      operationMode: "",
      paymentPref: "",
      corporateTieups: "",
      insurance: "",
      contractDuration: "",
      specialTerms: "",
      reportFrequency: "",
      feedbackMechanism: "",
      dataPrivacy: "",
    });
  } catch (err) {
    console.error("❌ Error submitting form:", err.message);
    alert("❌ Error submitting form");
  }
};

  return (
    <div style={{ padding: "20px" }}>
      <h1>Housing Society Onboarding Form – Feeder Service</h1>
      <p>
        This form is intended to capture essential details from Housing
        Societies / RWAs for onboarding to the Feeder Service (EV Micro-Bus
        Shuttle). Kindly provide accurate information to enable route planning,
        fare structuring, and service agreements.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Section 1 */}
        <h2>1. Administrative / Legal Details</h2>
        <input type="text" name="name" placeholder="Society Name" onChange={handleChange} />
        <input type="text" name="registrationNumber" placeholder="Registration Number" onChange={handleChange} />
        <input type="text" name="address" placeholder="Address" onChange={handleChange} />
        <input type="text" name="contactPerson" placeholder="Primary Contact Person" onChange={handleChange} />
        <input type="text" name="phone" placeholder="Phone" onChange={handleChange} />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} />
        <input type="text" name="alternateContact" placeholder="Alternate Contact" onChange={handleChange} />
        <input type="text" name="gst" placeholder="PAN / GST No." onChange={handleChange} />

        {/* ✅ Logo field */}
        <input
          type="text"
          name="logo"
          placeholder="Logo URL (https://...)"
          onChange={handleChange}
        />

        {/* Section 2 */}
        <h2>2. Resident / Passenger Information</h2>
        <input type="number" name="flats" placeholder="Total Flats/Households" onChange={handleChange} />
        <input type="number" name="commuters" placeholder="Estimated Daily Commuters" onChange={handleChange} />
        <input type="text" name="peakMorning" placeholder="Peak Hour Morning" onChange={handleChange} />
        <input type="text" name="peakEvening" placeholder="Peak Hour Evening" onChange={handleChange} />
        <input type="text" name="verificationSystem" placeholder="Resident Verification System" onChange={handleChange} />

        {/* Section 3 */}
        <h2>3. Infrastructure & Access</h2>
        <input type="text" name="pickupPoint" placeholder="Pickup/Drop-off Point" onChange={handleChange} />
        <input type="text" name="parkingAvailable" placeholder="Parking Available (Yes/No)" onChange={handleChange} />
        <input type="text" name="chargingAvailable" placeholder="EV Charging Available (Yes/No)" onChange={handleChange} />
        <input type="text" name="securityProtocol" placeholder="Security Protocol" onChange={handleChange} />
        <input type="text" name="commChannel" placeholder="Resident Communication Channel" onChange={handleChange} />

        {/* Section 4 */}
        <h2>4. Commercial & Financial Terms</h2>
        <input type="text" name="operationMode" placeholder="Operation Mode" onChange={handleChange} />
        <input type="text" name="paymentPref" placeholder="Payment Preference" onChange={handleChange} />
        <input type="text" name="corporateTieups" placeholder="Corporate Tie-ups" onChange={handleChange} />

        {/* Section 5 */}
        <h2>5. Legal / Compliance</h2>
        <input type="text" name="insurance" placeholder="Insurance Coverage" onChange={handleChange} />
        <input type="text" name="contractDuration" placeholder="Contract Duration" onChange={handleChange} />
        <input type="text" name="specialTerms" placeholder="Special Conditions / Terms" onChange={handleChange} />

        {/* Section 6 */}
        <h2>6. Data Sharing & Feedback</h2>
        <input type="text" name="reportFrequency" placeholder="Report Frequency" onChange={handleChange} />
        <input type="text" name="feedbackMechanism" placeholder="Feedback Mechanism" onChange={handleChange} />
        <input type="text" name="dataPrivacy" placeholder="Data Privacy Acknowledgement (Yes/No)" onChange={handleChange} />

        <br />
        <button type="submit">Submit Form</button>
      </form>
    </div>
  );
};

export default SocietyForm;
