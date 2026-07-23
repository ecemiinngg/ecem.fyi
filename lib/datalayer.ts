export interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_category: string;
  item_brand: string;
  price: number;
  quantity: number;
}

export interface DataLayerEntry {
  event?: string;
  ecommerce?: Record<string, unknown> | null;
  [key: string]: unknown;
}

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[];
  }
}

const DATALAYER_EVENT_NAME = "datalayer:push";
const PATCH_FLAG = "__dataLayerPatched";

export function initDataLayer() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];

  const win = window as unknown as Record<string, boolean>;
  if (win[PATCH_FLAG]) return;
  win[PATCH_FLAG] = true;

  const originalPush = Array.prototype.push.bind(window.dataLayer);
  window.dataLayer.push = ((...entries: DataLayerEntry[]) => {
    const result = originalPush(...entries);
    for (const entry of entries) {
      window.dispatchEvent(
        new CustomEvent<DataLayerEntry>(DATALAYER_EVENT_NAME, { detail: entry })
      );
    }
    return result;
  }) as typeof window.dataLayer.push;
}

export function pushToDataLayer(entry: DataLayerEntry) {
  if (typeof window === "undefined") return;
  initDataLayer();
  window.dataLayer!.push(entry);
}

/** Snapshot of everything already pushed, so a debugger UI mounting after
 * the first events fired (e.g. view_item_list on page load) can still
 * display them instead of only new pushes going forward. */
export function getDataLayerSnapshot(): DataLayerEntry[] {
  if (typeof window === "undefined") return [];
  initDataLayer();
  return [...window.dataLayer!];
}

export function subscribeToDataLayer(
  callback: (entry: DataLayerEntry) => void
) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    callback((event as CustomEvent<DataLayerEntry>).detail);
  };
  window.addEventListener(DATALAYER_EVENT_NAME, handler);
  return () => window.removeEventListener(DATALAYER_EVENT_NAME, handler);
}

/** GA4 recommends clearing the previous ecommerce object before every push
 * so GTM's ecommerce variable doesn't merge stale item arrays. */
function clearEcommerce() {
  pushToDataLayer({ ecommerce: null });
}

export function toGA4Item(item: EcommerceItem) {
  return {
    item_id: item.item_id,
    item_name: item.item_name,
    item_category: item.item_category,
    item_brand: item.item_brand,
    price: item.price,
    quantity: item.quantity,
  };
}

function sumValue(items: EcommerceItem[]) {
  return Math.round(
    items.reduce((total, item) => total + item.price * item.quantity, 0) * 100
  ) / 100;
}

export function pushViewItemList(items: EcommerceItem[], listName: string) {
  clearEcommerce();
  pushToDataLayer({
    event: "view_item_list",
    ecommerce: {
      item_list_id: listName.toLowerCase().replace(/\s+/g, "_"),
      item_list_name: listName,
      items: items.map(toGA4Item),
    },
  });
}

export function pushAddToCart(item: EcommerceItem) {
  clearEcommerce();
  pushToDataLayer({
    event: "add_to_cart",
    ecommerce: {
      currency: "USD",
      value: sumValue([item]),
      items: [toGA4Item(item)],
    },
  });
}

export function pushRemoveFromCart(item: EcommerceItem) {
  clearEcommerce();
  pushToDataLayer({
    event: "remove_from_cart",
    ecommerce: {
      currency: "USD",
      value: sumValue([item]),
      items: [toGA4Item(item)],
    },
  });
}

export function pushBeginCheckout(items: EcommerceItem[]) {
  clearEcommerce();
  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: "USD",
      value: sumValue(items),
      items: items.map(toGA4Item),
    },
  });
}

export function pushPurchase(items: EcommerceItem[]) {
  clearEcommerce();
  const transactionId = `T_${Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0")}`;
  pushToDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: transactionId,
      currency: "USD",
      value: sumValue(items),
      shipping: 0,
      tax: Math.round(sumValue(items) * 0.08 * 100) / 100,
      items: items.map(toGA4Item),
    },
  });
  return transactionId;
}
