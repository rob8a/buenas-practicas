import AppShell from "../components/layout/AppShell";

export default function PlaceholderPage({ title }) {
  return (
    <AppShell title={title}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">
          Esta pantalla se integrará en los siguientes pasos.
        </p>
      </div>
    </AppShell>
  );
}