const request = require("supertest")
const express = require("express")

global.fetch = jest.fn()

jest.mock("@prisma/client", () => {
  const mPrisma = {
    usuario: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  }
  return { PrismaClient: jest.fn(() => mPrisma) }
})
// jest.mock("../routes/oauthStateStore", () => {
//   const store = new Map()
//   return {
//     get: jest.fn((k) => store.get(k)),
//     set: jest.fn((k, v) => store.set(k, v)),
//     delete: jest.fn((k) => store.delete(k)),
//     _store: store, // solo para tests
//   }
// })

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

const router = require("../routes/auth")
// const oauthStateStore = require("../routes/oauthStateStore")
const app = express()
app.use(express.json())
app.use(router)

describe("POST /login", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.FIREBASE_API_KEY = "fake-api-key"
  })

  it("debería devolver 400 si falta email o password", async () => {
    const res = await request(app).post("/login").send({ email: "a@a.com" })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Missing email or password")
  })

  it("debería devolver 500 si falta FIREBASE_API_KEY", async () => {
    delete process.env.FIREBASE_API_KEY

    const res = await request(app)
      .post("/login")
      .send({ email: "a@a.com", password: "123456" })

    expect(res.status).toBe(500)
    expect(res.body.error).toContain("FIREBASE_API_KEY")
  })

  it("debería devolver 401 si Firebase rechaza las credenciales", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: "API key not valid. Please pass a valid API key." },
      }),
    })

    const res = await request(app)
      .post("/login")
      .send({ email: "a@a.com", password: "wrong" })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe(
      "API key not valid. Please pass a valid API key.",
    )
  })

  it("debería loguear usuario existente", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        idToken: "id-token",
        refreshToken: "refresh-token",
        expiresIn: "3600",
        localId: "uid-123",
        displayName: "Juan",
      }),
    })

    prisma.usuario.findFirst.mockResolvedValue({
      id: "uid-123",
      nombre: "Viejo Nombre",
      email: "a@a.com",
    })

    prisma.usuario.update.mockResolvedValue({
      id: "uid-123",
      nombre: "Juan",
      email: "a@a.com",
    })

    const res = await request(app)
      .post("/login")
      .send({ email: "a@a.com", password: "123456" })

    expect(res.status).toBe(200)
    expect(res.body.uid).toBe("uid-123")
    expect(res.body.usuario.nombre).toBe("Juan")
  })

  it("debería crear usuario nuevo si no existe", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        idToken: "id-token",
        refreshToken: "refresh-token",
        expiresIn: "3600",
        localId: "uid-new",
        displayName: "Nuevo User",
      }),
    })

    prisma.usuario.findFirst.mockResolvedValue(null)

    prisma.usuario.create.mockResolvedValue({
      id: "uid-new",
      nombre: "Nuevo User",
      email: "nuevo@a.com",
    })

    const res = await request(app)
      .post("/login")
      .send({ email: "nuevo@a.com", password: "123456" })

    expect(res.status).toBe(200)
    expect(res.body.usuario.email).toBe("nuevo@a.com")
  })

  it("debería devolver 500 si ocurre un error inesperado", async () => {
    fetch.mockImplementation(() => {
      throw new Error("Firebase down")
    })

    const res = await request(app)
      .post("/login")
      .send({ email: "a@a.com", password: "123456" })

    expect(res.status).toBe(500)
    expect(res.body.error).toContain("Internal server error")
  })
})
// describe("GET /oauth/google", () => {
//   beforeEach(() => {
//     jest.clearAllMocks()
//     process.env.FIREBASE_API_KEY = "fake-api-key"
//   })
//   it("debería devolver 500 si falta GOOGLE_CLIENT_ID", async () => {
//     delete process.env.GOOGLE_CLIENT_ID

//     const res = await request(app).get(
//       "/oauth/google?redirect_uri=https://frontend.com",
//     )

//     expect(res.status).toBe(500)
//     expect(res.text).toContain("GOOGLE_CLIENT_ID missing")
//   })
//   it("debería devolver 400 si falta redirect_uri", async () => {
//     process.env.GOOGLE_CLIENT_ID = "google-client-id"

//     const res = await request(app).get("/oauth/google")

//     expect(res.status).toBe(400)
//     expect(res.text).toBe("Missing redirect_uri query param")
//   })
//   it("debería devolver 400 si redirect_uri es inválido", async () => {
//     process.env.GOOGLE_CLIENT_ID = "google-client-id"

//     const res = await request(app).get("/oauth/google?redirect_uri=not-a-url")

//     expect(res.status).toBe(400)
//     expect(res.text).toBe("Invalid redirect_uri")
//   })
//   it("debería devolver 400 si redirect_uri no está permitido", async () => {
//     process.env.GOOGLE_CLIENT_ID = "google-client-id"
//     process.env.ALLOWED_OAUTH_REDIRECT_URIS = "https://allowed.com"

//     const res = await request(app).get(
//       "/oauth/google?redirect_uri=https://evil.com/callback",
//     )

//     expect(res.status).toBe(400)
//     expect(res.text).toBe("redirect_uri not allowed")
//   })
//   it("debería redirigir a Google con los parámetros correctos", async () => {
//     process.env.GOOGLE_CLIENT_ID = "google-client-id"
//     delete process.env.ALLOWED_OAUTH_REDIRECT_URIS

//     const res = await request(app).get(
//       "/oauth/google?redirect_uri=https://frontend.com/callback",
//     )

//     expect(res.status).toBe(302)

