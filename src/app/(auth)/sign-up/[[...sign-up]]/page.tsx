import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050507] px-6 py-16">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/workflow"
        appearance={{
          elements: {
            card: "border border-white/8 bg-[#0d0d10] shadow-[0_32px_90px_rgba(0,0,0,0.55)]",
            formButtonPrimary:
              "bg-white text-black hover:bg-white/90 shadow-none",
            footerActionLink: "text-white",
            headerTitle: "text-white",
            headerSubtitle: "text-white/50",
            socialButtonsBlockButton:
              "border-white/8 bg-white/[0.03] text-white hover:bg-white/[0.06]",
            formFieldInput:
              "border-white/8 bg-white/[0.03] text-white placeholder:text-white/25",
            formFieldLabel: "text-white/65",
          },
        }}
      />
    </main>
  );
}
