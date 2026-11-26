import type { Metadata } from "next";
import { CheatCodes } from "@/components/cheats/cheat-codes";
import { Container, PageIntro } from "@/components/page-intro";

export const metadata: Metadata = { title: "Cheat codes" };

export default function CheatCodesPage() {
  return (
    <Container>
      <PageIntro title="Cheat codes">
        Every gate, law and argument form on one page. Search by name or by symbol, and switch notation to read
        everything the way your course writes it.
      </PageIntro>
      <CheatCodes />
    </Container>
  );
}
