import { Html, Head, Main, NextScript } from "next/document";
import { ColorSchemeScript } from "@mantine/core";

export default function Document() {
  return (
    <Html lang="en" style={{ backgroundColor: "#1a1b1e" }}>
      <Head>
        <meta
          name="description"
          content="Visualize and export Anilist activity history"
        />

        <meta property="og:title" content="Anilist Visualizer & Exporter" />
        <meta
          property="og:description"
          content="Visualize and export Anilist activity history"
        />
        <meta property="og:url" content="https://anistats.thelonelylands.com" />

        <meta
          property="twitter:title"
          content="Anilist Visualizer & Exporter"
        />
        <meta
          property="twitter:description"
          content="Visualize and export Anilist activity history"
        />
        <meta
          property="twitter:url"
          content="https://anistats.thelonelylands.com"
        />

        <link rel="icon" href="/favicon.ico" />
        <ColorSchemeScript />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
