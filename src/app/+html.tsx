import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { Colors } from '@/constants/theme';

/**
 * Root HTML shell for the static web export. The apple-* tags make the site
 * install cleanly via Safari's "Add to Home Screen": full-screen, own icon,
 * no browser chrome — as close to a native app as the web build gets.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <title>LIFE</title>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LIFE" />
        <meta name="theme-color" content={Colors.dark.background} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* Charcoal ground before the bundle loads — no white flash on launch —
            plus the handful of rules that decide whether an installed PWA
            actually fills the phone.

            `overflow-x: hidden` is the one that matters most: a single element
            even slightly wider than the viewport makes iOS Safari treat the
            page as a wide canvas, so it zooms out to fit and the whole app
            sits inset with a strip of ground down the side. It looks like the
            app "doesn't fit" when really one row is a few points too wide.

            `height: 100%` down through #root stops the layout collapsing to
            content height, and `overscroll-behavior: none` kills the
            rubber-band that reveals bare background above the top bar — the
            single clearest tell that an installed app is really a web page. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                background-color: ${Colors.dark.background};
              }
              html, body {
                margin: 0;
                overflow-x: hidden;
                overscroll-behavior: none;
              }
              #root { display: flex; flex-direction: column; }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js')); }`,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
