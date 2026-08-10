import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_TOPICS = [
  'Technology',
  'Artificial Intelligence',
  'Software Development',
  'Startups',
  'Business',
  'Finance',
  'Productivity',
  'Psychology',
  'Science',
  'Health',
  'Fitness',
  'Design',
  'Books',
  'Career',
  'Education',
  'History',
  'Philosophy',
  'Travel',
  'Culture',
  'Sports',
];

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Topics
  const topicMap: Record<string, string> = {};
  for (const name of SEED_TOPICS) {
    const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    const topic = await prisma.topic.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    topicMap[name] = topic.id;
  }
  console.log(`✅ Seeded ${Object.keys(topicMap).length} topics.`);

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create primary Admin User (Aryan Gupta)
  const adminUser = await prisma.user.upsert({
    where: { email: 'aryan@veyra.dev' },
    update: { onboardingCompleted: true, role: Role.ADMIN },
    create: {
      name: 'Aryan Gupta',
      email: 'aryan@veyra.dev',
      passwordHash,
      role: Role.ADMIN,
      onboardingCompleted: true,
    },
  });

  // 3. Create sample standard User (Elena Rostova)
  const standardUser = await prisma.user.upsert({
    where: { email: 'reader@veyra.dev' },
    update: {},
    create: {
      name: 'Elena Rostova',
      email: 'reader@veyra.dev',
      passwordHash,
      role: Role.USER,
      onboardingCompleted: false,
    },
  });

  // Clear existing articles to allow idempotency
  await prisma.article.deleteMany({});

  const now = new Date();

  // Article 1: ~8 minutes ago (Productivity)
  await prisma.article.create({
    data: {
      title: 'Why We Struggle to Finish What We Start',
      slug: 'why-we-struggle-to-finish-what-we-start',
      excerpt: 'Small changes in how we approach difficult work can completely change our ability to stay consistent.',
      content: `<p>Starting something new is often exciting. Finishing it is where things become difficult.</p>
<p>In the initial phase of any project, enthusiasm masks friction. The novelty provides dopamine, momentum feels effortless, and the destination seems close. But as the work progresses, the immediate rewards fade, leaving only the quiet demand for deliberate effort.</p>
<h2>The Psychology of Friction</h2>
<p>Most people attribute incomplete projects to a lack of willpower or discipline. However, psychological research suggests that consistency is rarely about brute force. It is about managing friction points and lowering cognitive barrier to entry.</p>
<blockquote><p>"We do not rise to the level of our expectations; we fall to the level of our systems."</p></blockquote>
<p>When tasks feel monumental, the mind defaults to avoidance. By breaking down deep work into small, unassailable daily habits, the anxiety surrounding completion begins to evaporate.</p>
<h2>Focusing on the Process</h2>
<p>Shift your metric of progress from outcome milestones to consistent presence. When the daily practice becomes its own reward, finishing ceases to be a mountain and becomes the natural outcome of steady craftsmanship.</p>`,
      category: 'Productivity',
      tags: ['Productivity', 'Mindset', 'Focus'],
      readingTime: 4,
      published: true,
      authorId: adminUser.id,
      topicId: topicMap['Productivity'],
      createdAt: new Date(now.getTime() - 8 * 60 * 1000),
    },
  });

  // Article 2: ~2 hours ago (Philosophy)
  await prisma.article.create({
    data: {
      title: 'The Art of Learning Slowly',
      slug: 'the-art-of-learning-slowly',
      excerpt: 'Why understanding something deeply often matters more than learning it quickly.',
      content: `<p>We live in a culture obsessed with velocity. We skim articles, double-speed podcasts, and seek summaries of books before we even read them. Yet, true mastery has always belonged to the slow student.</p>
<h2>Depth vs Velocity</h2>
<p>When you digest information rapidly, you acquire knowledge as superficial fragments. Slow reading and deliberate contemplation allow ideas to cross-pollinate with existing memory networks, building intuition rather than mere recall.</p>
<p>To learn slowly is to accept confusion as a necessary rite of passage. It requires sitting with unanswered questions until clarity emerges organically.</p>
<h2>Cultivating Deliberate Attention</h2>
<p>Create dedicated quiet hours for reading without digital interruptions. Keep a notebook nearby to synthesize core concepts in your own words. The slower you build your intellectual foundation, the more resilient it remains.</p>`,
      category: 'Philosophy',
      tags: ['Learning', 'Depth', 'Reading'],
      readingTime: 5,
      published: true,
      authorId: adminUser.id,
      topicId: topicMap['Philosophy'],
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  });

  // Article 3: ~1 day ago (Artificial Intelligence)
  await prisma.article.create({
    data: {
      title: 'Why AI Tools Are Changing How We Learn',
      slug: 'why-ai-tools-are-changing-how-we-learn',
      excerpt: 'The shift from searching for information to working alongside intelligent tools.',
      content: `<p>For decades, learning meant finding information, memorizing rules, and practicing repetitions. With conversational AI models, the bottleneck is no longer finding information—it is asking insightful questions.</p>
<p>As intelligent agents handle boilerplate tasks, human cognitive effort shifts toward synthesis, evaluation, and creative inquiry.</p>`,
      category: 'Artificial Intelligence',
      tags: ['AI', 'Technology', 'Education'],
      readingTime: 6,
      published: true,
      authorId: adminUser.id,
      topicId: topicMap['Artificial Intelligence'],
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  });

  // Article 4: ~2 days ago (Psychology)
  await prisma.article.create({
    data: {
      title: 'Why We Procrastinate',
      slug: 'why-we-procrastinate',
      excerpt: 'Understanding the emotional root of procrastination rather than treating it as a time management flaw.',
      content: `<p>Procrastination is rarely a failure of time management. It is an emotional regulation challenge. We delay tasks not because we lack time, but because the task evokes uncomfortable emotions—fear of failure, self-doubt, or overwhelming complexity.</p>`,
      category: 'Psychology',
      tags: ['Behavior', 'Psychology'],
      readingTime: 3,
      published: true,
      authorId: adminUser.id,
      topicId: topicMap['Psychology'],
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Seed completed successfully! Admin: aryan@veyra.dev / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
