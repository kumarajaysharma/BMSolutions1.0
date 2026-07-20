// ── Visual-to-Code Mapping ─────────────────────────────────────────
// Every drag-and-drop component maps deterministically to production
// React code. The builder state IS the single source of truth; this
// module renders it into a clean component tree.

export type BuilderComponent = {
  id: number;
  type: string;
  props: Record<string, string>;
  sortOrder: number;
};

export const COMPONENT_CATALOG: Record<
  string,
  { label: string; icon: string; defaults: Record<string, string> }
> = {
  navbar: {
    label: "Navbar",
    icon: "▤",
    defaults: { brand: "Acme", links: "Product, Pricing, Docs" },
  },
  hero: {
    label: "Hero Section",
    icon: "◆",
    defaults: {
      title: "Ship faster with Acme",
      subtitle: "The platform your team already knows how to use.",
      cta: "Get started",
    },
  },
  features: {
    label: "Feature Grid",
    icon: "▦",
    defaults: { title: "Why Acme", items: "Fast, Secure, Scalable" },
  },
  cta: {
    label: "CTA Banner",
    icon: "➤",
    defaults: { title: "Ready to launch?", button: "Start free trial" },
  },
  form: {
    label: "Contact Form",
    icon: "✎",
    defaults: { title: "Get in touch", fields: "Name, Email, Message" },
  },
  table: {
    label: "Data Table",
    icon: "☰",
    defaults: { title: "Customers", columns: "Name, Plan, Status" },
  },
  footer: {
    label: "Footer",
    icon: "▁",
    defaults: { brand: "Acme", note: "All rights reserved." },
  },
};

const pascal = (s: string) =>
  s.replace(/(^|[-_ ])(\w)/g, (_, __, c: string) => c.toUpperCase());

function componentSource(c: BuilderComponent): string {
  const p = c.props;
  switch (c.type) {
    case "navbar":
      return `export function Navbar() {
  const links = ${JSON.stringify((p.links ?? "").split(",").map((s) => s.trim()))};
  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b">
      <span className="font-bold text-lg">${p.brand ?? "Brand"}</span>
      <div className="flex gap-6 text-sm text-gray-600">
        {links.map((l) => <a key={l} href="#" className="hover:text-black">{l}</a>)}
      </div>
    </nav>
  );
}`;
    case "hero":
      return `export function Hero() {
  return (
    <section className="px-8 py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">${p.title ?? ""}</h1>
      <p className="mt-4 text-lg text-gray-600">${p.subtitle ?? ""}</p>
      <button className="mt-8 rounded-lg bg-black px-6 py-3 text-white">${p.cta ?? "Go"}</button>
    </section>
  );
}`;
    case "features":
      return `export function Features() {
  const items = ${JSON.stringify((p.items ?? "").split(",").map((s) => s.trim()))};
  return (
    <section className="px-8 py-16">
      <h2 className="text-2xl font-semibold text-center">${p.title ?? ""}</h2>
      <div className="mt-8 grid grid-cols-3 gap-6">
        {items.map((f) => (
          <div key={f} className="rounded-xl border p-6">
            <h3 className="font-medium">{f}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}`;
    case "cta":
      return `export function CtaBanner() {
  return (
    <section className="mx-8 my-12 rounded-2xl bg-black px-8 py-12 text-center text-white">
      <h2 className="text-3xl font-semibold">${p.title ?? ""}</h2>
      <button className="mt-6 rounded-lg bg-white px-6 py-3 text-black">${p.button ?? "Go"}</button>
    </section>
  );
}`;
    case "form":
      return `export function ContactForm() {
  const fields = ${JSON.stringify((p.fields ?? "").split(",").map((s) => s.trim()))};
  return (
    <section className="mx-auto max-w-md px-8 py-16">
      <h2 className="text-2xl font-semibold">${p.title ?? ""}</h2>
      <form className="mt-6 space-y-4">
        {fields.map((f) => (
          <input key={f} placeholder={f} className="w-full rounded-lg border px-4 py-2" />
        ))}
        <button type="submit" className="w-full rounded-lg bg-black py-2 text-white">Submit</button>
      </form>
    </section>
  );
}`;
    case "table":
      return `export function DataTable() {
  const columns = ${JSON.stringify((p.columns ?? "").split(",").map((s) => s.trim()))};
  return (
    <section className="px-8 py-16">
      <h2 className="text-2xl font-semibold">${p.title ?? ""}</h2>
      <table className="mt-6 w-full text-left text-sm">
        <thead><tr>{columns.map((c) => <th key={c} className="border-b p-3">{c}</th>)}</tr></thead>
        <tbody><tr>{columns.map((c) => <td key={c} className="border-b p-3 text-gray-500">—</td>)}</tr></tbody>
      </table>
    </section>
  );
}`;
    case "footer":
      return `export function Footer() {
  return (
    <footer className="border-t px-8 py-8 text-center text-sm text-gray-500">
      © ${new Date().getFullYear()} ${p.brand ?? ""}. ${p.note ?? ""}
    </footer>
  );
}`;
    default:
      return `export function ${pascal(c.type)}() { return null; }`;
  }
}

const EXPORT_NAME: Record<string, string> = {
  navbar: "Navbar",
  hero: "Hero",
  features: "Features",
  cta: "CtaBanner",
  form: "ContactForm",
  table: "DataTable",
  footer: "Footer",
};

export function generateProjectCode(
  projectName: string,
  components: BuilderComponent[]
): { path: string; code: string }[] {
  const sorted = [...components].sort((a, b) => a.sortOrder - b.sortOrder);
  const files = sorted.map((c) => ({
    path: `src/components/${EXPORT_NAME[c.type] ?? pascal(c.type)}.tsx`,
    code: `// Generated by Studio Visual Builder — single source of truth\n${componentSource(c)}\n`,
  }));
  const seen = new Set<string>();
  const unique = files.filter((f) =>
    seen.has(f.path) ? false : (seen.add(f.path), true)
  );
  const imports = [...new Set(sorted.map((c) => EXPORT_NAME[c.type]))]
    .filter(Boolean)
    .map((n) => `import { ${n} } from "./components/${n}";`)
    .join("\n");
  const tree = sorted
    .map((c) => `      <${EXPORT_NAME[c.type]} />`)
    .join("\n");
  const app = `// ${projectName} — App.tsx (generated)\n${imports}\n\nexport default function App() {\n  return (\n    <main>\n${tree}\n    </main>\n  );\n}\n`;
  return [{ path: "src/App.tsx", code: app }, ...unique];
}
