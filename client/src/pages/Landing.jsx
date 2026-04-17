import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export default function Landing() {
  const { user } = useAuth();
  const [visibleFeatures, setVisibleFeatures] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      features.forEach((_, i) => {
        setTimeout(() => {
          setVisibleFeatures(prev => [...prev, i]);
        }, i * 200);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: '👤',
      title: 'Rich Profiles',
      description: 'Showcase your skills, interests, and projects. Let others discover what makes you unique.',
      gradient: 'linear-gradient(135deg, rgba(108,92,231,0.2), rgba(108,92,231,0.05))',
    },
    {
      icon: '🔍',
      title: 'Smart Matching',
      description: 'Our algorithm finds people with similar interests and complementary skills for perfect collaborations.',
      gradient: 'linear-gradient(135deg, rgba(0,206,201,0.2), rgba(0,206,201,0.05))',
    },
    {
      icon: '⚡',
      title: 'Quick Connect',
      description: 'Send collaboration requests with project ideas. Build connections that lead to amazing projects.',
      gradient: 'linear-gradient(135deg, rgba(253,121,168,0.2), rgba(253,121,168,0.05))',
    },
    {
      icon: '👥',
      title: 'Team Formation',
      description: 'Create and manage project teams. Bring together the perfect mix of skills and expertise.',
      gradient: 'linear-gradient(135deg, rgba(0,184,148,0.2), rgba(0,184,148,0.05))',
    },
    {
      icon: '📊',
      title: 'Track History',
      description: 'Maintain records of past collaborations. Build your portfolio of teamwork experiences.',
      gradient: 'linear-gradient(135deg, rgba(253,203,110,0.2), rgba(253,203,110,0.05))',
    },
    {
      icon: '🔔',
      title: 'Real-time Updates',
      description: 'Get instant notifications when someone wants to collaborate. Never miss an opportunity.',
      gradient: 'linear-gradient(135deg, rgba(225,112,85,0.2), rgba(225,112,85,0.05))',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Students' },
    { value: '5K+', label: 'Collaborations' },
    { value: '2K+', label: 'Teams Formed' },
    { value: '50+', label: 'Universities' },
  ];

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content animate-fade-in-up">
          <h1>
            Connect. Collaborate.{' '}
            <span className="gradient-text">Create.</span>
          </h1>
          <p>
            The networking platform built for students. Discover peers with shared interests,
            form dream teams, and build projects that matter — together.
          </p>
          <div className="landing-hero-buttons">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started Free ✨
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Floating stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            marginTop: '60px',
            flexWrap: 'wrap',
          }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }} className="animate-fade-in-up" >
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: 'Space Grotesk, sans-serif',
                  background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#a0a0cc' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <h2 className="landing-features-title">
          Everything you need to{' '}
          <span className="gradient-text" style={{
            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe, #fd79a8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>collaborate effectively</span>
        </h2>

        <div className="grid-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="feature-card"
              style={{
                opacity: visibleFeatures.includes(i) ? 1 : 0,
                transform: visibleFeatures.includes(i) ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.6s ease',
              }}
            >
              <div className="feature-icon" style={{ background: feature.gradient }}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 32px',
        textAlign: 'center',
      }}>
        <div className="glass-card" style={{
          maxWidth: '700px',
          margin: '0 auto',
          padding: '60px 40px',
          background: 'linear-gradient(135deg, rgba(108,92,231,0.1), rgba(253,121,168,0.05))',
        }}>
          <h2 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '2rem',
            marginBottom: '16px',
          }}>
            Ready to find your next collaborator?
          </h2>
          <p style={{ color: '#a0a0cc', marginBottom: '32px', fontSize: '1.05rem' }}>
            Join thousands of students who are already building amazing projects together.
          </p>
          {!user && (
            <Link to="/register" className="btn btn-primary btn-lg">
              Join Student Networking Platform Today 🚀
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px 32px',
        textAlign: 'center',
        borderTop: '1px solid rgba(108,92,231,0.1)',
        color: '#6b6b99',
        fontSize: '0.85rem',
      }}>
        © 2024 Student Networking Platform. Built for students, by students. ✨
      </footer>
    </div>
  );
}
