const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { getPool } = require('../utils/database');

module.exports = {
  id: 'closeTicket',
  
  async execute(interaction, client) {
    const pool = getPool();
    const ticketId = interaction.customId.split(':')[1];
    const guildId = interaction.guild.id;
    
    try {
      // Get ticket data
      const [ticketData] = await pool.execute(
        'SELECT user_id, claimed_by FROM tickets WHERE id = ?',
        [ticketId]
      );
      
      if (!ticketData.length) {
        return interaction.reply({
          content: 'This ticket no longer exists',
          ephemeral: true
        });
      }
      
      // Get settings
      const [settings] = await pool.execute(
        'SELECT support_role_id FROM settings WHERE guild_id = ?',
        [guildId]
      );
      
      if (!settings.length) {
        return interaction.reply({
          content: 'The ticket system has not been fully set up yet',
          ephemeral: true
        });
      }
      
      const supportRoleId = settings[0].support_role_id;
      const isSupportMember = interaction.member.roles.cache.has(supportRoleId);
      const isTicketCreator = interaction.user.id === ticketData[0].user_id;
      const isAdmin = interaction.member.permissions.has('Administrator');
      
      // For admins, show a modal to add a reason
      if (isAdmin || isSupportMember) {
        const modal = new ModalBuilder()
          .setCustomId(`closeTicketModal:${ticketId}`)
          .setTitle('Close Ticket');
          
        const reasonInput = new TextInputBuilder()
          .setCustomId('closeReason')
          .setLabel('Reason for closing the ticket')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Enter the reason for closing this ticket')
          .setRequired(true)
          .setMinLength(3)
          .setMaxLength(1000);
          
        const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(firstActionRow);
        
        await interaction.showModal(modal);
      } else if (isTicketCreator) {
        // For ticket creators, close the ticket immediately
        const closeEmbed = new EmbedBuilder()
          .setTitle('Ticket Closing')
          .setDescription('This ticket will be closed in 5 seconds')
          .setColor('#ff0000')
          .setTimestamp();
        
        await interaction.reply({ embeds: [closeEmbed] });
        
        // Record the ticket closure in the database
        await pool.execute(
          'UPDATE tickets SET status = "closed", closed_at = NOW() WHERE id = ?',
          [ticketId]
        );
        
        setTimeout(async () => {
          try {
            await createTranscript(interaction, ticketId, 'User closed their ticket', client);
          } catch (error) {
            console.error('Error creating transcript:', error);
          }
        }, 5000);
      } else {
        return interaction.reply({
          content: 'You do not have permission to close this ticket',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error closing ticket:', error);
      await interaction.reply({
        content: 'There was an error while closing this ticket',
        ephemeral: true
      });
    }
  }
};

// Function to create a transcript and close the ticket
async function createTranscript(interaction, ticketId, reason, client) {
  const pool = getPool();
  
  try {
    // Create transcript using discord-html-transcripts
    const discordTranscripts = require('discord-html-transcripts');
    
    const transcript = await discordTranscripts.createTranscript(interaction.channel, {
      limit: -1,
      fileName: `ticket-${ticketId}.html`,
      poweredBy: false
    });
    
    // Get log channel
    const [settings] = await pool.execute(
      'SELECT log_channel_id FROM settings WHERE guild_id = ?',
      [interaction.guild.id]
    );
    
    if (!settings.length || !settings[0].log_channel_id) {
      return interaction.followUp({
        content: 'Log channel is not configured, but the ticket will still be closed',
        ephemeral: true
      });
    }
    
    const logChannel = interaction.guild.channels.cache.get(settings[0].log_channel_id);
    
    if (!logChannel) {
      return interaction.followUp({
        content: 'Log channel not found, but the ticket will still be closed',
        ephemeral: true
      });
    }
    
    // Get ticket data
    const [ticketData] = await pool.execute(
      'SELECT user_id FROM tickets WHERE id = ?',
      [ticketId]
    );
    
    if (!ticketData.length) {
      return;
    }
    
    // Create log embed
    const logEmbed = new EmbedBuilder()
      .setTitle(`Ticket #${ticketId} Closed`)
      .setDescription(`Ticket created by <@${ticketData[0].user_id}> has been closed`)
      .addFields(
        { name: 'Closed by', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Reason', value: reason || 'No reason provided', inline: true }
      )
      .setColor('#ff0000')
      .setTimestamp();
    
    // Send transcript to log channel
    await logChannel.send({
      embeds: [logEmbed],
      files: [transcript]
    });
    
    // Insert into ticket_logs
    await pool.execute(
      'INSERT INTO ticket_logs (ticket_id, closed_by, close_reason) VALUES (?, ?, ?)',
      [ticketId, interaction.user.id, reason]
    );
    
    // Delete the ticket channel
    await interaction.channel.delete();
  } catch (error) {
    console.error('Error in createTranscript:', error);
    await interaction.followUp({
      content: 'There was an error creating the transcript',
      ephemeral: true
    });
  }
}