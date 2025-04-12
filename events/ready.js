const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    
    // Deploy slash commands
    try {
      const commands = [];
      const commandsPath = path.join(__dirname, '..', 'commands');
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command) {
          commands.push(command.data.toJSON());
        }
      }
      
      const rest = new REST().setToken(process.env.TOKEN);
      
      console.log(`Started refreshing ${commands.length} application (/) commands.`);
      
      // Deploy commands to the specified guild
      if (process.env.GUILD_ID) {
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
          { body: commands }
        );
        console.log(`Successfully reloaded application commands for guild ${process.env.GUILD_ID}`);
      } else {
        // Global commands deployment (takes up to an hour to register)
        await rest.put(
          Routes.applicationCommands(process.env.CLIENT_ID),
          { body: commands }
        );
        console.log('Successfully registered application commands globally');
      }
      
      // Set bot status
      client.user.setPresence({
        activities: [{ name: 'ticket support', type: 2 }],
        status: 'online'
      });
      
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }
};