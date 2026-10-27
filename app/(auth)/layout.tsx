import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Image side: 60% of the screen on desktop, hidden on small screens */}
      <aside className="relative hidden w-[60%] overflow-hidden rounded-r-[2.5rem] lg:block">
        <Image
          src="/fondo-nuevo-hd.jpg"
          alt="A truck driving through a mountain valley at sunset"
          fill
          priority
          sizes="60vw"
          quality={90}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
      </aside>

      {/* Form side */}
      <main className="flex min-h-screen w-full flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:w-[40%] lg:min-w-[460px] lg:px-12">
        <div className="mx-auto my-auto w-full max-w-md [&_.card]:border-0 [&_.card]:bg-transparent [&_.card]:p-0 [&_.card]:shadow-none">
          {children}
        </div>
      </main>
    </div>
  );
}
