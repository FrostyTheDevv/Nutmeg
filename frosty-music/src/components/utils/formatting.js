const formatTime = (ms) => {
  if (!ms) return '0:00';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
};

const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const progressBar = (current, total, length = 20) => {
  const percentage = Math.min((current / total) * 100, 100);
  const filled = Math.round((length * percentage) / 100);
  const empty = length - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `${bar} ${Math.round(percentage)}%`;
};

const truncate = (text, maxLength = 256) => {
  return text.length > maxLength ? text.slice(0, maxLength - 3) + '...' : text;
};

const escapeMarkdown = (text) => {
  return text.replace(/([*_`~\\])/g, '\\$1');
};

const bold = (text) => `**${text}**`;
const italic = (text) => `*${text}*`;
const code = (text) => `\`${text}\``;
const codeBlock = (text, lang = '') => `\`\`\`${lang}\n${text}\n\`\`\``;
const strikethrough = (text) => `~~${text}~~`;
const underline = (text) => `__${text}__`;

module.exports = {
  formatTime,
  formatDuration,
  progressBar,
  truncate,
  escapeMarkdown,
  bold,
  italic,
  code,
  codeBlock,
  strikethrough,
  underline,
};