// Format number with commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat().format(num);
};

// Format currency
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format relative time
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
};

// Get risk status color
export const getRiskColor = (status) => {
  const colors = {
    'Healthy': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    'At Risk': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    'Critical': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    'Churned': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' }
  };
  return colors[status] || colors['Healthy'];
};

// Get severity color
export const getSeverityColor = (severity) => {
  const colors = {
    'Low': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    'Medium': { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    'High': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    'Critical': { bg: 'bg-red-500/20', text: 'text-red-400' }
  };
  return colors[severity] || colors['Medium'];
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    'Open': { bg: 'bg-red-500/20', text: 'text-red-400' },
    'In Progress': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    'Pending': { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    'Resolved': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    'Closed': { bg: 'bg-gray-500/20', text: 'text-gray-400' }
  };
  return colors[status] || colors['Open'];
};

// Get plan tier color
export const getTierColor = (tier) => {
  const colors = {
    'Bronze': { bg: 'bg-orange-700/20', text: 'text-orange-400' },
    'Silver': { bg: 'bg-gray-400/20', text: 'text-gray-300' },
    'Gold': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    'Enterprise': { bg: 'bg-purple-500/20', text: 'text-purple-400' }
  };
  return colors[tier] || colors['Bronze'];
};

// Calculate health score color
export const getHealthScoreColor = (score) => {
  if (score >= 70) return '#10B981'; // emerald
  if (score >= 50) return '#F59E0B'; // amber
  return '#EF4444'; // red
};

// Truncate text
export const truncate = (text, length = 50) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
};
