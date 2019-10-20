const crypto = require("crypto");

module.exports = function verifySignature(payload, signature, algorithm, secret) {
  const hash = crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
};
