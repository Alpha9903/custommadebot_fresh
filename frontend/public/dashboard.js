document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/";
        return;
    }

    // Navigation
    const navLinks = document.querySelectorAll(".sidebar nav a");
    const sections = document.querySelectorAll(".main-content section");

    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active"));
            link.classList.add("active");
            document.getElementById(link.getAttribute("href").substring(1)).classList.add("active");

            if (link.getAttribute("href") === "#analytics") {
                loadAnalytics();
            } else if (link.getAttribute("href") === "#subscription") {
                loadSubscription();
            }
        });
    });

    // Load initial settings
    fetchSettings();

    // Branding form
    document.getElementById("brandingForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const logoUrl = document.getElementById("logoUrl").value;
        const primaryColor = document.getElementById("primaryColor").value;
        const welcomeMessage = document.getElementById("welcomeMessage").value;

        try {
            const response = await fetch("/api/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ logo_url: logoUrl, primary_color: primaryColor, welcome_message: welcomeMessage })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            alert("Settings updated successfully!");
        } catch (err) {
            console.error("Error updating settings:", err);
            alert("Error updating settings: " + err.message);
        }
    });

    // Knowledge base
    loadKnowledgeBase();
    document.getElementById("knowledgeBaseForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const source = document.getElementById("kbSource").value;
        const content = document.getElementById("kbContent").value;

        try {
            const response = await fetch("/api/knowledge-base", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ source, content })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            alert("Knowledge base updated!");
            loadKnowledgeBase();
        } catch (err) {
            console.error("Error adding to knowledge base:", err);
            alert("Error adding to knowledge base: " + err.message);
        }
    });

    // Features form
    document.getElementById("featuresForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const features = {
            locationTracking: document.getElementById("locationTracking").checked,
            appointmentBooking: document.getElementById("appointmentBooking").checked,
            ticketRaising: document.getElementById("ticketRaising").checked
        };

        try {
            const response = await fetch("/api/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ features })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            alert("Features updated successfully!");
        } catch (err) {
            console.error("Error updating features:", err);
            alert("Error updating features: " + err.message);
        }
    });

    // Logout
    document.getElementById("logoutButton").addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    });

    // Subscription
    document.getElementById("upgradeButton").addEventListener("click", async () => {
        try {
            const response = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            window.location.href = data.url;
        } catch (err) {
            console.error("Error creating checkout session:", err);
            alert("Error creating checkout session: " + err.message);
        }
    });
});

async function fetchSettings() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch("/api/settings", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        document.getElementById("logoUrl").value = data.logo_url || "";
        document.getElementById("primaryColor").value = data.primary_color || "#ff6200";
        document.getElementById("welcomeMessage").value = data.welcome_message || "";
        const features = data.features || {};
        document.getElementById("locationTracking").checked = features.locationTracking || false;
        document.getElementById("appointmentBooking").checked = features.appointmentBooking || false;
        document.getElementById("ticketRaising").checked = features.ticketRaising || false;
    } catch (err) {
        console.error("Error fetching settings:", err);
        alert("Error fetching settings: " + err.message);
    }
}

async function loadKnowledgeBase() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch("/api/knowledge-base", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const tbody = document.querySelector("#kbTable tbody");
        tbody.innerHTML = "";
        data.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.source}</td>
                <td>${item.content}</td>
                <td><button onclick="deleteKBEntry(${item.id})">Delete</button></td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Error loading knowledge base:", err);
        alert("Error loading knowledge base: " + err.message);
    }
}

async function deleteKBEntry(id) {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`/api/knowledge-base/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        alert("Entry deleted!");
        loadKnowledgeBase();
    } catch (err) {
        console.error("Error deleting entry:", err);
        alert("Error deleting entry: " + err.message);
    }
}

async function loadAnalytics() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch("/api/analytics", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        document.getElementById("totalUsers").textContent = data.totalUsers;
        const commonQuestions = document.getElementById("commonQuestions");
        commonQuestions.innerHTML = "";
        data.commonQuestions.forEach(q => {
            const li = document.createElement("li");
            li.textContent = `${q.message} (${q.count} times)`;
            commonQuestions.appendChild(li);
        });
    } catch (err) {
        console.error("Error loading analytics:", err);
        document.getElementById("analyticsContent").innerHTML = `<p>${err.message}</p>`;
    }
}

async function loadSubscription() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch("/api/subscription", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        document.getElementById("currentPlan").textContent = data.plan;
        if (data.plan === "premium") {
            document.getElementById("upgradeButton").style.display = "none";
        }
    } catch (err) {
        console.error("Error loading subscription:", err);
        alert("Error loading subscription: " + err.message);
    }
}