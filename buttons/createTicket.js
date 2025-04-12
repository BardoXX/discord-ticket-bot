const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getPool } = require('../utils/database');

module.exports = {
  id: 'createTicket',
  
  async execute(interaction, client) {
    const pool = getPool();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    
    try {
      // Check if user already has an open ticket
      const [existingTickets] = await pool.execute(
        'SELECT channel_id FROM tickets WHERE user_id = ? AND status = "open"',
        [userId]
      );
      
      if (existingTickets.length > 0) {
        const existingChannel = interaction.guild.channels.cache.get(existingTickets[0].channel_id);
        
        if (existingChannel) {
          return interaction.reply({
            content: `You already have an open ticket: ${existingChannel}`,
            ephemeral: true
          });
        }
      }
      
      // Get settings
      const [settings] = await pool.execute(
        'SELECT ticket_category_id, support_role_id FROM settings WHERE guild_id = ?',
        [guildId]
      );
      
      if (!settings.length) {
        return interaction.reply({
          content: 'The ticket system has not been fully set up yet',
          ephemeral: true
        });
      }
      
      const { ticket_category_id, support_role_id } = settings[0];
      
      // Create ticket channel
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: ticket_category_id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id: support_role_id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ]
      });
      
      // Insert ticket into database
      const [result] = await pool.execute(
        'INSERT INTO tickets (channel_id, user_id) VALUES (?, ?)',
        [ticketChannel.id, userId]
      );
      
      const ticketId = result.insertId;
      
      // Create welcome embed for the ticket
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('Ticket Created')
        .setDescription('Stel je vraag alvast, support komt zo snel mogelijk helpen.')
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
            .setCustomId(`claimTicket:${ticketId}`)
            .setLabel('Claim Ticket')
            .setStyle(ButtonStyle.Success)
            .setEmoji('👋'),
          new ButtonBuilder()
            .setCustomId(`closeTicket:${ticketId}`)
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
        );
      
      await ticketChannel.send({
        content: `<@${userId}> <@&${support_role_id}>`,
        embeds: [welcomeEmbed],
        components: [row]
      });
      
      await interaction.reply({
        content: `Your ticket has been created: ${ticketChannel}`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.reply({
        content: 'There was an error while creating your ticket',
        ephemeral: true
      });
    }
  }
};