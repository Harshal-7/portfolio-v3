import type { SiteDoc } from "./schema";

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
      "I studied electronics and telecom, then moved into web development: a full-stack course, freelance client work, and a lot of side projects. These days I build products end to end, from the database to the interface, and I write evals so I know the AI parts actually work.",
    email: "shindeharshal009@gmail.com",
    contactLine:
      "Building something, hiring, or just want to talk about AI apps? Email is the fastest way to reach me.",
  },
  links: [
    { label: "Email", href: "mailto:shindeharshal009@gmail.com" },
    { label: "GitHub", href: "https://github.com/Harshal-7" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/harshal-shinde-77a862210" },
    { label: "X", href: "https://x.com/hscodez" },
    { label: "Résumé", href: "/resume" },
  ],
  projects: [
    {
      name: "Evenor",
      tag: "Every shared bill, sorted.",
      one: "A free app for splitting trips, rent and dinners with friends, then settling up in any UPI app.",
      stack: ["Next.js PWA", "FastAPI", "Postgres + pgvector", "Redis", "Gemini"],
      status: "Live",
      liveLabel: "evenor.in",
      liveHref: "https://evenor.in",
      codeHref: "https://github.com/Harshal-7/tripsplit",
      imageKey: "evenor",
      brand: "#FF7A59",
      bezel: "#2B1D14",
    },
    {
      name: "Life Vault",
      tag: "Ask your paperwork anything.",
      one: "Bills, warranties, insurance and rent agreements in one place. Ask a question and get the answer with the exact line it came from.",
      stack: ["Next.js", "FastAPI", "Redis worker", "Supabase + pgvector", "Gemini"],
      status: "Live",
      liveLabel: "Live app",
      liveHref: "https://life-vault-seven.vercel.app",
      codeHref: "https://github.com/Harshal-7/life-vault",
      imageKey: "life-vault",
      brand: "#110F0D",
      bezel: "#2A2724",
    },
  ],
  earlier: [
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
  experience: [
    { org: "QuickAds", role: "[Your role]", when: "[Start] – now", what: "[One line on what you build there]" },
    {
      org: "Vinox Technologies",
      role: "Freelance web developer",
      when: "Mar 2024 – [End]",
      what: "Designed, built and shipped the company’s product site with Next.js, MongoDB and Cloudinary.",
    },
    { org: "MES College of Engineering", role: "B.E., Electronics and Telecommunication", when: "2019 – 2023", what: "" },
  ],
  stack: [
    { k: "Frontend", v: "TypeScript, React, Next.js, Tailwind" },
    { k: "Backend", v: "Python, FastAPI, Node.js, Postgres, Redis" },
    { k: "AI", v: "Gemini, Claude, RAG with pgvector, evals" },
    { k: "Shipping", v: "Vercel, Fly.io, Supabase, Docker, GitHub Actions" },
  ],
  pixel: {
    greeting: "Hi, I’m Harshal.",
    intro:
      "I build full-stack and AI apps, and I write about what breaks along the way. Next.js up front, FastAPI behind it, AI where it earns its place.",
    ticker: "NOW BUILDING EVENOR + LIFE VAULT /// FULL-STACK AND AI /// BASED IN INDIA ///",
  },
  resume: null,
};
