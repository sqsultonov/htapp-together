import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, FileText, Users, ChevronRight, Star, Sparkles } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Interaktiv darslar",
    description: "Tushuntirish va misollar bilan boyitilgan dars materiallari",
  },
  {
    icon: FileText,
    title: "Testlar va baholash",
    description: "Bilimni sinash uchun turli xil test turlari",
  },
  {
    icon: Users,
    title: "Sinf boshqaruvi",
    description: "O'quvchilar va sinflarni oson boshqarish",
  },
  {
    icon: Star,
    title: "Natijalarni kuzatish",
    description: "O'zlashtirish ko'rsatkichlarini real vaqtda ko'rish",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">HTApp</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Kirish</Button>
            </Link>
            <Link to="/auth">
              <Button>Ro'yxatdan o'tish</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Zamonaviy o'quv platformasi
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 animate-fade-in">
            Ta'limni yangi darajaga
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              olib chiqing
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            HTApp - darslar, testlar va o'zlashtirish ko'rsatkichlarini bir platformada boshqaring. O'qituvchilar va o'quvchilar uchun qulay interfeys.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-base px-8">
                Boshlash
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-base px-8">
              Ko'proq bilish
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nima uchun HTApp?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Platformamiz o'qitish va o'rganish jarayonini soddalashtiradi
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="shadow-card border-0 hover:shadow-lg transition-all group animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="shadow-card border-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-sidebar to-sidebar-accent p-12 md:p-16 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-sidebar-foreground mb-4">
                  Bugunoq boshlang!
                </h2>
                <p className="text-sidebar-foreground/70 mb-8 max-w-2xl mx-auto">
                  Ro'yxatdan o'ting va o'quv platformasining barcha imkoniyatlaridan foydalaning
                </p>
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
                    Bepul ro'yxatdan o'tish
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">HTApp</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 HTApp. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
