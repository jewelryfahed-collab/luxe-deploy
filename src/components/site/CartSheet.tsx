import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { metalLabel, useCart, usd } from "@/lib/store";

export function CartSheet() {
  const { items, open, setOpen, setQty, remove, subtotal } = useCart();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col bg-background sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-3xl font-normal">Your bag</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          {items.length === 0 && <p className="py-16 text-center text-muted-foreground">Your bag is waiting for something beautiful.</p>}
          {items.map((i) => (
            <div key={i.id + i.metal} className="flex gap-4 border-b pb-4">
              <img src={i.image} alt="" className="size-20 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-display text-lg leading-tight">{i.name}</p>
                <p className="text-xs text-muted-foreground">{metalLabel(i.metal)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button aria-label="Decrease" onClick={() => setQty(i.id, i.metal, i.qty - 1)} className="rounded-full border p-1"><Minus className="size-3" /></button>
                  <span className="w-6 text-center text-sm">{i.qty}</span>
                  <button aria-label="Increase" onClick={() => setQty(i.id, i.metal, i.qty + 1)} className="rounded-full border p-1"><Plus className="size-3" /></button>
                  <button aria-label="Remove" onClick={() => remove(i.id, i.metal)} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </div>
              </div>
              <p className="text-gold">{usd(i.price * i.qty)}</p>
            </div>
          ))}
        </div>
        <div className="space-y-4 border-t p-4">
          <div className="flex justify-between font-display text-2xl"><span>Subtotal</span><span className="text-gold">{usd(subtotal)}</span></div>
          <p className="text-xs text-muted-foreground">Promo codes & delivery are applied at checkout.</p>
          <Button asChild variant="luxe" size="xl" className="w-full" disabled={!items.length}>
            <Link to="/checkout" onClick={() => setOpen(false)}>Secure checkout</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
