/**
 * Format a date to a readable string
 * @param {Date} date The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
  
  /**
   * Checks if a user has the required permissions
   * @param {Object} member Guild member object
   * @param {Array} requiredPermissions Array of permission flags
   * @returns {boolean} Whether the user has the required permissions
   */
  function hasPermissions(member, requiredPermissions) {
    return member.permissions.has(requiredPermissions);
  }
  
  /**
   * Checks if a user has a specific role
   * @param {Object} member Guild member object
   * @param {string} roleId ID of the role to check for
   * @returns {boolean} Whether the user has the role
   */
  function hasRole(member, roleId) {
    return member.roles.cache.has(roleId);
  }
  
  /**
   * Generate a random ticket ID
   * @returns {string} Random ticket ID
   */
  function generateTicketId() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  
  module.exports = {
    formatDate,
    hasPermissions,
    hasRole,
    generateTicketId
  };