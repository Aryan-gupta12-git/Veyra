import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Github, Linkedin, Mail, Rss } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border py-14 mt-20 text-xs font-sans text-muted bg-paper transition-colors duration-200">
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8 space-y-10">
        {/* Top Grid Section: About Us & Social Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* About Us Column */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-normal tracking-tight text-ink">
                Veyra
              </span>
            </div>
            <p className="text-muted text-xs font-light leading-relaxed max-w-lg">
              Veyra is a distraction-free publishing platform dedicated to deep focus, long-form essays, and thoughtful perspectives across technology, philosophy, science, and culture.
            </p>
          </div>

          {/* Navigation Links Column */}
          <div className="md:col-span-2 space-y-2.5">
            <h4 className="text-[11px] font-sans font-semibold tracking-widest text-ink uppercase">
              Explore
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/" className="hover:text-ink transition-colors">
                  All Articles
                </Link>
              </li>
              <li>
                <a href="#privacy" className="hover:text-ink transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-ink transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-[11px] font-sans font-semibold tracking-widest text-ink uppercase">
              Connect With Us
            </h4>
            <div className="flex items-center gap-2.5">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl border border-border/80 bg-surface/80 hover:border-ink hover:text-ink text-muted flex items-center justify-center transition-all shadow-xs"
                title="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>

              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl border border-border/80 bg-surface/80 hover:border-ink hover:text-ink text-muted flex items-center justify-center transition-all shadow-xs"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl border border-border/80 bg-surface/80 hover:border-ink hover:text-ink text-muted flex items-center justify-center transition-all shadow-xs"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>

              <a
                href="mailto:contact@veyra.dev"
                className="w-9 h-9 rounded-xl border border-border/80 bg-surface/80 hover:border-ink hover:text-ink text-muted flex items-center justify-center transition-all shadow-xs"
                title="Email Us"
              >
                <Mail className="w-4 h-4" />
              </a>

              <a
                href="#rss"
                className="w-9 h-9 rounded-xl border border-border/80 bg-surface/80 hover:border-ink hover:text-ink text-muted flex items-center justify-center transition-all shadow-xs"
                title="RSS Feed"
              >
                <Rss className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted">
          <span>© {new Date().getFullYear()} Veyra. All rights reserved.</span>
          <span>Designed for deep focus & mindful reading.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
