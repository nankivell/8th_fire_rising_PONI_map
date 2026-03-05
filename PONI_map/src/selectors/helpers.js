/**
 * Some handy helpers
 */

/**
 * Given an event and a time range,
 * returns true/false if the event falls within timeRange
 */
export function hasValidDatetime(event) {
  if (!event || !event.datetime) return false;
  return event.datetime instanceof Date && !Number.isNaN(event.datetime.valueOf());
}

export function isTimeRangedIn(event, timeRange) {
  if (!hasValidDatetime(event)) return false;
  const eventTime = event.datetime;
  return timeRange[0] < eventTime && eventTime < timeRange[1];
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 * https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 */
export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
