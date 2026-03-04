async function connectRedis() {
  console.log('⚠️  Redis disabled — using MongoDB only');
}

function getRedis() {
  return null;
}

module.exports = { connectRedis, getRedis };