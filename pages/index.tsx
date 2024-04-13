import { Container } from "@mantine/core";
import Head from "next/head";
import AnilistExporter from "../components/AnilistExporter";

export default function IndexPage() {
  return (
    <Container mt={50}>
      <Head>
        <title>Anilist Visualizer & Exporter</title>
      </Head>

      <AnilistExporter />
    </Container>
  );
}
