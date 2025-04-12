const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { getPool } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup the ticket system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('logs')
        .setDescription('Set the channel for ticket logs')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send ticket logs to')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('category')
        .setDescription('Set the category for ticket channels')
        .addChannelOption(option =>
          option.setName('category')
            .setDescription('The category to create ticket channels in')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildCategory)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('supportrole')
        .setDescription('Set the support role for ticket management')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role that can manage tickets')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('panel')
        .setDescription('Create a ticket panel in the current channel')
        .addStringOption(option =>
          option.setName('title')
            .setDescription('The title of the ticket panel')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('description')
            .setDescription('The description of the ticket panel')
            .setRequired(true)
        )
    ),
    
  async execute(interaction, client) {
    const pool = getPool();
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();
    
    try {
      // Check if settings exist for this guild
      const [rows] = await pool.execute('SELECT * FROM settings WHERE guild_id = ?', [guildId]);
      const settingsExist = rows.length > 0;
      
      switch (subcommand) {
        case 'logs': {
          const logChannel = interaction.options.getChannel('channel');
          
          if (settingsExist) {
            await pool.execute(
              'UPDATE settings SET log_channel_id = ? WHERE guild_id = ?',
              [logChannel.id, guildId]
            );
          } else {
            await pool.execute(
              'INSERT INTO settings (guild_id, log_channel_id) VALUES (?, ?)',
              [guildId, logChannel.id]
            );
          }
          
          await interaction.reply({
            content: `Ticket logs will now be sent to ${logChannel}`,
            ephemeral: true
          });
          break;
        }
        
        case 'category': {
          const category = interaction.options.getChannel('category');
          
          if (settingsExist) {
            await pool.execute(
              'UPDATE settings SET ticket_category_id = ? WHERE guild_id = ?',
              [category.id, guildId]
            );
          } else {
            await pool.execute(
              'INSERT INTO settings (guild_id, ticket_category_id) VALUES (?, ?)',
              [guildId, category.id]
            );
          }
          
          await interaction.reply({
            content: `Ticket channels will now be created in the ${category.name} category`,
            ephemeral: true
          });
          break;
        }
        
        case 'supportrole': {
          const role = interaction.options.getRole('role');
          
          if (settingsExist) {
            await pool.execute(
              'UPDATE settings SET support_role_id = ? WHERE guild_id = ?',
              [role.id, guildId]
            );
          } else {
            await pool.execute(
              'INSERT INTO settings (guild_id, support_role_id) VALUES (?, ?)',
              [guildId, role.id]
            );
          }
          
          await interaction.reply({
            content: `${role} has been set as the support role for ticket management`,
            ephemeral: true
          });
          break;
        }
        
        case 'panel': {
          // Check if all required settings are configured
          const [settings] = await pool.execute(
            'SELECT log_channel_id, ticket_category_id, support_role_id FROM settings WHERE guild_id = ?', 
            [guildId]
          );
          
          if (!settings.length || !settings[0].log_channel_id || !settings[0].ticket_category_id || !settings[0].support_role_id) {
            return interaction.reply({
              content: 'Please set up the log channel, ticket category, and support role before creating a ticket panel',
              ephemeral: true
            });
          }
          
          const title = interaction.options.getString('title');
          const description = interaction.options.getString('description');
          
          const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor('#0099ff')
            .setFooter({ 
              text: interaction.guild.name, 
              iconURL: interaction.guild.iconURL({ dynamic: true }) 
            })
            .setTimestamp();
          
          const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
          
          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('createTicket:create')
                .setLabel('Create Ticket')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎫')
            );
          
          await interaction.channel.send({
            embeds: [embed],
            components: [row]
          });
          
          await interaction.reply({
            content: 'Ticket panel created successfully',
            ephemeral: true
          });
          break;
        }
      }
    } catch (error) {
      console.error('Error in setup command:', error);
      await interaction.reply({
        content: 'There was an error while setting up the ticket system',
        ephemeral: true
      });
    }
  }
};