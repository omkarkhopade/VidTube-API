import test from "node:test"
import assert from "node:assert/strict"
import { ApiError } from "../src/utils/ApiError.js"
import { ApiResponse } from "../src/utils/ApiResponse.js"

test("ApiResponse marks successful responses", () => {
    const response = new ApiResponse(200, { ok: true }, "done")
    assert.equal(response.success, true)
    assert.equal(response.statusCode, 200)
})

test("ApiError exposes a safe API error shape", () => {
    const error = new ApiError(400, "bad request")
    assert.equal(error.statusCode, 400)
    assert.equal(error.success, false)
    assert.deepEqual(error.errors, [])
})
