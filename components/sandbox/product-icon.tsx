import {
  Headphones,
  Watch,
  Camera,
  Backpack,
  Laptop,
  Keyboard,
} from "lucide-react";
import type { Product } from "@/data/products";

const ICONS = {
  headphones: Headphones,
  watch: Watch,
  camera: Camera,
  backpack: Backpack,
  laptop: Laptop,
  keyboard: Keyboard,
};

export default function ProductIcon({
  icon,
  className,
}: {
  icon: Product["icon"];
  className?: string;
}) {
  const Icon = ICONS[icon];
  return <Icon className={className} />;
}
