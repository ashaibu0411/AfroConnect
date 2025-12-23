// src/pages/HomePage.tsx
import HomeFeed from "@/components/HomeFeed";

export default function HomePage({ onRequireLogin }: { onRequireLogin: () => void }) {
  return <HomeFeed onRequireLogin={onRequireLogin} />;
}
