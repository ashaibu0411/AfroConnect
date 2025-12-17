import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type Props = {
  onLogin: () => void;
  isLoggingIn: boolean;
};

export default function FooterCTA({ onLogin, isLoggingIn }: Props) {
  return (
    <div className="mt-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">
            Ready to Join the Community?
          </h2>

          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Login to unlock full access: post updates, join groups, connect with
            businesses, discover faith centers, buy and sell in the marketplace,
            and send direct messages!
          </p>

          <div className="pt-2">
            <Button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="bg-gradient-to-r from-orange-600 to-green-600 hover:opacity-90"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              {isLoggingIn ? "Connecting..." : "Login with Internet Identity"}
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground mt-6 space-y-1">
          <p>© 2024 AfroConnect. Built with ❤️ for the African diaspora.</p>
          <p>
            Powered by{" "}
            <span className="underline cursor-pointer">caffeine.ai</span>
          </p>
        </div>
      </div>
    </div>
  );
}
