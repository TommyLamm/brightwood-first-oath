/** Keyboard containment for full-screen cards; ordinary game panels keep their existing behavior. */
export function createScreenModalFocus(layer: HTMLElement, backgrounds: readonly HTMLElement[]) {
  const document = layer.ownerDocument;
  let open = false;
  let previousFocus: HTMLElement | null = null;
  const previousInert = new Map<HTMLElement, boolean>();

  const focusCard = (): void => {
    if (layer.contains(document.activeElement)) return;
    const card = layer.querySelector<HTMLElement>('[role="dialog"]');
    const input = card?.querySelector<HTMLElement>('input:not(:disabled), textarea:not(:disabled)');
    (input ?? card)?.focus({ preventScroll: true });
  };

  const restoreBackground = (): void => {
    for (const [element, inert] of previousInert) element.inert = inert;
    previousInert.clear();
  };

  return {
    sync(): void {
      const nextOpen = !layer.hidden;
      if (nextOpen && !open) {
        previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        for (const element of backgrounds) {
          previousInert.set(element, element.inert);
          element.inert = true;
        }
      } else if (!nextOpen && open) {
        restoreBackground();
        if (previousFocus?.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus({ preventScroll: true });
        previousFocus = null;
      }
      open = nextOpen;
      if (open) focusCard();
    },
    onKeyDown(event: KeyboardEvent): void {
      if (!open || event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey) return;
      const controls = Array.from(layer.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, a[href], summary, [tabindex]',
      )).filter((element) => element.tabIndex >= 0 && !element.matches(':disabled')
        && !element.closest('[hidden], [inert]') && element.getClientRects().length > 0
        && getComputedStyle(element).visibility !== 'hidden');
      const activeIndex = controls.indexOf(document.activeElement as HTMLElement);
      if (controls.length === 0) {
        event.preventDefault();
        focusCard();
      } else if (activeIndex < 0 || (event.shiftKey ? activeIndex === 0 : activeIndex === controls.length - 1)) {
        event.preventDefault();
        controls[event.shiftKey ? controls.length - 1 : 0]!.focus();
      }
    },
    dispose(): void { restoreBackground(); },
  };
}
