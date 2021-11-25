require("dotenv").config();
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const express = require("express")
const client = require("./config/database.js")

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post("/register", async (req, resp) => {
  const { first_name, last_name, email, password } = req.body
  let result = null

  if(first_name === "" || last_name === "" || email === "" || password === "") {
    return resp.status(400).send("All inputs are required")
  }

  try {
    result = await client.query("SELECT * FROM users WHERE email = $1", [email])
    const existingUser = result.rows[0]
    if(existingUser) {
      return resp.status(409).send("User Already Exist. Please Login")
    }
  } catch(err) {
    console.log(err.message)
  }

  try {
    const encryptedPassword = await bcrypt.hash(password, 10)
    result = await client.query("INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id", [first_name, last_name, email, encryptedPassword])
    const lastInsertedId = result.rows[0].id

    const token = jwt.sign(
      { user_id: lastInsertedId, email },
      process.env.TOKEN_KEY,
      { expiresIn: "2h" }
    )

    // result = await client.query("UPDATE users SET token = $1 WHERE id = $2", [token, lastInsertedId])
    resp.status(201).json(result.rows[0])
  } catch(err) {
    console.log(err.message)
  }
})

app.post("/login", (req, resp) => {

})


module.exports = app
