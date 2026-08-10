import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchTopics } from '../services/api';
import { Topic } from '../types/user';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Check, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, saveInterests } = useAuth();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTopicsData();
  }, []);

  useEffect(() => {
    // Pre-select user's existing interests if editing
    if (user?.interests && user.interests.length > 0) {
      const existingIds = user.interests.map((ui) => ui.topicId);
      setSelectedTopicIds(existingIds);
    }
  }, [user]);

  const loadTopicsData = async () => {
    try {
      setLoading(true);
      const data = await fetchTopics();
      setTopics(data);
    } catch (err) {
      console.error('Error loading topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selectedTopicIds.length < 3) return;
    try {
      setSaving(true);
      await saveInterests(selectedTopicIds);
      navigate('/', { replace: true });
    } catch (err: any) {
      alert(`Failed to save interests: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const isRequirementMet = selectedTopicIds.length >= 3;

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-[760px] mx-auto px-6 sm:px-8 pt-12 pb-20 w-full flex flex-col justify-center">
        {/* Onboarding Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.05] border border-border/50 text-[11px] font-semibold text-muted uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Personalize Your Feed</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-ink mb-3">
            What are you interested in?
          </h1>

          <p className="text-muted font-sans text-sm sm:text-base font-light max-w-[500px] mx-auto leading-relaxed">
            Choose a few topics to personalize your reading experience.
          </p>
        </div>

        {/* Topics Grid */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted" />
          </div>
        ) : (
          <div className="mb-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {topics.map((topic) => {
                const isSelected = selectedTopicIds.includes(topic.id);

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-150 flex items-center justify-between group ${
                      isSelected
                        ? 'border-ink bg-surface shadow-xs text-ink font-semibold'
                        : 'border-border/60 bg-surface/40 text-muted hover:border-ink/50 hover:text-ink font-medium'
                    }`}
                  >
                    <span className="text-xs sm:text-sm tracking-tight truncate pr-2">
                      {topic.name}
                    </span>

                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'border-ink bg-ink text-paper'
                          : 'border-border/60 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Floating Control Bar */}
        <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted font-sans">
            {selectedTopicIds.length === 0 ? (
              <span>Select at least 3 topics to continue</span>
            ) : selectedTopicIds.length < 3 ? (
              <span>Select {3 - selectedTopicIds.length} more topic(s)</span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                ✓ {selectedTopicIds.length} topics selected
              </span>
            )}
          </div>

          <button
            onClick={handleContinue}
            disabled={!isRequirementMet || saving}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
              isRequirementMet
                ? 'bg-ink text-paper hover:opacity-90 cursor-pointer'
                : 'bg-black/10 dark:bg-white/10 text-muted cursor-not-allowed'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OnboardingPage;
