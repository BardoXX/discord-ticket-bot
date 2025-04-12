require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, '..', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" property.`);
  }
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    
    let data;
    
    // Deploy commands to the specified guild for instant testing
    if (process.env.GUILD_ID) {
      data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`Successfully reloaded ${data.length} commands for guild ${process.env.GUILD_ID}`);
    } else {
      // Global commands deployment (takes up to an hour to register)
      data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`Successfully registered ${data.length} global commands`);
    }
  } catch (error) {
    console.error(error);
  }
})();