import type { Metadata } from "next";
import { Container, PageIntro } from "@/components/page-intro";
import { ModuleList } from "@/components/teach/module-list";
import { ProgressSummary } from "@/components/progress-summary";

export const metadata: Metadata = { title: "Teach" };

export default function TeachPage() {
  return (
    <Container>
      <PageIntro title="Teach">
        Six modules, each written in the language of one course. Every module ends with the same idea shown in all four
        notations. Start anywhere: nothing is locked.
      </PageIntro>
      <ProgressSummary />
      <ModuleList />
    </Container>
  );
}
