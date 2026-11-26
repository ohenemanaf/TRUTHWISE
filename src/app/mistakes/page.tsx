import type { Metadata } from "next";
import { MistakeList } from "@/components/mistakes/mistake-list";
import { Container, PageIntro } from "@/components/page-intro";

export const metadata: Metadata = { title: "Learn from mistakes" };

export default function MistakesPage() {
  return (
    <Container narrow>
      <PageIntro title="Learn from mistakes">
        Seven errors that catch almost everyone. Each one shows the tempting reasoning, the truth table that disproves
        it, and what to do instead.
      </PageIntro>
      <MistakeList />
    </Container>
  );
}
