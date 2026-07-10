import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getPurchase } from "@/services/purchasesService";
import { createReview } from "@/services/reviewsService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { Copy, Wand2, Star } from "lucide-react";

export const Route = createFileRoute("/purchases/$id")({ component: PurchaseDetail });

function PurchaseDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["purchase", id], queryFn: () => getPurchase(id) });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!data?.purchase || !data.listing || !data.secret) return <div className="max-w-4xl mx-auto px-6 py-16">Loading…</div>;
  const { listing, secret } = data;

  function copy(text: string) { navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); }

  async function submitReview() {
    if (!user) return;
    await createReview(id, rating, comment);
    setSubmitted(true);
    toast.success("Review posted");
    qc.invalidateQueries();
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <span className="label-eyebrow">Recipe</span>
          <h1 className="font-display text-3xl mt-2">{listing.title}</h1>
        </div>

        <section className="border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="label-eyebrow">Full prompt</span>
            <Button size="sm" variant="ghost" onClick={() => copy(secret.fullPrompt)}><Copy /> Copy</Button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-sm mt-3">{secret.fullPrompt}</pre>
        </section>

        <section className="border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="label-eyebrow">Negative prompt</span>
            <Button size="sm" variant="ghost" onClick={() => copy(secret.negativePrompt)}><Copy /> Copy</Button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-sm mt-3">{secret.negativePrompt}</pre>
        </section>

        <section className="border border-border bg-card p-5">
          <span className="label-eyebrow">Settings</span>
          <table className="w-full mt-3 text-sm">
            <tbody>
              {Object.entries(secret.settings).map(([k, v]) => (
                <tr key={k} className="border-t border-border">
                  <td className="py-2 label-eyebrow">{k}</td>
                  <td className="py-2 font-mono">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="border border-border bg-card p-5">
          <span className="label-eyebrow">Usage notes</span>
          <p className="text-sm mt-3">{secret.usageNotes}</p>
        </section>

        <section>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="label-eyebrow">Advertised preview</span>
              <ImagePlaceholder id={listing.previewImages[0]} ratio="aspect-square" />
            </div>
            <div>
              <span className="label-eyebrow">Your generated result</span>
              <div className="aspect-square border border-dashed border-border flex items-center justify-center text-neutral-gray text-sm">
                Not generated yet
              </div>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block mt-4">
                  <Button disabled variant="signal"><Wand2 /> Generate Test Image</Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Image generation API connects later.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="border border-border bg-card p-5">
          <span className="label-eyebrow">Leave a verified review</span>
          {submitted ? (
            <div className="mt-4 border border-teal bg-teal/5 p-6 text-center">
              <div className="mx-auto h-14 w-14 border border-teal flex items-center justify-center label-eyebrow mb-2">Lottie</div>
              <p className="text-teal font-medium">Thank you — review posted.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)}>
                    <Star className={"h-6 w-6 " + (n <= rating ? "fill-ink text-ink" : "text-neutral-gray")} />
                  </button>
                ))}
              </div>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How reproducible was it?" />
              <Button className="w-full" onClick={submitReview}>Submit review</Button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
