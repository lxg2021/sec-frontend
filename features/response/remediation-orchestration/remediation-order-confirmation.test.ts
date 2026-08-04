import { describe, expect, it, vi } from "vitest"

import { confirmRemediationOrderWithImmediateDialogClose } from "./remediation-order-confirmation"

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (cause: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

describe("confirmRemediationOrderWithImmediateDialogClose", () => {
  it("closes the confirmation dialog before the request settles", async () => {
    const request = deferred<string>()
    const onDialogOpenChange = vi.fn()

    const result = confirmRemediationOrderWithImmediateDialogClose(
      () => request.promise,
      onDialogOpenChange,
    )

    expect(onDialogOpenChange).toHaveBeenCalledOnce()
    expect(onDialogOpenChange).toHaveBeenLastCalledWith(false)

    request.resolve("confirmed")
    await expect(result).resolves.toBe("confirmed")
    expect(onDialogOpenChange).toHaveBeenCalledOnce()
  })

  it("reopens the prepared confirmation dialog when confirmation fails", async () => {
    const request = deferred<string>()
    const onDialogOpenChange = vi.fn()

    const result = confirmRemediationOrderWithImmediateDialogClose(
      () => request.promise,
      onDialogOpenChange,
    )
    const failure = new Error("confirm failed")
    request.reject(failure)

    await expect(result).rejects.toBe(failure)
    expect(onDialogOpenChange.mock.calls).toEqual([[false], [true]])
  })
})
