import bcrypt from "bcryptjs"
import cors from "cors"
import express from "express"
import jwt from "jsonwebtoken"
import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDirectory = path.join(__dirname, "data")
const usersFile = path.join(dataDirectory, "users.json")

const port = Number(process.env.PORT ?? 3000)
const tokenTtl = process.env.TOKEN_TTL ?? "1h"
const jwtSecret = process.env.JWT_SECRET ?? "local-dev-secret"
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGIN ??
    "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
)

const app = express()

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`))
    },
    credentials: true,
  })
)
app.use(express.json())

const sanitiseUser = ({ passwordHash, ...user }) => user

const validateCredentials = ({ username, email, password }, requireUsername) => {
  if (requireUsername && (!username || username.trim().length < 3)) {
    return "Username must be at least 3 characters long."
  }

  if (!email || !email.includes("@")) {
    return "A valid email is required."
  }

  if (!password || password.length < 6) {
    return "Password must be at least 6 characters long."
  }

  return null
}

const issueAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
    },
    jwtSecret,
    { expiresIn: tokenTtl }
  )

const ensureUserStore = async () => {
  await mkdir(dataDirectory, { recursive: true })

  try {
    await readFile(usersFile, "utf8")
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error
    }

    const demoUser = {
      id: randomUUID(),
      username: "demo",
      email: "demo@example.com",
      passwordHash: await bcrypt.hash("password123", 10),
      createdAt: new Date().toISOString(),
    }

    await writeFile(usersFile, JSON.stringify([demoUser], null, 2))
    console.log("Seeded demo account: demo@example.com / password123")
  }
}

const readUsers = async () => {
  await ensureUserStore()
  const raw = await readFile(usersFile, "utf8")
  return JSON.parse(raw)
}

const writeUsers = async (users) => {
  await mkdir(dataDirectory, { recursive: true })
  await writeFile(usersFile, JSON.stringify(users, null, 2))
}

const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing bearer token." })
    return
  }

  const token = authorization.slice("Bearer ".length)

  try {
    const payload = jwt.verify(token, jwtSecret)
    const users = await readUsers()
    const user = users.find((entry) => entry.id === payload.sub)

    if (!user) {
      res.status(401).json({ message: "User no longer exists." })
      return
    }

    req.user = user
    next()
  } catch {
    res.status(401).json({ message: "Invalid or expired token." })
  }
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
})

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const username = req.body.username?.trim()
    const email = req.body.email?.trim().toLowerCase()
    const password = req.body.password

    const validationError = validateCredentials(
      { username, email, password },
      true
    )

    if (validationError) {
      res.status(400).json({ message: validationError })
      return
    }

    const users = await readUsers()
    const existingUser = users.find((user) => user.email === email)

    if (existingUser) {
      res.status(409).json({ message: "An account with that email already exists." })
      return
    }

    const user = {
      id: randomUUID(),
      username,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: new Date().toISOString(),
    }

    users.push(user)
    await writeUsers(users)

    res.status(201).json({
      message: "User registered successfully.",
      user: sanitiseUser(user),
    })
  } catch (error) {
    next(error)
  }
})

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase()
    const password = req.body.password

    const validationError = validateCredentials(
      { email, password, username: "placeholder" },
      false
    )

    if (validationError) {
      res.status(400).json({ message: validationError })
      return
    }

    const users = await readUsers()
    const user = users.find((entry) => entry.email === email)

    if (!user) {
      res.status(401).json({ message: "Invalid email or password." })
      return
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatches) {
      res.status(401).json({ message: "Invalid email or password." })
      return
    }

    res.json({
      accessToken: issueAccessToken(user),
      user: sanitiseUser(user),
    })
  } catch (error) {
    next(error)
  }
})

app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({ user: sanitiseUser(req.user) })
})

app.post("/api/auth/logout", (_req, res) => {
  res.status(204).send()
})

app.get("/api/protected/ping", authenticate, (req, res) => {
  res.json({
    message: "Authenticated request succeeded.",
    user: sanitiseUser(req.user),
  })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: "Internal server error." })
})

ensureUserStore()
  .then(() => {
    app.listen(port, () => {
      console.log(`Auth API listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error("Failed to start auth API", error)
    process.exit(1)
  })
