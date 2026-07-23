export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  icon: "headphones" | "watch" | "camera" | "backpack" | "laptop" | "keyboard";
  gradient: string;
  description: string;
}

export const products: Product[] = [
  {
    id: "SKU_1001",
    name: "Aura Wireless Headphones",
    brand: "Northline",
    category: "Audio",
    price: 179.99,
    icon: "headphones",
    gradient: "from-orange-400/35 to-amber-600/25",
    description: "Active noise cancelling, 40h battery, USB-C fast charge.",
  },
  {
    id: "SKU_1002",
    name: "Pulse Fitness Watch",
    brand: "Northline",
    category: "Wearables",
    price: 249.0,
    icon: "watch",
    gradient: "from-pink-400/35 to-rose-600/25",
    description: "Heart-rate, SpO2, and sleep tracking with a 10-day battery.",
  },
  {
    id: "SKU_1003",
    name: "Frame Mirrorless Camera",
    brand: "Optic Co.",
    category: "Photography",
    price: 899.0,
    icon: "camera",
    gradient: "from-lime-400/35 to-green-700/25",
    description: "24MP APS-C sensor with in-body stabilization.",
  },
  {
    id: "SKU_1004",
    name: "Transit Daypack 22L",
    brand: "Fieldgear",
    category: "Bags",
    price: 89.5,
    icon: "backpack",
    gradient: "from-yellow-400/35 to-amber-700/25",
    description: "Weatherproof shell with a padded 16” laptop sleeve.",
  },
  {
    id: "SKU_1005",
    name: "Slate Ultrabook 14",
    brand: "Compute Labs",
    category: "Computers",
    price: 1299.0,
    icon: "laptop",
    gradient: "from-orange-300/35 to-red-700/25",
    description: "14” OLED, 32GB RAM, all-day battery in a 1.1kg chassis.",
  },
  {
    id: "SKU_1006",
    name: "Keyfield Mechanical Keyboard",
    brand: "Compute Labs",
    category: "Accessories",
    price: 139.0,
    icon: "keyboard",
    gradient: "from-fuchsia-400/35 to-rose-700/25",
    description: "Hot-swappable switches, per-key RGB, USB-C detachable.",
  },
];
