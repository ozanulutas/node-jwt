require("dotenv").config();
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const express = require("express")

const client = require("./config/database.js")
const auth = require("./middleware/auth.js")

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post("/register", async (req, resp) => {

  try {
    const { first_name, last_name, email, password } = req.body
    let result = null

    // Validate body
    if (first_name === "" || last_name === "" || email === "" || password === "") {
      resp.status(400).send("All inputs are required")
      return
    }

    // Check if user is already exists
    result = await client.query("SELECT * FROM users WHERE email = $1", [email])
    const existingUser = result.rows[0]
    if (existingUser) {
      resp.status(409).send("User Already Exist. Please Login")
      return
    }

    // Encrypt the password and insert the user
    const encryptedPassword = await bcrypt.hash(password, 10)
    result = await client.query("INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id", [first_name, last_name, email, encryptedPassword])
    const lastInsertedId = result.rows[0].id

    // Generate token
    const token = jwt.sign(
      { user_id: lastInsertedId, email },
      process.env.TOKEN_KEY,
      { expiresIn: "2h" }
    )

    resp.status(201).json(result.rows[0])
  } catch (err) {
    console.log(err.message)
  }
})

app.post("/login", async (req, resp) => {
  try {
    const { email, password } = req.body

    // Validate body
    if (email === "" || password === "") {
      resp.status(400).send("All inputs are required.")
      return
    }

    // Get the user
    const result = await client.query("SELECT * FROM users WHERE email = $1", [email])
    const [user] = result.rows

    // If user exists and password is match, generate token
    if(user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user.id, email },
        process.env.TOKEN_KEY,
        { expiresIn: "2h" }
      )
      user.token = token

      resp.status(200).json(user)
      return
    }

    resp.status(400).send("Invalid credentials")

  } catch (err) {
    console.log(err);
  }
})

app.post("/welcome", auth, (req, resp) => {
  resp.status(200).send("Welcome...")
})


module.exports = app
