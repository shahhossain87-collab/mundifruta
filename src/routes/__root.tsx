import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Shell } from "@/components/shell";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, interactive-widget=resizes-content" },
      { title: "Fruta e legumes em Carnaxide | MUNDIFRUTA" },
      {
        name: "description",
        content:
          "Frutas e legumes frescos em Carnaxide. Encomende por WhatsApp e levante na loja. Seg–Dom, 8h–20h.",
      },
      { name: "theme-color", content: "#134628" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,650&family=Outfit:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="pt" className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Shell>
            <Outlet />
          </Shell>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
