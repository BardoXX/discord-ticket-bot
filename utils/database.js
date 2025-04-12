const mysql = require('mysql2/promise');

// Database connection pool
let pool;

// Connect to the database
async function connectToDatabase() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Test the connection
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    connection.release();
    
    // Initialize database tables if needed
    await initializeTables();
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}

// Initialize required tables
async function initializeTables() {
  try {
    // Create tickets table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        claimed_by VARCHAR(255),
        status ENUM('open', 'closed') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP NULL,
        close_reason TEXT
      )
    `);
    
    // Create ticket_logs table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ticket_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT,
        transcript_url TEXT,
        closed_by VARCHAR(255),
        close_reason TEXT,
        closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id)
      )
    `);
    
    // Create settings table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        guild_id VARCHAR(255) PRIMARY KEY,
        log_channel_id VARCHAR(255),
        ticket_category_id VARCHAR(255),
        support_role_id VARCHAR(255),
        welcome_message TEXT
      )
    `);
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
  }
}

// Get the database pool
function getPool() {
  return pool;
}

module.exports.connectToDatabase = connectToDatabase;
module.exports.getPool = getPool;