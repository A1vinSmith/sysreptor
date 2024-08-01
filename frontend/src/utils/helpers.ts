import { setWith, clone, cloneDeep } from "lodash-es";

/**
 * Immutable version of lodash.set
 */
export function setNested(obj: any, path: string|string[], value: any) {
  return setWith(clone(obj), path, value, clone);
}

export function computedThrottled<T>(fn: () => T, options: { throttle: number }) {
  const computedOriginal = computed<T>(fn);
  const valueThrottled = ref<T>(computedOriginal.value) as Ref<T>;
  watchThrottled(computedOriginal, () => {
    const val = cloneDeep(toRaw(computedOriginal.value));
    valueThrottled.value = val;
  }, { deep: true, immediate: true, throttle: options.throttle });
  return valueThrottled;
}

function* positions(node: any, isLineStart = true): Generator<{ node: Node, offset: number, text: string }> {
  let child = node.firstChild;
  let offset = 0;
  yield { node, offset, text: (!isLineStart && node.tagName === 'DIV') ? '\n' : '' };
  while (child != null) {
    if (child.nodeType === Node.TEXT_NODE) {
      yield { node: child, offset: 0 / 0, text: child.data };
      isLineStart = false;
    } else {
      isLineStart = yield * positions(child, isLineStart);
    }
    child = child.nextSibling;
    offset += 1;
    yield { node, offset, text: '' };
  }
  return isLineStart;
}

function getCaretPosition(contenteditable: HTMLElement, textPosition: number) {
  let textOffset = 0;
  let lastNode = null;
  let lastOffset = 0;
  for (const p of positions(contenteditable)) {
    if (p.text.length > textPosition - textOffset) {
      return { node: p.node, offset: p.node.nodeType === Node.TEXT_NODE ? textPosition - textOffset : p.offset };
    }
    textOffset += p.text.length;
    lastNode = p.node;
    lastOffset = p.node.nodeType === Node.TEXT_NODE ? p.text.length : p.offset;
  }
  return { node: lastNode!, offset: lastOffset };
}

export function focusElement(id?: string, options?: { scroll?: ScrollIntoViewOptions }) {
  if (id?.startsWith('#')) {
    id = id.slice(1);
  }
  if (!id) {
    return;
  }
  const idParts = id.split(':');
  id = idParts[0]!;
  const idParams = new URLSearchParams(idParts.slice(1).join(':'));

  const elField = document.getElementById(id);
  const elFieldInput = (elField?.querySelector('*[contenteditable]') || elField?.querySelector('input')) as HTMLInputElement|undefined;

  if (elField && elFieldInput) {
    const offset = Number.parseInt(idParams.get('offset') || '');
    if (!isNaN(offset) && offset >= 0) {
      const { node, offset: textOffset } = getCaretPosition(elFieldInput, offset);
      const range = document.createRange();
      range.setStart(node, textOffset);
      range.collapse(true);

      node.parentElement?.scrollIntoView(options?.scroll);
      elFieldInput.focus({ preventScroll: true });
      
      const selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range)
    } else if (options?.scroll) {
      elField.scrollIntoView(options.scroll);
      elField.focus({ preventScroll: true });
    } else {
      elFieldInput.focus();
    }
  } else if (elField) {
    elField.scrollIntoView(options?.scroll);
  }
}

export function useAutofocus(ready: Ref<any>|(() => any), fallbackId?: string) {
  const route = useRoute();

  const isMounted = ref(false);
  onMounted(() => {
    isMounted.value = true;
  });
  const isReady = ref(false);
  watch(ready, (val) => {
    isReady.value = !!val;
  }, { immediate: true });
  const isLoaded = computed(() => isMounted.value && isReady.value);

  whenever(isLoaded, async () => {
    await nextTick();
    focusElement(route.hash || fallbackId);
  }, { immediate: true, once: true });
}
