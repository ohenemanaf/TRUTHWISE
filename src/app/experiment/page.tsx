import type { Metadata } from "next";
import { Sandbox } from "@/components/experiment/sandbox";
import { Container, PageIntro } from "@/components/page-intro";

export const metadata: Metadata = { title: "Experiment" };

export default function ExperimentPage() {
  return (
    <Container>
      <PageIntro title="Experiment">
        Type any expression, in any course&apos;s notation, and watch its truth table, circuit and simplest form update
        as you type. Switch notation to see that the logic doesn&apos;t change.
      </PageIntro>
      <Sandbox />
    </Container>
  );
}
