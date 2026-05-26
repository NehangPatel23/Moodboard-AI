import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ExampleBoardPreview() {
  return (
    <section className="py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Example board</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Designed to feel like a premium creative artifact.
          </h2>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 bg-white/85">
        <CardHeader className="border-b border-slate-200/80 bg-slate-50/80">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Calm luxury</Badge>
            <Badge variant="secondary">Wellness</Badge>
            <Badge variant="secondary">Editorial</Badge>
          </div>
          <CardTitle className="mt-3 text-2xl">Soft Luxury Wellness</CardTitle>
          <CardDescription>
            A calm, elevated identity built around restraint, warmth, and trust.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Palette</p>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {['#F7F2EB', '#A8B5A2', '#B89A6A', '#2D2A26'].map((color) => (
                <div key={color} className="space-y-2">
                  <div className="h-16 rounded-2xl border border-slate-200" style={{ backgroundColor: color }} />
                  <p className="text-[11px] text-slate-500 break-all">{color}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Typography</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-950">Cormorant Garamond</p>
                <p className="text-sm text-slate-500">Heading</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-950">Inter</p>
                <p className="text-sm text-slate-500">Body</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Direction</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Soft textures, generous spacing, warm neutrality, and restrained premium accents.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}