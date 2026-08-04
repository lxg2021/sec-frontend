export async function confirmRemediationOrderWithImmediateDialogClose<T>(
  confirm: () => Promise<T>,
  onDialogOpenChange: (open: boolean) => void,
): Promise<T> {
  // Confirmation can remain in flight while polling already moves the Order
  // to running. Close the prepared-state dialog immediately so it cannot
  // render the running Order's zero ready targets as a stale confirmation.
  onDialogOpenChange(false)
  try {
    return await confirm()
  } catch (cause) {
    // The prepared Order is still retryable when the request itself fails.
    onDialogOpenChange(true)
    throw cause
  }
}
