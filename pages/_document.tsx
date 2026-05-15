import { Html, Head, Main, NextScript } from "next/document";

const themeInitScript = `
(function() {
  try {
    var storageKey = "yellowcollective-theme";
    var savedTheme = window.localStorage.getItem(storageKey);
    var theme = savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export default function Document() {
  return (
    <Html lang="en" data-theme="light" suppressHydrationWarning>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
