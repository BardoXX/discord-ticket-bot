const { getPool } = require('../utils/database');
const { EmbedBuilder } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('closeTicketModal:')) {
        const ticketId = interaction.customId.split(':')[1];
        const reason = interaction.fields.getTextInputValue('closeReason');
        
        await handleTicketClose(interaction, ticketId, reason, client);
      }
    }
  }
};

async function handleTicketClose(interaction, ticketId, reason, client) {
  const pool = getPool();
  
  try {
    // Update the ticket status in the database
    await pool.execute(
      'UPDATE tickets SET status = "closed", closed_at = NOW(), close_reason = ? WHERE id = ?',
      [reason, ticketId]
    );
    
    const closeEmbed = new EmbedBuilder()
      .setTitle('Ticket Closing')
      .setDescription(`This ticket will be closed in 5 seconds\n\nReason: ${reason}`)
      .setColor('#ff0000')
      .setTimestamp();
    
    await interaction.reply({ embeds: [closeEmbed] });
    
    setTimeout(async () => {
      try {
        // Create transcript
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
          return;
        }
        
        const logChannel = interaction.guild.channels.cache.get(settings[0].log_channel_id);
        
        if (!logChannel) {
          return;
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
            { name: 'Reason', value: reason, inline: true }
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
          'INSERT INTO ticket_logs (ticket_id, closed_by, close_reason, closed_at) VALUES (?, ?, ?, NOW())',
          [ticketId, interaction.user.id, reason]
        );
        
        // Delete the ticket channel
        await interaction.channel.delete();
      } catch (error) {
        console.error('Error in transcript creation:', error);
      }
    }, 5000);
  } catch (error) {
    console.error('Error closing ticket:', error);
    await interaction.reply({
      content: 'There was an error while closing this ticket',
      ephemeral: true
    });
  }
}