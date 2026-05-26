import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Palette, Type, LayoutGrid } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI creative direction',
    description: 'Turn a vague prompt into mood, tone, and a concise design summary.',
  },
  {
    icon: Palette,
    title: 'Curated palettes',
    description: 'Generate a color system that feels intentional and easy to apply.',
  },
  {
    icon: Type,
    title: 'Typography pairing',
    description: 'Suggest heading and body fonts with short usage notes.',
  },
  {
    icon: LayoutGrid,
    title: 'Composable boards',
    description: 'Work with cards, notes, and references in a polished board layout.',
  },
];

export function FeatureGrid() {
  return (
    <section className="py-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="border-slate-200 bg-white/80">
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          );
        })}
      </div>
    </section>
  );
}