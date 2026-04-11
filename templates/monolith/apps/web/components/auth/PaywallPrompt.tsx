import Link from 'next/link';

// Paywall prompt component for {{projectName}}.
//
// Displayed by `<RoleGate />` when the signed-in user's role doesn't meet
// the required tier. The visual is intentionally spartan — Story 4.3
// adds shadcn/ui styling. Until then this renders a minimal CTA card
// that users can restyle or replace wholesale.
export function PaywallPrompt() {
  return (
    <div
      role="region"
      aria-label="Upgrade required"
      style={{
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        textAlign: 'center',
      }}
    >
      <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>Upgrade required</h2>
      <p style={{ margin: 0, marginBottom: '1rem', opacity: 0.8 }}>
        This feature is part of the paid plan. Upgrade to continue.
      </p>
      <Link
        href="/dashboard/billing"
        style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          backgroundColor: '#2563eb',
          color: '#fff',
          borderRadius: '0.375rem',
          textDecoration: 'none',
        }}
      >
        View plans
      </Link>
    </div>
  );
}
