const styles = require('../utils/styles');
const formatting = require('../utils/formatting');

const builders = {
  messages: require('./messages'),
  nowPlayingCard: require('./nowPlayingCard'),
  playerControl: require('./playerControl'),
  queueDisplay: require('./queueDisplay'),
  searchResults: require('./searchResults'),
};

module.exports = {
  styles,
  formatting,
  builders,
};
