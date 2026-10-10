// Update this URL if your FastAPI server uses a different host, port, or route.
const API_URL = "http://127.0.0.1:8000/predict";

const form = document.getElementById("prediction-form");
const submitButton = document.getElementById("submit-btn");
const buttonLabel = submitButton.querySelector(".button-label");
const statusMessage = document.getElementById("status-message");
const resultCard = document.getElementById("result-card");
const resultCategory = document.getElementById("result-category");
const resultDescription = document.getElementById("result-description");
const rawResponse = document.getElementById("raw-response");

document.getElementById("year").textContent = new Date().getFullYear();

function showStatus(message, type = "error") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.hidden = false;
}

function clearStatus() {
  statusMessage.textContent = "";
  statusMessage.hidden = true;
}

function findPrediction(data) {
  // Supports common response keys. Add your exact response key here if needed.
  const possibleKeys = [
    "predicted_category",
    "insurance_premium_category",
    "prediction",
    "predicted_premium_category",
    "result",
    "category"
  ];

  for (const key of possibleKeys) {
    if (data && data[key] !== undefined && data[key] !== null) {
      const value = data[key];
      if (typeof value === "object") {
        return value.category ?? value.label ?? JSON.stringify(value);
      }
      return String(value);
    }
  }

  if (typeof data === "string" || typeof data === "number") {
    return String(data);
  }

  return null;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();
  resultCard.hidden = true;

  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const payload = {
    age: Number(formData.get("age")),
    weight: Number(formData.get("weight")),
    height: Number(formData.get("height")),
    income_lpa: Number(formData.get("income_lpa")),
    smoker: formData.get("smoker") === "true",
    city: String(formData.get("city")).trim(),
    occupation: formData.get("occupation")
  };

  if (!(payload.age > 0 && payload.age < 120)) {
    showStatus("Age must be greater than 0 and less than 120.");
    return;
  }
  if (!(payload.weight > 0)) {
    showStatus("Weight must be greater than 0 kg.");
    return;
  }
  if (!(payload.height > 0 && payload.height < 2.5)) {
    showStatus("Height must be greater than 0 and less than 2.5 meters.");
    return;
  }
  if (!(payload.income_lpa > 0)) {
    showStatus("Annual income must be greater than 0 LPA.");
    return;
  }
  if (!payload.city) {
    showStatus("Please enter your city.");
    return;
  }

  submitButton.disabled = true;
  buttonLabel.textContent = "Predicting your category...";
  showStatus("Sending your details to the prediction model…", "loading");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { detail: responseText || "The API returned an empty response." };
    }

    if (!response.ok) {
      const detail = data.detail ?? data.message ?? `Request failed (${response.status}).`;
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }

    const prediction = findPrediction(data);
    clearStatus();

    resultCategory.textContent = prediction ?? "Prediction received";
    resultDescription.textContent = prediction
      ? "This is the category returned by your model. It is an estimate, not an official insurance quote."
      : "The API responded successfully. Open the response below to inspect its fields.";
    rawResponse.textContent = JSON.stringify(data, null, 2);
    resultCard.hidden = false;

} catch (error) {
    console.error("Prediction request failed:", error);
    showStatus(`Request failed: ${error.message || String(error)}`);
}

  
  finally {
    submitButton.disabled = false;
    buttonLabel.textContent = "Predict my premium category";
  }
});
