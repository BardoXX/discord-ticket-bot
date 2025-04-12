const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getPool } = require('../utils/database');
const { formatDate } = require('../utils/util');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('View ticket information')
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('View information about a specific ticket')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('The ID of the ticket')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all open tickets')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
  async execute(interaction, client) {
    const pool = getPool();
    const subcommand = interaction.options.getSubcommand();
    
    try {
      switch (subcommand) {
        case 'info': {
          const ticketId = interaction.options.getString('id');
          
          // Get ticket information
          const [ticketData] = await pool.execute(`
            SELECT t.*, 
                  DATE_FORMAT(t.created_at, '%Y-%m-%d %H:%i:%s') as formatted_created_at,
                  DATE_FORMAT(t.closed_at, '%Y-%m-%d %H:%i:%s') as formatted_closed_at
            FROM tickets t
            WHERE t.id = ?
          `, [ticketId]);
          
          if (!ticketData.length) {
            return interaction.reply({
              content: `No ticket found with ID ${ticketId}`,
              ephemeral: true
            });
          }
          
          const ticket = ticketData[0];
          
          // Get log information if ticket is closed
          let logData = null;
          if (ticket.status === 'closed') {
            const [logs] = await pool.execute(`
              SELECT *,
                    DATE_FORMAT(closed_at, '%Y-%m-%d %H:%i:%s') as formatted_closed_at
              FROM ticket_logs
              WHERE ticket_id = ?
              ORDER BY id DESC
              LIMIT 1
            `, [ticketId]);
            
            if (logs.length) {
              logData = logs[0];
            }
          }
          
          // Create the info embed
          const infoEmbed = new EmbedBuilder()
            .setTitle(`Ticket #${ticketId} Information`)
            .setColor(ticket.status === 'open' ? '#00ff00' : '#ff0000')
            .addFields(
              { name: 'Status', value: ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1), inline: true },
              { name: 'Created By', value: `<@${ticket.user_id}>`, inline: true },
              { name: 'Created At', value: ticket.formatted_created_at, inline: true }
            );
          
          if (ticket.claimed_by) {
            infoEmbed.addFields({ name: 'Claimed By', value: `<@${ticket.claimed_by}>`, inline: true });
          }
          
          if (ticket.status === 'closed') {
            infoEmbed.addFields({ name: 'Closed At', value: ticket.formatted_closed_at || 'Unknown', inline: true });
            
            if (logData) {
              infoEmbed.addFields(
                { name: 'Closed By', value: `<@${logData.closed_by}>`, inline: true },
                { name: 'Close Reason', value: logData.close_reason || 'No reason provided', inline: false }
              );
              
              if (logData.transcript_url) {
                infoEmbed.addFields({ name: 'Transcript', value: logData.transcript_url, inline: false });
              }
            }
          }
          
          await interaction.reply({ embeds: [infoEmbed] });
          break;
        }
        
        case 'list': {
          // Get all open tickets
          const [tickets] = await pool.execute(`
            SELECT t.*,
                  DATE_FORMAT(t.created_at, '%Y-%m-%d %H:%i:%s') as formatted_created_at
            FROM tickets t
            WHERE t.status = 'open'
            ORDER BY t.created_at DESC
          `);
          
          if (!tickets.length) {
            return interaction.reply({
              content: 'There are no open tickets',
              ephemeral: true
            });
          }
          
          // Create the list embed
          const listEmbed = new EmbedBuilder()
            .setTitle('Open Tickets')
            .setColor('#0099ff')
            .setDescription(`There are ${tickets.length} open tickets`);
          
          // Add fields for each ticket (max 25)
          for (let i = 0; i < Math.min(tickets.length, 25); i++) {
            const ticket = tickets[i];
            let fieldValue = `Created by: <@${ticket.user_id}>\n`;
            fieldValue += `Created at: ${ticket.formatted_created_at}\n`;
            
            if (ticket.claimed_by) {
              fieldValue += `Claimed by: <@${ticket.claimed_by}>`;
            } else {
              fieldValue += 'Not claimed';
            }
            
            listEmbed.addFields({
              name: `Ticket #${ticket.id}`,
              value: fieldValue,
              inline: true
            });
          }
          
          await interaction.reply({ embeds: [listEmbed] });
          break;
        }
      }
    } catch (error) {
      console.error('Error in ticket command:', error);
      await interaction.reply({
        content: 'There was an error while retrieving ticket information',
        ephemeral: true
      });
    }
  }
};