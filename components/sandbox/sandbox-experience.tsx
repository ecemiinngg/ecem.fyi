"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Minus, ShoppingCart, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductIcon from "@/components/sandbox/product-icon";
import { products, type Product } from "@/data/products";
import {
  pushViewItemList,
  pushAddToCart,
  pushRemoveFromCart,
  pushBeginCheckout,
  pushPurchase,
  type EcommerceItem,
} from "@/lib/datalayer";

interface CartLine {
  product: Product;
  quantity: number;
}

type Step = "browse" | "checkout" | "success";

function toEcommerceItem(product: Product, quantity: number): EcommerceItem {
  return {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category,
    item_brand: product.brand,
    price: product.price,
    quantity,
  };
}

export default function SandboxExperience() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [step, setStep] = useState<Step>("browse");
  const [lastOrder, setLastOrder] = useState<{
    transactionId: string;
    total: number;
  } | null>(null);

  useEffect(() => {
    pushViewItemList(
      products.map((p) => toEcommerceItem(p, 1)),
      "Sandbox Store"
    );
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
    [cart]
  );
  const itemCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart]
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    pushAddToCart(toEcommerceItem(product, 1));
  }

  function decrementLine(line: CartLine) {
    setCart((prev) => {
      if (line.quantity <= 1) {
        return prev.filter((l) => l.product.id !== line.product.id);
      }
      return prev.map((l) =>
        l.product.id === line.product.id
          ? { ...l, quantity: l.quantity - 1 }
          : l
      );
    });
    pushRemoveFromCart(toEcommerceItem(line.product, 1));
  }

  function removeLine(line: CartLine) {
    setCart((prev) => prev.filter((l) => l.product.id !== line.product.id));
    pushRemoveFromCart(toEcommerceItem(line.product, line.quantity));
  }

  function beginCheckout() {
    if (cart.length === 0) return;
    pushBeginCheckout(cart.map((l) => toEcommerceItem(l.product, l.quantity)));
    setStep("checkout");
  }

  function completePurchase() {
    const transactionId = pushPurchase(
      cart.map((l) => toEcommerceItem(l.product, l.quantity))
    );
    setLastOrder({ transactionId, total });
    setStep("success");
    setCart([]);
  }

  function startOver() {
    setStep("browse");
    setLastOrder(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        {step === "browse" && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sandbox Store</h2>
              <Badge>view_item_list fired on load</Badge>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="pixel-panel flex flex-col gap-4 rounded-md p-5"
                >
                  <div
                    className={`flex h-28 items-center justify-center rounded-xl bg-gradient-to-br ${product.gradient}`}
                  >
                    <ProductIcon
                      icon={product.icon}
                      className="h-10 w-10 text-white/90"
                    />
                  </div>
                  <div>
                    <p className="font-mono text-xs text-muted">
                      {product.brand} · {product.category}
                    </p>
                    <h3 className="mt-1 font-semibold">{product.name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {product.description}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-mono text-lg">
                      ${product.price.toFixed(2)}
                    </span>
                    <Button size="sm" onClick={() => addToCart(product)}>
                      <Plus className="h-3.5 w-3.5" /> Add to cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === "checkout" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Checkout</h2>
              <Badge>begin_checkout fired</Badge>
            </div>
            <div className="pixel-panel flex flex-col gap-4 rounded-md p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-muted">
                    Card number
                  </label>
                  <input
                    disabled
                    placeholder="4242 4242 4242 4242"
                    className="w-full rounded-lg border border-border bg-white/5 px-3 py-2.5 text-sm text-muted placeholder:text-muted/60"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-muted">
                    Expiry
                  </label>
                  <input
                    disabled
                    placeholder="12 / 29"
                    className="w-full rounded-lg border border-border bg-white/5 px-3 py-2.5 text-sm text-muted placeholder:text-muted/60"
                  />
                </div>
              </div>
              <p className="text-xs text-muted">
                No real payment infrastructure — this is a tracking sandbox.
                Clicking “Complete Purchase” fires a{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-accent-3">
                  purchase
                </code>{" "}
                event with a randomly generated transaction ID.
              </p>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-muted">Total</span>
                <span className="font-mono text-xl">${total.toFixed(2)}</span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("browse")}>
                  Back to store
                </Button>
                <Button onClick={completePurchase} className="flex-1">
                  Complete Purchase
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "success" && lastOrder && (
          <div className="pixel-panel flex flex-col items-center gap-4 rounded-md p-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-accent-3" />
            <h2 className="text-xl font-semibold">Purchase complete</h2>
            <p className="text-muted">
              Transaction{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-accent-3">
                {lastOrder.transactionId}
              </code>{" "}
              for ${lastOrder.total.toFixed(2)} — check the{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-accent-3">
                purchase
              </code>{" "}
              event in the DataLayer panel.
            </p>
            <Button onClick={startOver}>Start over</Button>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="pixel-panel rounded-md p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <ShoppingCart className="h-4 w-4 text-accent" /> Cart
            </div>
            <span className="font-mono text-xs text-muted">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
          </div>

          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Your cart is empty.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {cart.map((line) => (
                <li
                  key={line.product.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-white/5 p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-snug">
                      {line.product.name}
                    </p>
                    <p className="font-mono text-xs text-muted">
                      ${line.product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => decrementLine(line)}
                      className="rounded-md border border-border p-1 text-muted hover:text-foreground"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center font-mono text-sm">
                      {line.quantity}
                    </span>
                    <button
                      onClick={() => addToCart(line.product)}
                      className="rounded-md border border-border p-1 text-muted hover:text-foreground"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeLine(line)}
                      className="ml-1 rounded-md p-1 text-muted hover:text-rose-400"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted">Subtotal</span>
            <span className="font-mono text-lg">${total.toFixed(2)}</span>
          </div>

          <Button
            className="mt-4 w-full"
            disabled={cart.length === 0 || step !== "browse"}
            onClick={beginCheckout}
          >
            Begin Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