//     const location = res.headers.location
//     expect(location).toContain("accounts.google.com/o/oauth2/v2/auth")
//     expect(location).toContain("client_id=google-client-id")
//     expect(location).toContain("response_type=code")
//     expect(location).toContain("scope=openid")
//     expect(location).toContain("state=")
//   })
//   it("usa redirect_uri backend por defecto si no está configurado", async () => {
//     process.env.GOOGLE_CLIENT_ID = "google-client-id"
//     delete process.env.OAUTH_REDIRECT_URI

//     const res = await request(app)
//       .get("/oauth/google?redirect_uri=https://frontend.com")
//       .set("Host", "api.test.com")

//     expect(res.headers.location).toContain(
//       encodeURIComponent("http://api.test.com/api/oauth/google/callback"),
//     )
//   })
// })

// describe("GET /oauth/google/callback", () => {
//   beforeEach(() => {
//     jest.clearAllMocks()
//     process.env.FIREBASE_API_KEY = "fake-api-key"
//   })
//   it("debería devolver 400 si falta code o state", async () => {
//     const res = await request(app).get("/oauth/google/callback")

//     expect(res.status).toBe(400)
//     expect(res.text).toBe("Missing code or state")
//   })
//   it("debería devolver 400 si el state es inválido", async () => {
//     oauthStateStore.get.mockReturnValue(null)

//     const res = await request(app).get(
//       "/oauth/google/callback?code=abc&state=invalid",
//     )

//     expect(res.status).toBe(400)
//     expect(res.text).toBe("Invalid or expired state")
//   })
//   it("debería devolver 400 si el state no tiene redirectUri", async () => {
//     oauthStateStore.get.mockReturnValue({})

//     const res = await request(app).get(
//       "/oauth/google/callback?code=abc&state=state123",
//     )

//     expect(res.status).toBe(400)
//     expect(res.text).toContain("Missing original redirect_uri")
//   })
//   it("debería devolver 400 si falla el intercambio de token", async () => {
//     oauthStateStore.get.mockReturnValue({
//       redirectUri: "https://frontend.com",
//     })

//     fetch.mockResolvedValueOnce({
//       ok: false,
//       json: async () => ({ error: "invalid_grant" }),
//     })

//     const res = await request(app).get(
//       "/oauth/google/callback?code=abc&state=state123",
//     )

//     expect(res.status).toBe(400)
//     expect(res.body.error).toBe("Token exchange failed")
//   })
//   it("debería devolver 400 si el id_token es inválido", async () => {
//     oauthStateStore.get.mockReturnValue({
//       redirectUri: "https://frontend.com",
//     })

//     fetch
//       .mockResolvedValueOnce({
//         ok: true,
//         json: async () => ({
//           id_token: "bad-token",
//           access_token: "access",
//         }),
//       })
//       .mockResolvedValueOnce({
//         ok: false,
//         json: async () => ({ error: "invalid_token" }),
//       })

//     const res = await request(app).get(
//       "/oauth/google/callback?code=abc&state=state123",
//     )

//     expect(res.status).toBe(400)
//     expect(res.body.error).toBe("Invalid id_token")
//   })
//   it("debería redirigir si el usuario ya existe", async () => {
//     oauthStateStore.get.mockReturnValue({
//       redirectUri: "https://frontend.com/callback",
//     })

//     fetch
//       .mockResolvedValueOnce({
//         ok: true,
//         json: async () => ({
//           id_token: "id-token",
//           access_token: "access",
//         }),
//       })
//       .mockResolvedValueOnce({
//         ok: true,
//         json: async () => ({
//           sub: "uid-123",
//           email: "a@a.com",
//           name: "Juan",
//         }),
//       })

//     prisma.usuario.findFirst.mockResolvedValue({
//       id: "uid-123",
//       email: "a@a.com",
//       nombre: "Viejo",
//     })

//     prisma.usuario.update.mockResolvedValue({
//       id: "uid-123",
//       email: "a@a.com",
//       nombre: "Juan",
//     })

//     const res = await request(app).get(
//       "/oauth/google/callback?code=abc&state=state123",
//     )

//     expect(res.status).toBe(302)
//     expect(res.headers.location).toContain("idToken=id-token")
//     expect(res.headers.location).toContain("uid=uid-123")
//   })
//   it("debería crear usuario nuevo y redirigir", async () => {
//     oauthStateStore.get.mockReturnValue({
//       redirectUri: "https://frontend.com/callback",
//     })

//     fetch
//       .mockResolvedValueOnce({
//         ok: true,
//         json: async () => ({
//           id_token: "id-token",
//           access_token: "access",
//         }),
//       })
//       .mockResolvedValueOnce({
//         ok: true,
//         json: async () => ({
//           sub: "uid-new",
//           email: "nuevo@a.com",
//           name: "Nuevo",
//         }),
//       })

//     prisma.usuario.findFirst.mockResolvedValue(null)

//     prisma.usuario.create.mockResolvedValue({
//       id: "uid-new",
//       email: "nuevo@a.com",
//       nombre: "Nuevo",
//     })

//     const res = await request(app).get(
//       "/oauth/google/callback?code=abc&state=state123",
//     )

//     expect(res.status).toBe(302)
//     expect(res.headers.location).toContain("uid=uid-new")
//   })
//   it("debería devolver 500 ante un error inesperado", async () => {
//     oauthStateStore.get.mockImplementation(() => {
//       throw new Error("boom")
//     })

//     const res = await request(app).get(
//       "/oauth/google/callback?code=abc&state=state123",
//     )

//     expect(res.status).toBe(500)
//     expect(res.text).toBe("Internal server error")
//   })
// })
