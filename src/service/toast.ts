export function emitError(message: string) {
  const event = new CustomEvent('app:error', { detail: { message } })
  window.dispatchEvent(event)
}

export function emitUnauth() {
  const event = new CustomEvent('app:unauth')
  window.dispatchEvent(event)
}
