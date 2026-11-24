/**
 * Esc pressed inside a popover (Select list) also reaches the native <dialog> as a "cancel" request,
 * which would close the whole modal. The popover marks the Esc here; the dialog ignores a cancel that follows right after.
 */
let lastPopoverEscape = 0;

export function markPopoverEscape() {
  lastPopoverEscape = Date.now();
}

export function isPopoverEscape() {
  return Date.now() - lastPopoverEscape < 300;
}
