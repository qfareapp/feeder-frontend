import React, { useState } from "react";
import axios from "axios";
import "./BusOnboardingForm.css";
import { BASE_URL } from "../config";

export default function BusOnboardingForm() {
  const [formData, setFormData] = useState({
    regNumber: "",
    seatingCapacity: "",
    fuelType: "Diesel",
  });

  const [qrCode, setQrCode] = useState(""); // <-- store QR returned from backend

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting bus:", formData);

      // ✅ API should return bus object + qrCode (base64 or URL)
      const res = await axios.post(`${BASE_URL}/buses`, formData);

      alert("✅ Bus onboarded successfully!");
      if (res.data.bus?.qrCode) {
        setQrCode(res.data.bus.qrCode); // Save QR for preview
      }
    } catch (err) {
      console.error("Error saving bus:", err);
      alert("❌ Failed to save bus");
    }
  };

  return (
    <div className="form-container">
      <h1>🚌 Bus Onboarding Form</h1>
      <form onSubmit={handleSubmit}>
        {/* Section A */}
        <fieldset>
          <legend>Section A – Operator Details</legend>
          <label>Operator Name
            <input type="text" name="operatorName" onChange={handleChange} />
          </label>
          <label>Authorized Person
            <input type="text" name="authorizedPerson" onChange={handleChange} />
          </label>
          <label>Contact Number
            <input type="text" name="contactNumber" onChange={handleChange} />
          </label>
          <label>Email
            <input type="email" name="email" onChange={handleChange} />
          </label>
          <label>Address
            <textarea name="address" onChange={handleChange}></textarea>
          </label>
        </fieldset>

        {/* Section B */}
        <fieldset>
          <legend>Section B – Bus Details</legend>
          <label>
            Registration Number
            <input
              type="text"
              name="regNumber"
              value={formData.regNumber}
              onChange={handleChange}
              required
            />
          </label>
          <label>Chassis Number
            <input type="text" name="chassisNumber" onChange={handleChange} />
          </label>
          <label>Engine Number
            <input type="text" name="engineNumber" onChange={handleChange} />
          </label>
          <label>Make & Model
            <input type="text" name="makeModel" onChange={handleChange} />
          </label>
          <label>Fuel Type
            <select name="fuelType" onChange={handleChange}>
              <option>Diesel</option>
              <option>CNG</option>
              <option>Electric</option>
              <option>Hybrid</option>
            </select>
          </label>
           <label>
            Seating Capacity
            <input
              type="number"
              name="seatingCapacity"
              value={formData.seatingCapacity}
              onChange={handleChange}
              required
            />
          </label>
          <label>Year of Manufacture
            <input type="number" name="yom" onChange={handleChange} />
          </label>
          <label>Odometer (km)
            <input type="number" name="odometer" onChange={handleChange} />
          </label>
          <label>Insurance Validity
            <input type="date" name="insuranceValidity" onChange={handleChange} />
          </label>
          <label>Fitness Validity
            <input type="date" name="fitnessValidity" onChange={handleChange} />
          </label>
          <label>PUC Validity
            <input type="date" name="pucValidity" onChange={handleChange} />
          </label>
        </fieldset>

        {/* Section C */}
        <fieldset>
          <legend>Section C – Driver & Crew</legend>
          <label>Driver Name
            <input type="text" name="driverName" onChange={handleChange} />
          </label>
          <label>License Number
            <input type="text" name="driverLicense" onChange={handleChange} />
          </label>
          <label>License Validity
            <input type="date" name="driverLicenseValidity" onChange={handleChange} />
          </label>
          <label>Driver Contact
            <input type="text" name="driverContact" onChange={handleChange} />
          </label>
          <label>Alternate Driver
            <input type="text" name="altDriverName" onChange={handleChange} />
          </label>
          <label>Helper / Conductor
            <input type="text" name="helperName" onChange={handleChange} />
          </label>
        </fieldset>

        {/* Section D */}
        <fieldset>
          <legend>Section D – Safety & Compliance</legend>
          <label>
            <input type="checkbox" name="safety_fire" onChange={handleChange} /> Fire Extinguisher
          </label>
          <label>
            <input type="checkbox" name="safety_firstAid" onChange={handleChange} /> First Aid Kit
          </label>
          <label>
            <input type="checkbox" name="safety_emExit" onChange={handleChange} /> Emergency Exit
          </label>
          <label>
            <input type="checkbox" name="safety_gps" onChange={handleChange} /> GPS Installed
          </label>
          <label>
            <input type="checkbox" name="safety_cctv" onChange={handleChange} /> CCTV Installed
          </label>
          <label>
            <input type="checkbox" name="safety_seatBelts" onChange={handleChange} /> Seat Belts OK
          </label>
        </fieldset>

        {/* Section E */}
        <fieldset>
          <legend>Section E – Commercial Terms</legend>
          <label>Rate Type
            <select name="rateType" onChange={handleChange}>
              <option value="per_km">Per km</option>
              <option value="per_trip">Per trip</option>
              <option value="per_month">Per month</option>
            </select>
          </label>
          <label>Rate Value
            <input type="number" name="rateValue" onChange={handleChange} />
          </label>
          <label>Billing Cycle
            <select name="billingCycle" onChange={handleChange}>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </label>
          <label>Payment Mode
            <select name="paymentMode" onChange={handleChange}>
              <option>Bank Transfer</option>
              <option>UPI</option>
              <option>Cheque</option>
            </select>
          </label>
          <label>Security Deposit
            <input type="number" name="securityDeposit" onChange={handleChange} />
          </label>
        </fieldset>

        {/* Section F */}
        <fieldset>
          <legend>Section F – Attachments</legend>
          <label>RC Copy
            <input type="file" name="att_rc" onChange={handleChange} />
          </label>
          <label>Insurance Copy
            <input type="file" name="att_insurance" onChange={handleChange} />
          </label>
          <label>Fitness Certificate
            <input type="file" name="att_fitness" onChange={handleChange} />
          </label>
          <label>PUC Certificate
            <input type="file" name="att_puc" onChange={handleChange} />
          </label>
          <label>Driver License
            <input type="file" name="att_dl" onChange={handleChange} />
          </label>
          <label>Driver ID / Aadhaar
            <input type="file" name="att_driverId" onChange={handleChange} />
          </label>
        </fieldset>

       {/* Section G – Seating Arrangement */}
<fieldset>
  <legend>Section G – Seating Arrangement</legend>

  <label>
    Choose Layout:
    <select
      name="seatLayout"
      value={formData.seatLayout || "2x2"}
      onChange={(e) => setFormData({ ...formData, seatLayout: e.target.value })}
    >
      <option value="2x2">2 x 2</option>
      <option value="2x1">2 x 1</option>
      <option value="2x3">2 x 3</option>
    </select>
  </label>

  <div className="bus-seating-wrapper">
    <div className="bus-label front-label">FRONT</div>

    {/* Driver row */}
    <div className="driver-row">
      <div className="side-seats">
        <div className="seat small placeholder"></div>
        <div className="seat small placeholder"></div>
      </div>
      <div className="driver-seat">D</div>
    </div>

    {/* Passenger Seats Layout */}
    <div
      className="bus-layout"
      style={{
        gridTemplateColumns:
          formData.seatLayout === "2x1"
            ? "repeat(2, 45px)" // 2 in a row
            : formData.seatLayout === "2x3"
            ? "repeat(6, 45px)" // 2 + aisle + 3
            : "repeat(5, 45px)", // default 2x2 (2 + aisle + 2)
      }}
    >
      {Array.from({
        length: Math.min(100, Number(formData.seatingCapacity) || 0),
      }).map((_, index) => {
        const seatIndex = index;
        const seatNumber = formData.seats?.indexOf(seatIndex) + 1;
        const isSelected = formData.seats?.includes(seatIndex);

        return (
          <div
            key={seatIndex}
            className={`seat ${isSelected ? "selected" : ""}`}
            onClick={() => {
              let updatedSeats = formData.seats || [];
              if (updatedSeats.includes(seatIndex)) {
                updatedSeats = updatedSeats.filter((s) => s !== seatIndex);
              } else {
                updatedSeats = [...updatedSeats, seatIndex];
              }
              setFormData({ ...formData, seats: updatedSeats });
            }}
          >
            {isSelected ? seatNumber : ""}
          </div>
        );
      })}

      {/* Insert aisle cells */}
      {formData.seatLayout === "2x2" &&
        Array.from({ length: Math.ceil((formData.seatingCapacity || 0) / 4) }).map(
          (_, rowIndex) => (
            <div
              key={`aisle-${rowIndex}`}
              className="aisle"
              style={{
                gridColumn: 3, // middle column
                gridRow: rowIndex + 1,
              }}
            ></div>
          )
        )}

      {formData.seatLayout === "2x3" &&
        Array.from({ length: Math.ceil((formData.seatingCapacity || 0) / 5) }).map(
          (_, rowIndex) => (
            <div
              key={`aisle2-${rowIndex}`}
              className="aisle"
              style={{
                gridColumn: 3, // middle between 2 and 3
                gridRow: rowIndex + 1,
              }}
            ></div>
          )
        )}
    </div>

    <div className="bus-label rear-label">REAR</div>
  </div>

  <p className="seat-note">
    Click on blank boxes to mark seats. Aisle shown in grey.
  </p>
</fieldset>

        <div className="form-actions">
          <button type="submit">Submit</button>
        </div>
      </form>
    {/* Show QR Code after successful onboarding */}
      {qrCode && (
        <div className="qr-preview">
          <h3>🚏 Boarding QR Code (place inside bus)</h3>
          <img src={qrCode} alt="Bus QR Code" style={{ width: "200px" }} />
        </div>
      )}
    </div>
  );
}

