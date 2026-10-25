// One file per probe holds every external URL and token. Nothing else in the page
// changes when an account arrives. Empty = not yet; the page degrades gracefully.
window.PROBE = {
  slug: "studio-operating-kit",
  studioName: "The Studio",
  form: null,                               // Google Form from studio/stack/form-setup.gs: not created yet (needs Nate's personal Google account). Paste {action, entries} here; entries keys: type, score, gaps, agents, email, ref.
  paymentLinkUrl: "",                       // Stripe Payment Link, $79 kit: waitlist only until the link exists AND Nate approves the scrubbed kit
  paidLabel: "Get the $79 kit",
  waitlistLabel: "Join the waitlist",
  cfBeaconToken: "9410894e9e6a44709dacf789117d0cad", // Cloudflare Web Analytics, one token for all of studio-pages (Nate 10-23)
  dashboardUrl: "../"
};
