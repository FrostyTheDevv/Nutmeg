const Colors = {
  PRIMARY: 0x9D00FF,
  SUCCESS: 0x00b894,
  ERROR: 0xff6b6b,
  WARNING: 0xffa502,
  INFO: 0x6c5ce7,
  DARK: 0x2f3542,
  SECONDARY: 0x74b9ff,
};

const Emojis = {
  PLAY: '▶️',
  PAUSE: '⏸️',
  STOP: '⏹️',
  SKIP: '⏭️',
  BACK: '⏮️',
  VOLUME_LOW: '🔇',
  VOLUME_MID: '🔉',
  VOLUME_HIGH: '🔊',
  LOOP: '🔁',
  SHUFFLE: '🔀',
  RADIO: '📻',
  HEART: '❤️',
  HEART_EMPTY: '🤍',
  QUEUE: '📋',
  MUSIC: '🎵',
  HEADPHONES: '🎧',
  MICROPHONE: '🎤',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  CLOCK: '⏱️',
  CHART: '📊',
  SETTINGS: '⚙️',
  LOCK: '🔒',
  UNLOCK: '🔓',
  DJ: '🎙️',
  ARROW_UP: '⬆️',
  ARROW_DOWN: '⬇️',
  FIRST: '⏮️',
  LAST: '⏭️',
};

const ButtonColors = {
  PRIMARY: 1,     
  SECONDARY: 2,   
  SUCCESS: 3,     
  DANGER: 4,      
};

const MessageFlags = {
  IsComponentsV2: 1 << 20,
};

module.exports = {
  Colors,
  Emojis,
  ButtonColors,
  MessageFlags,
};