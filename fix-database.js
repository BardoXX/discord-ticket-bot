require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabaseFromScratch() {
  let pool;
  try {
    console.log('Starting complete database setup...');
    
    // Create database connection pool
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
    
    // Drop existing tables if they exist (in correct order to handle foreign keys)
    console.log('Dropping existing tables...');
    await pool.execute('DROP TABLE IF EXISTS ticket_logs');
    await pool.execute('DROP TABLE IF EXISTS tickets');
    await pool.execute('DROP TABLE IF EXISTS settings');
    
    // Create settings table
    console.log('Creating settings table...');
    await pool.execute(`
      CREATE TABLE settings (
        guild_id VARCHAR(255) PRIMARY KEY,
        log_channel_id VARCHAR(255),
        ticket_category_id VARCHAR(255),
        support_role_id VARCHAR(255),
        welcome_message TEXT
      )
    `);
    
    // Create tickets table
    console.log('Creating tickets table...');
    await pool.execute(`
      CREATE TABLE tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        guild_id VARCHAR(255) NOT NULL,
        claimed_by VARCHAR(255),
        status ENUM('open', 'closed') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP NULL,
        close_reason TEXT
      )
    `);
    
    // Create ticket_logs table
    console.log('Creating ticket_logs table...');
    await pool.execute(`
      CREATE TABLE ticket_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT,
        transcript_url TEXT,
        closed_by VARCHAR(255),
        close_reason TEXT,
        closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id)
      )
    `);
    
    console.log('Database setup complete! All tables created successfully.');
    
    // Display table structures for verification
    console.log('\nVerifying table structures:');
    
    const [settingsColumns] = await pool.execute('DESCRIBE settings');
    console.log('\nSettings table structure:');
    console.table(settingsColumns);
    
    const [ticketsColumns] = await pool.execute('DESCRIBE tickets');
    console.log('\nTickets table structure:');
    console.table(ticketsColumns);
    
    const [logsColumns] = await pool.execute('DESCRIBE ticket_logs');
    console.log('\nTicket_logs table structure:');
    console.table(logsColumns);
    
    console.log('\nSetup complete! Your database is ready to use.');
    
  } catch (error) {
    console.error('Error during database setup:', error);
  } finally {
    if (pool) {
      pool.end();
      console.log('Database connection closed');
    }
  }
}

setupDatabaseFromScratch();