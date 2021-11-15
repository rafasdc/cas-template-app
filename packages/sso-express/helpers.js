async function getSessionRemainingTime(keycloak, req, res) {
  // A call to getGrant() will automatically refresh it at the same time.
  const grant = await keycloak.getGrant(req, res);
  return Math.round(grant.refresh_token.content.exp - Date.now() / 1000);
}

module.exports = {
  getSessionRemainingTime
};
