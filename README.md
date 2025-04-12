# Discord Ticket Bot

A modular Discord bot built with Node.js v22 that provides a comprehensive ticket system for support and user assistance.

## Features

- **Ticket System**
  - Create tickets with customizable panels
  - Ticket claiming by support staff
  - Ticket closing with reason requirement for admins
  - Transcript generation and logging
  
- **Modular Structure**
  - Easy to maintain and extend
  - Component-based architecture
  - Well-organized file structure

- **Admin Commands**
  - Server setup and configuration
  - Statistics and reporting
  - Ticket management

## Requirements

- Node.js v22 or higher
- Discord.js v14
- MySQL database

## Installation

1. Clone the repository
```bash
git clone https://github.com/BardoXX/discord-ticket-bot.git
cd discord-ticket-bot
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Copy the `.env.example` file to `.env` and fill in your details:
```bash
cp .env.example .env
```

Edit the `.env` file with your Discord bot token, client ID, database credentials, and guild ID.

4. Deploy commands
```bash
node scripts/deploy-commands.js
```

5. Start the bot
```bash
npm run start
```

6. Incase the database wont work run
```bash
node fix-database.js
```

## Setup Instructions

1. Invite the bot to your server with appropriate permissions (Administrator is recommended for full functionality)

2. Run the setup commands to configure the ticket system:
   - `/setup logs` - Set the channel for ticket logs
   - `/setup category` - Set the category where ticket channels will be created
   - `/setup supportrole` - Set the role that can manage tickets
   - `/setup panel` - Create a ticket panel in the current channel

3. Users can create tickets by clicking the "Create Ticket" button on the panel

## Command Reference

### Admin Commands

- `/setup` - Configure the ticket system
  - `/setup logs` - Set the log channel
  - `/setup category` - Set the ticket category
  - `/setup supportrole` - Set the support role
  - `/setup panel` - Create a ticket panel

- `/stats` - View ticket system statistics

- `/ticket` - Ticket management
  - `/ticket info <id>` - View information about a specific ticket
  - `/ticket list` - List all open tickets

### User Commands

- Users can create tickets by clicking the "Create Ticket" button
- Users can close their own tickets using the "Close Ticket" button

## Database Structure

The bot uses the following database tables:

- `tickets` - Stores ticket information
- `ticket_logs` - Stores ticket closure details and transcript links
- `settings` - Stores server configuration settings

## Extending the Bot

The modular structure makes it easy to add new features:

1. Add new commands in the `commands` directory
2. Add new button handlers in the `buttons` directory
3. Add new event handlers in the `events` directory

## License
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/BardoXX/discord-ticket-bot/blob/main/LICENSE)


[MIT](LICENSE)
