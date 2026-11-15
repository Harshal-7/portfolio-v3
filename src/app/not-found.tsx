import Link from "next/link";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[660px] flex-col justify-center gap-4 px-[22px] font-sans">
      <p className="text-sm text-muted">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">There’s nothing at this address.</h1>
      <p className="text-muted">
        It may have moved, or the link has a typo.{" "}
        <Link href="/" className="text-link underline underline-offset-4">
          Go to the home page
        </Link>
        .
      </p>
    </main>
  );
}
