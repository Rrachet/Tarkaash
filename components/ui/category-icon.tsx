import { House, GraduationCap, Flower2, Wrench, Dumbbell, CakeSlice, PartyPopper, Plane, Soup, Sparkles, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  house: House, "graduation-cap": GraduationCap, "flower-2": Flower2, wrench: Wrench, dumbbell: Dumbbell,
  "cake-slice": CakeSlice, "party-popper": PartyPopper, plane: Plane, soup: Soup,
};

export const CATEGORY_TINTS: Record<string, string> = {
  "home-care": "bg-sky-50 text-sky-700",
  tutors: "bg-amber-50 text-amber-700",
  "beauty-wellness": "bg-rose-50 text-rose-600",
  repairs: "bg-indigo-50 text-indigo-600",
  fitness: "bg-emerald-50 text-emerald-700",
  "food-baking": "bg-orange-50 text-orange-600",
  events: "bg-fuchsia-50 text-fuchsia-600",
  "travel-tours": "bg-cyan-50 text-cyan-700",
  "home-kitchen": "bg-lime-50 text-lime-700",
};

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
