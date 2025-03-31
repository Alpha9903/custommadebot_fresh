const mysql = require("mysql2/promise");

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "12345",
    database: "bot_database",
};

async function setupDatabase() {
    const db = await mysql.createConnection(dbConfig);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE,
            password VARCHAR(255)
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS chat_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255),
            message TEXT,
            sender ENUM('user', 'bot') NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS knowledge_base (
            id INT AUTO_INCREMENT PRIMARY KEY,
            url VARCHAR(255),
            content TEXT
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS user_contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255),
            contact_info VARCHAR(255)
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255),
            appointment_date DATETIME,
            status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending'
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS tickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255),
            issue TEXT,
            status ENUM('open', 'closed') DEFAULT 'open'
        )
    `);

    console.log("Database setup complete!");
    await db.end();
}
try {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS location_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255),
            product_id VARCHAR(255),
            latitude DECIMAL(9,6),
            longitude DECIMAL(9,6),
            place_name TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log("location_logs table created or already exists");

    // New table for company settings
    await db.execute(`
        CREATE TABLE IF NOT EXISTS company_settings (
            company_id VARCHAR(255) PRIMARY KEY,
            logo_url VARCHAR(255),
            primary_color VARCHAR(7),
            welcome_message TEXT,
            features JSON,  -- Store enabled/disabled features as JSON
            language VARCHAR(10) DEFAULT 'en'
        )
    `);
    console.log("company_settings table created or already exists");

    // New table for subscriptions
    await db.execute(`
        CREATE TABLE IF NOT EXISTS subscriptions (
            company_id VARCHAR(255) PRIMARY KEY,
            plan VARCHAR(20) DEFAULT 'freemium',  -- 'freemium' or 'premium'
            stripe_customer_id VARCHAR(255),
            stripe_subscription_id VARCHAR(255),
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES users(username)
        )
    `);
    console.log("subscriptions table created or already exists");
} catch (err) {
    console.error("Error creating tables:", err);
}
;

setupDatabase();