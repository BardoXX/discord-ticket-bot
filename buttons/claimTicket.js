const { EmbedBuilder } = require('discord.js');
const { getPool } = require('../utils/database');

module.exports = {
  id: 'claimTicket',
  
  async execute(interaction, client) {
    const pool = getPool();
    const ticketId = interaction.customId.split(':')[1];
    const guildId = interaction.guild.id;
    
    try {
      // Check if user has permission to claim tickets
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
      
      if (!isSupportMember && !interaction.member.permissions.has('Administrator')) {
        return interaction.reply({
          content: 'You do not have permission to claim tickets',
          ephemeral: true
        });
      }
      
      // Check if ticket is already claimed
      const [ticketData] = await pool.execute(
        'SELECT claimed_by FROM tickets WHERE id = ?',
        [ticketId]
      );
      
      if (!ticketData.length) {
        return interaction.reply({
          content: 'This ticket no longer exists',
          ephemeral: true
        });
      }
      
      if (ticketData[0].claimed_by) {
        return interaction.reply({
          content: `This ticket has already been claimed by <@${ticketData[0].claimed_by}>`,
          ephemeral: true
        });
      }
      
      // Claim the ticket
      await pool.execute(
        'UPDATE tickets SET claimed_by = ? WHERE id = ?',
        [interaction.user.id, ticketId]
      );
      
      const claimEmbed = new EmbedBuilder()
        .setTitle('Ticket Claimed')
        .setDescription(`This ticket has been claimed by ${interaction.user}`)
        .setColor('#00ff00')
        .setTimestamp();
      
      await interaction.reply({ embeds: [claimEmbed] });
    } catch (error) {
      console.error('Error claiming ticket:', error);
      await interaction.reply({
        content: 'There was an error while claiming this ticket',
        ephemeral: true
      });
    }
  }
};