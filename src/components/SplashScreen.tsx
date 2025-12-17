import Logo from "../assets/afroconnect-logo.png";

export default function SplashScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50 via-background to-emerald-50">
      <div className="text-center px-6">
        <div className="mx-auto h-24 w-24 rounded-2xl bg-white/70 backdrop-blur border shadow-sm flex items-center justify-center">
          <img
            src={Logo}
            alt="AfroConnect"
            className="h-16 w-16 object-contain"
          />
        </div>

        <h1 className="mt-6 text-3xl md:text-4xl font-extrabold tracking-tight">
          <span className="text-[#F66B0E]">Afro</span>
          <span className="text-[#008F5D]">Connect</span>
        </h1>

        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          Connecting Africans Globally
        </p>

        <div className="mt-8 mx-auto h-1.5 w-44 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-to-r from-orange-500 to-emerald-600 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
