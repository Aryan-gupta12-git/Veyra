import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding rich article collection...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Ensure admin user exists
  let admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Aryan Gupta',
        email: 'aryan@veyra.dev',
        passwordHash,
        role: Role.ADMIN,
        onboardingCompleted: true,
      },
    });
  }

  // Fetch all topics
  const topics = await prisma.topic.findMany();
  const topicMap = new Map(topics.map((t) => [t.slug, t.id]));

  const seedArticlesData = [
    {
      title: 'Why We Struggle to Finish What We Start',
      slug: 'why-we-struggle-to-finish-what-we-start',
      excerpt:
        'The psychology of starting projects with enthusiasm versus the quiet friction of seeing them through to the finish line.',
      content:
        '<h2>The Euphoria of Beginning</h2><p>Every new project brings a surge of possibility. When an idea strikes, our minds paint a vivid picture of the final outcome without any of the messiness required to get there. Psychologists call this hyper-optimism.</p><h2>The Dip</h2><p>In his classic work, Seth Godin describes "The Dip"—the long slog between starting and mastery where progress slows, complexity mounts, and initial excitement wears off. Crossing this chasm requires shifting from motivation to systems.</p><h2>Building Completion Habits</h2><p>To finish consistently, break projects down into tight feedback loops. Focus on momentum over perfection, and establish clear criteria for when a project is truly done.</p>',
      category: 'Productivity',
      topicSlug: 'productivity',
      tags: ['Productivity', 'Psychology', 'Focus'],
      published: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    },
    {
      title: 'The Art of Learning Slowly',
      slug: 'the-art-of-learning-slowly',
      excerpt:
        'In an age of speed-reading and 2x podcasts, deep understanding requires slowing down to digest complex ideas.',
      content:
        '<h2>Speed vs Depth</h2><p>Modern culture praises velocity. We track books read per year, podcasts listened to at double speed, and summarized key takeaways. But consuming information is not the same as absorbing insight.</p><h2>Deep Reading as Meditation</h2><p>Slowing down your reading pace allows your brain to forge connection points between new concepts and existing knowledge schemas. Great thinkers re-read classics rather than rushing through bestseller lists.</p>',
      category: 'Philosophy',
      topicSlug: 'philosophy',
      tags: ['Philosophy', 'Learning', 'Mindfulness'],
      published: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    },
    {
      title: 'Why AI Tools Are Changing How We Learn',
      slug: 'why-ai-tools-are-changing-how-we-learn',
      excerpt:
        'Generative models are turning learning from passive lecture consumption into interactive Socratic dialogues.',
      content:
        '<h2>The Shift from Retrieval to Dialogue</h2><p>For centuries, education relied on memorization and text retrieval. AI models flip this paradigm by serving as instant, personalized tutors that answer specific questions at any depth.</p><h2>Socratic Prompting</h2><p>Rather than asking AI to write answers for you, the most effective learners use models to test their own comprehension, generate counter-arguments, and explain concepts through analogies.</p>',
      category: 'Artificial Intelligence',
      topicSlug: 'ai',
      tags: ['AI', 'Technology', 'Education'],
      published: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
      title: 'Why We Procrastinate on Things That Matter Most',
      slug: 'why-we-procrastinate-on-things-that-matter-most',
      excerpt:
        'Procrastination is rarely a time management problem. It is an emotional regulation challenge tied to fear of failure.',
      content:
        '<h2>Emotional Avoidance</h2><p>We rarely procrastinate on easy, meaningless tasks. We procrastinate on the manuscript, the product design, or the difficult conversation because the stakes feel high.</p><h2>Lowering the Threshold</h2><p>To overcome creative resistance, lower the barrier to entry. Write one terrible sentence or spend five minutes outlining without judging the initial output.</p>',
      category: 'Psychology',
      topicSlug: 'psychology',
      tags: ['Psychology', 'Mindset', 'Growth'],
      published: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    },
    {
      title: 'The Future of Software Architecture in 2026',
      slug: 'the-future-of-software-architecture-in-2026',
      excerpt:
        'Modular monoliths, edge rendering, and AI-assisted compiler optimizations are reshaping how modern web apps are engineered.',
      content:
        '<h2>Beyond Microservice Sprawl</h2><p>After years of microservice complexity, engineering teams are embracing modular monoliths for faster iteration, simpler local dev setups, and zero network latency between bounded contexts.</p><h2>Edge Computing & Serverless Fluidity</h2><p>Modern runtimes blend serverless execution with persistent edge caching, delivering sub-10ms response times globally while maintaining data integrity.</p>',
      category: 'Software Development',
      topicSlug: 'software-development',
      tags: ['Engineering', 'Architecture', 'Tech'],
      published: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    },
  ];

  for (const artData of seedArticlesData) {
    const topicId = topicMap.get(artData.topicSlug) || null;

    await prisma.article.upsert({
      where: { slug: artData.slug },
      update: {
        title: artData.title,
        excerpt: artData.excerpt,
        content: artData.content,
        category: artData.category,
        tags: artData.tags,
        published: true,
        topicId,
      },
      create: {
        title: artData.title,
        slug: artData.slug,
        excerpt: artData.excerpt,
        content: artData.content,
        category: artData.category,
        tags: artData.tags,
        published: true,
        authorId: admin.id,
        topicId,
        createdAt: artData.createdAt,
      },
    });
  }

  console.log('Successfully seeded articles!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
