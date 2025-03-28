let userId = localStorage.getItem("userId");
if (!userId) {
    userId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("userId", userId);
}

let companySettings = {};
let features = {};

async function fetchCompanySettings() {
    try {
        const response = await fetch(`/api/company-settings/${userId}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        companySettings = data;
        features = data.features || { locationTracking: true, appointmentBooking: false, ticketRaising: false }; // Fallback added

        if (companySettings.logo_url) {
            document.getElementById("companyLogo").src = companySettings.logo_url;
        }
        if (companySettings.primary_color) {
            document.documentElement.style.setProperty('--primary-color', companySettings.primary_color);
        }

        document.getElementById("locationButton").style.display = features.locationTracking ? "block" : "none";
    } catch (err) {
        console.error("Error fetching company settings:", err);
    }
}

async function fetchUserName() {
    try {
        const response = await fetch(`/api/user-contact/${userId}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data.name || userId; // Fallback to userId if name not found
    } catch (err) {
        console.error("Error fetching user name:", err);
        return userId; // Fallback to userId if error occurs
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await fetchCompanySettings();

    try {
        // Fetch user name
        const userName = await fetchUserName();

        // Customize welcome message
        const defaultWelcomeMessage = `Hello ${userName}, I am a representative of Jain Estates. How can I help you?`;
        const welcomeMessageText = companySettings.welcome_message || defaultWelcomeMessage;

        // Display welcome message
        const chatMessages = document.getElementById("chatMessages");
        const welcomeMessage = document.createElement("div");
        welcomeMessage.classList.add("message", "bot-message");
        welcomeMessage.innerHTML = `<span>${welcomeMessageText}</span>`;
        chatMessages.appendChild(welcomeMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error("❌ Error displaying welcome message:", error);
        const chatMessages = document.getElementById("chatMessages");
        const errorMessage = document.createElement("div");
        errorMessage.classList.add("message", "bot-message");
        errorMessage.innerHTML = `<span>Error: Couldn't connect to the server. Try again!</span>`;
        chatMessages.appendChild(errorMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

const ws = new WebSocket(`ws://localhost:${window.location.port}`);
ws.onopen = () => console.log("✅ Connected to WebSocket server!");
ws.onmessage = (event) => {
    console.log("📥 Received WebSocket message:", event.data);
    const data = JSON.parse(event.data);
    if (data.error) {
        console.error("❌ WebSocket error:", data.error);
        const chatMessages = document.getElementById("chatMessages");
        const errorMessage = document.createElement("div");
        errorMessage.classList.add("message", "bot-message");
        errorMessage.innerHTML = `<span>${data.error}</span>`;
        chatMessages.appendChild(errorMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return;
    }
    const { product_id, placeName, timestamp } = data;
    if (product_id && placeName) {
        console.log(`📍 Location Update: Product ${product_id} is at ${placeName}`);
        const chatMessages = document.getElementById("chatMessages");
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", "bot-message");
        messageElement.innerHTML = `<span>📍 Product ${product_id} is at ${placeName}${timestamp ? ` (Updated at ${timestamp})` : ''}</span>`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        console.log("❓ Received invalid data:", data);
    }
};
ws.onerror = (error) => console.error("❌ WebSocket error:", error);
ws.onclose = () => console.log("🔒 WebSocket connection closed");

async function sendMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (!message) return;

    const chatMessages = document.getElementById("chatMessages");
    const userMessage = document.createElement("div");
    userMessage.classList.add("message", "user-message");
    userMessage.innerHTML = `<span>${message}</span>`;
    chatMessages.appendChild(userMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    input.value = "";

    try {
        const response = await fetch("/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, question: message })
        });
        const data = await response.json();
        const botMessage = document.createElement("div");
        botMessage.classList.add("message", "bot-message");
        const formattedAnswer = (data.answer || data.error || "Error: No response").replace(/\n/g, '<br>');
        botMessage.innerHTML = `<span>${formattedAnswer}</span>`;
        chatMessages.appendChild(botMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error("❌ Error:", error);
        const errorMessage = document.createElement("div");
        errorMessage.classList.add("message", "bot-message");
        errorMessage.innerHTML = `<span>Error: Couldn't connect to the server. Try again!</span>`;
        chatMessages.appendChild(errorMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

document.getElementById("locationButton").addEventListener("click", () => {
    if (!features.locationTracking) {
        alert("Location tracking is disabled by the company.");
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const message = JSON.stringify({
                    user_id: userId,
                    product_id: "123",
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                console.log(`📤 Sending location: ${message}`);
                ws.send(message);
            },
            (error) => {
                console.error("❌ Geolocation error:", error);
                const chatMessages = document.getElementById("chatMessages");
                const errorMessage = document.createElement("div");
                errorMessage.classList.add("message", "bot-message");
                errorMessage.innerHTML = `<span>Error: Couldn't fetch location. Please allow location access.</span>`;
                chatMessages.appendChild(errorMessage);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        );
    } else {
        const chatMessages = document.getElementById("chatMessages");
        const errorMessage = document.createElement("div");
        errorMessage.classList.add("message", "bot-message");
        errorMessage.innerHTML = `<span>Error: Geolocation is not supported by this browser.</span>`;
        chatMessages.appendChild(errorMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

document.getElementById("chatInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

document.getElementById("sendButton").addEventListener("click", sendMessage);

document.getElementById("refreshButton").addEventListener("click", () => {
    localStorage.removeItem("userId");
    location.reload();
});

document.getElementById("closeButton").addEventListener("click", () => {
    document.querySelector(".chat-container").style.display = "none";
});

document.getElementById("micButton").addEventListener("click", () => {
    alert("Voice input not implemented yet!");
});