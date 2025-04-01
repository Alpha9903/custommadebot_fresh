const mysql = require("mysql2/promise");

// Database Configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
};

// Function to initialize database
async function setupDatabase() {
    try {
        const db = await mysql.createConnection(dbConfig);
        console.log("✅ Database connected successfully!");

        // Create Users Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        `);

        // Create Chat Logs Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS chat_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255),
                message TEXT,
                sender ENUM('user', 'bot') NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Knowledge Base Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id INT AUTO_INCREMENT PRIMARY KEY,
                url VARCHAR(255),
                content TEXT
            )
        `);

        // Create User Contacts Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS user_contacts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255),
                contact_info VARCHAR(255)
            )
        `);

        // Create Appointments Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS appointments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255),
                appointment_date DATETIME,
                status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending'
            )
        `);

        // Create Tickets Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255),
                issue TEXT,
                status ENUM('open', 'closed') DEFAULT 'open'
            )
        `);

        // Create Location Logs Table
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

        console.log("✅ All tables created or already exist.");

        // Create Company Settings Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS company_settings (
                company_id VARCHAR(255) PRIMARY KEY,
                logo_url VARCHAR(255),
                primary_color VARCHAR(7),
                welcome_message TEXT,
                features JSON, 
                language VARCHAR(10) DEFAULT 'en'
            )
        `);

        console.log("✅ company_settings table created or already exists");

        // Create Subscriptions Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                company_id VARCHAR(255) PRIMARY KEY,
                plan VARCHAR(20) DEFAULT 'freemium',
                stripe_customer_id VARCHAR(255),
                stripe_subscription_id VARCHAR(255),
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES users(username)
            )
        `);

        console.log("✅ subscriptions table created or already exists");

        await db.end(); // Close the connection after all queries execute
        console.log("✅ Database setup complete!");

    } catch (err) {
        console.error("❌ Database setup error:", err);
    }
}

// Call function to setup database
setupDatabase();
