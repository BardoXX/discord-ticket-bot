const fs = require('fs');
const path = require('path');

// Define directories to create
const directories = [
  'commands',
  'events',
  'buttons',
  'utils',
  'scripts'
];

// Create directories if they don't exist
directories.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

// Create .env.example file if it doesn't exist
const envExamplePath = path.join(__dirname, '..', '.env.example');
if (!fs.existsSync(envExamplePath)) {
  const envContent = `# Bot Configuration
TOKEN=your_discord_bot_token
CLIENT_ID=your_bot_client_id

# Database Configuration
DB_HOST=51.75.159.227
DB_PORT=3306
DB_USER=u10_Bs62u9Dpq5
DB_PASSWORD=your_database_password
DB_NAME=s10_WMEH_

# Guild Configuration
GUILD_ID=your_guild_id
`;

  fs.writeFileSync(envExamplePath, envContent);
  console.log('Created .env.example file');
} else {
  console.log('.env.example file already exists');
}

console.log('Project structure initialized successfully!');