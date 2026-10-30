/** One scroll lock and one active keyboard handler across stacked dialogs. */
const stack: symbol[] = [];
let previousOverflow = "";
let previousPadding = "";

export function isTopDialog(id: symbol): boolean {
  return stack[stack.length - 1] === id;
}

export function acquireDialog(id: symbol): () => void {
  if (stack.length === 0) {
    previousOverflow = document.body.style.overflow;
    previousPadding = document.body.style.paddingRight;
    const width = document.documentElement.clientWidth;
    const gap = width > 0 ? Math.max(0, window.innerWidth - width) : 0;
    if (gap) {
      const padding = Number.parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${padding + gap}px`;
    }
    document.body.style.overflow = "hidden";
  }
  stack.push(id);
  return () => {
    const index = stack.indexOf(id);
    if (index !== -1) stack.splice(index, 1);
    if (stack.length === 0) {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    }
  };
}
