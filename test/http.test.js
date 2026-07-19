import test, { after, before } from "node:test"
import assert from "node:assert/strict"
import { app } from "../src/app.js"

let server
let baseUrl

before(async () => {
    await new Promise((resolve) => {
        server = app.listen(0, "127.0.0.1", resolve)
    })
    baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test("health endpoint returns the standard response shape", async () => {
    const response = await fetch(`${baseUrl}/api/v1/healthcheck`)
    const body = await response.json()
    assert.equal(response.status, 200)
    assert.equal(body.success, true)
    assert.equal(body.message, "API is healthy")
})

test("unknown routes return JSON rather than an HTML stack page", async () => {
    const response = await fetch(`${baseUrl}/missing`)
    const body = await response.json()
    assert.equal(response.status, 404)
    assert.equal(body.success, false)
    assert.match(body.message, /Route not found/)
})
