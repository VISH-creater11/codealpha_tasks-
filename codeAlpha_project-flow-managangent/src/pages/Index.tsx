import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Zap, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    { icon: LayoutDashboard, title: 'Kanban Boards', description: 'Visualize your workflow with intuitive drag-and-drop boards.' },
    { icon: Users, title: 'Team Collaboration', description: 'Work together in real-time with your team members.' },
    { icon: Zap, title: 'Real-time Updates', description: 'See changes instantly as your team works together.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <nav className="relative z-10 max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">TaskFlow</span>
          </div>
          <Button onClick={() => navigate('/auth')}>Get Started</Button>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in">
            Manage projects <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
              the modern way
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            TaskFlow helps teams organize, track, and manage their work with beautiful Kanban boards and real-time collaboration.
          </p>
          <div className="flex gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button variant="gradient" size="xl" onClick={() => navigate('/auth')}>
              Start Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to succeed</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center gradient-primary rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">Ready to boost your productivity?</h2>
          <p className="text-primary-foreground/80 mb-8">Join thousands of teams already using TaskFlow.</p>
          <Button 
            size="xl" 
            className="bg-white text-primary hover:bg-white/90"
            onClick={() => navigate('/auth')}
          >
            Get Started for Free
          </Button>
        </div>
      </section>
    </div>
  );
}
