import type { Game, SiteDoc } from "./schema";

/** Small browser games, played on the separate games site. */
export const defaultGames: Game[] = [
  {
    name: "Knight’s Tour",
    what: "Move a chess knight to every square exactly once, on boards from 5×5 to 8×8.",
    meta: "Puzzle",
    href: "https://games-eight-rho.vercel.app/knights-tour",
    art: "knight",
  },
  {
    name: "Imposter",
    what: "Pass one phone around. Everyone gets the secret word except the imposter, who has to fake it.",
    meta: "Party game",
    href: "https://games-eight-rho.vercel.app/imposter",
    art: "imposter",
  },
];

/**
 * The content from the design canvas. The site serves this until the first admin
 * save, and whenever the stored document can't be read.
 * Text in [brackets] is a fact still to be filled in from the admin page.
 */
export const defaultSite: SiteDoc = {
  rev: 0,
  updatedAt: "2026-11-15T00:00:00.000Z",
  design: "notebook",
  defaultMode: "system",
  sections: {
    projects: true,
    earlier: true,
    games: true,
    about: true,
    experience: true,
    stack: true,
    contact: true,
  },
  profile: {
    name: "Harshal Shinde",
    role: "Full-stack & AI developer",
    headline: "I build full-stack and AI apps, and I write about what breaks along the way.",
    intro:
      "Mostly Next.js up front and FastAPI behind it, with AI where it earns its place: reading receipts, answering questions about your own documents, turning a typed sentence into clean data.",
    now: "Now building Evenor and Life Vault.",
    about:
      "I studied electronics and telecom, then moved into web development. Over the last two years I’ve built production apps at Impelox, BCT Consulting and now QuickAds: payment integrations, ad-platform workflows and AI image pipelines. Outside work I build my own products end to end, from the database to the interface, and I write evals so I know the AI parts actually work.",
    email: "shindeharshal009@gmail.com",
    contactLine:
      "Building something, hiring, or just want to talk about AI apps? Email is the fastest way to reach me.",
  },
  links: [
    { label: "Resume", href: "/resume" },
    { label: "Email", href: "mailto:shindeharshal009@gmail.com" },
    { label: "GitHub", href: "https://github.com/Harshal-7" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/harshal-shinde-77a862210" },
    { label: "X", href: "https://x.com/hscodez" },
  ],
  projects: [
    {
      name: "Evenor",
      tag: "Every shared bill, sorted.",
      one: "A free app for splitting trips, rent and dinners with friends, then settling up in any UPI app.",
      stack: ["Next.js PWA", "FastAPI", "Postgres + pgvector", "Redis", "Gemini"],
      status: "Live",
      liveHref: "https://evenor.in",
      codeHref: "https://github.com/Harshal-7/tripsplit",
      imageKey: "evenor",
      brand: "#FF7A59",
      bezel: "#2B1D14",
    },
    {
      name: "Life Vault",
      tag: "Ask your paperwork anything.",
      one: "Bills, warranties and agreements in one place. Ask anything, see the exact line it came from.",
      stack: ["Next.js", "FastAPI", "Redis worker", "Supabase + pgvector", "Gemini"],
      status: "Live",
      liveHref: "https://life-vault-seven.vercel.app",
      codeHref: "https://github.com/Harshal-7/life-vault",
      imageKey: "life-vault",
      brand: "#110F0D",
      bezel: "#2A2724",
    },
  ],
  earlier: [
    {
      name: "RAG chatbot with a knowledge graph",
      what: "Answers questions over a Neo4j knowledge graph and vector search, built with FastAPI, LangChain and Next.js",
      meta: "Python, LangChain",
      href: "",
    },
    {
      name: "Vinox Technologies",
      what: "Product website for a client, with the catalog in MongoDB and images on Cloudinary",
      meta: "Freelance",
      href: "https://www.vinoxtechnologies.com",
    },
    {
      name: "Flipkart clone",
      what: "Online store with a cart, live search and filters",
      meta: "Next.js, MongoDB",
      href: "https://flipkart-clone-six-alpha.vercel.app/",
    },
    {
      name: "CineBook",
      what: "Movie search with sign-in and a personal watchlist",
      meta: "Next.js, Prisma",
      href: "https://cine-book-app.vercel.app/",
    },
    {
      name: "More on GitHub",
      what: "Flashcards, auth, weather and task apps from when I was learning",
      meta: "Harshal-7",
      href: "https://github.com/Harshal-7",
    },
  ],
  games: defaultGames,
  experience: [
    {
      org: "QuickAds",
      role: "Software Developer",
      when: "Mar 2026 – now",
      what: "Built an AI fashion photoshoot platform with FastAPI and Next.js, and own Catalog Ads: Meta Marketing API workflows, bulk uploads and Shopify billing.",
    },
    {
      org: "BCT Consulting",
      role: "Software Engineer",
      when: "Dec 2025 – Mar 2026",
      what: "Full-stack work on the AFL Salary Cap platform: Angular front ends and Node.js, Express and MongoDB services with role-based APIs.",
    },
    {
      org: "Impelox Tech",
      role: "Full-Stack Developer",
      when: "Dec 2024 – Dec 2025",
      what: "Enterprise apps in Angular and NestJS, including payment gateway integrations for two major insurers.",
    },
    {
      org: "Modern Education Society’s College of Engineering",
      role: "B.E., Electronics and Telecommunications",
      when: "2019 – 2023",
      what: "",
    },
  ],
  stack: [
    { k: "Languages", v: "TypeScript, JavaScript, Python" },
    { k: "Frontend", v: "Next.js, React, Angular, Tailwind CSS, Redux, Zustand, React Query" },
    { k: "Backend", v: "Node.js, Express, NestJS, FastAPI, SQLAlchemy, REST APIs" },
    { k: "Data", v: "PostgreSQL, MongoDB, MySQL, Redis, Prisma, pgvector" },
    { k: "AI", v: "Gemini, OpenAI, LangChain, RAG, knowledge graphs, evals" },
    { k: "Platforms", v: "Stripe, Shopify App Bridge, Meta Marketing API, AWS S3" },
    { k: "Shipping", v: "Vercel, Fly.io, Supabase, Docker, GitHub Actions" },
  ],
  pixel: {
    greeting: "Hi, I’m Harshal.",
    intro:
      "I build full-stack and AI apps, and I write about what breaks along the way. Next.js up front, FastAPI behind it, AI where it earns its place.",
    ticker: "HELLO, WORLD! /// HUH? /// SHIP IT! /// 200 OK /// 404: SLEEP /// BUG? FEATURE. /// EVALS: 26/26",
    boardSeconds: 4,
  },
  // The private Blob file uploaded on 2026-11-15. Its URL needs the site's
  // credentials to read, so it's safe in code; /resume serves it.
  resume: {
    url: "https://atjoii4mk7ostpty.private.blob.vercel-storage.com/resume/Harshal_Shinde_CV-7a576c97.pdf",
    pathname: "resume/Harshal_Shinde_CV-7a576c97.pdf",
    size: 91255,
    uploadedAt: "2026-11-15T15:49:54.000Z",
  },
};
