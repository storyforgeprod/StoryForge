import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brand } from '@/components/layout/Brand';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Brand />
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-head text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">
            De historia larga a YouTube Short
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Pega tu sinopsis, elige estilo y voz. La IA genera guión, imágenes, narración y video
            9:16 en minutos.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/app">Ir al generador</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Análisis narrativo', desc: 'Claude identifica hook y cliffhanger' },
            { title: 'Visuales coherentes', desc: 'Imágenes por escena con Replicate' },
            { title: 'Video listo', desc: 'MP4 vertical para Shorts' },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
