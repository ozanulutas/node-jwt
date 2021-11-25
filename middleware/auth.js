const jwt = require("jsonwebtoken")

const config = process.env

const verifyToken = (req, resp, next) => {

  const token = req.body.token || req.query.token || req.headers["x-access-token"]
  if(!token) {
    resp.status(400).send("A token is required for authentication")
    return
  }

  try {
    const decoded = jwt.verify(token, config.TOKEN_KEY)
    req.user = decoded
  } catch (err) {
    console.log(err);
    resp.status(401).send("Invalid Token")
    return
  }
  return next()
}

module.exports = verifyToken