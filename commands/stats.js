const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPool } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View ticket statistics'),
    
  async execute(interaction, client) {
    const pool = getPool();
    const guildId = interaction.guild.id;
    
    try {
      // Get ticket statistics
      const [openTickets] = await pool.execute(
        'SELECT COUNT(*) as count FROM tickets WHERE status = "open"'
      );
      
      const [totalTickets] = await pool.execute(
        'SELECT COUNT(*) as count FROM tickets'
      );
      
      const [avgTimeOpen] = await pool.execute(`
        SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, IFNULL(closed_at, NOW()))) as avg_hours
        FROM tickets
      `);
      
      const [topClosers] = await pool.execute(`
        SELECT closed_by, COUNT(*) as count
        FROM ticket_logs
        GROUP BY closed_by
        ORDER BY count DESC
        LIMIT 5
      `);
      
      // Create the stats embed
      const statsEmbed = new EmbedBuilder()
        .setTitle('Ticket System Statistics')
        .setColor('#0099ff')
        .setDescription('Overview of the ticket system usage')
        .addFields(
          { name: 'Open Tickets', value: openTickets[0].count.toString(), inline: true },
          { name: 'Total Tickets', value: totalTickets[0].count.toString(), inline: true },
          { name: 'Average Time Open', value: `${Math.round(avgTimeOpen[0].avg_hours || 0)} hours`, inline: true }
        )
        .setFooter({ 
          text: interaction.guild.name, 
          iconURL: interaction.guild.iconURL({ dynamic: true }) 
        })
        .setTimestamp();
      
      // Add top closers if available
      if (topClosers.length > 0) {
        let closersText = '';
        
        for (const closer of topClosers) {
          if (closer.closed_by) {
            closersText += `<@${closer.closed_by}>: ${closer.count} tickets\n`;
          }
        }
        
        if (closersText) {
          statsEmbed.addFields({ name: 'Top Ticket Closers', value: closersText });
        }
      }
      
      await interaction.reply({ embeds: [statsEmbed] });
    } catch (error) {
      console.error('Error in stats command:', error);
      await interaction.reply({
        content: 'There was an error while retrieving ticket statistics',
        ephemeral: true
      });
    }
  }
};