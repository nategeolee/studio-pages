// One file per probe holds every external URL and token. Nothing else in the page
// changes when an account arrives. Empty = not yet; the page degrades gracefully.
window.PROBE = {
  slug: "studio-operating-kit",
  studioName: "The Studio",
  form: {                                   // probe 1's form (studio/probes/listing-teardown/config.js), shared per Claude 10-29; sign-ups only, split by ref: studio-operating-kit
    action: "https://docs.google.com/forms/d/e/1FAIpQLSeg5Is7VYMFxx0avOs8JtM-OdNcFcBycQt4JIDdbY0sV8_Xmw/formResponse",
    entries: {"type": "entry.1340707020", "email": "entry.827881401", "stage": "entry.1434818323", "ref": "entry.1856666741"}
  },
  paymentLinkUrl: "",                       // Stripe Payment Link, $79 kit: waitlist only until the link exists AND the scrubbed kit is approved
  paidLabel: "Get the $79 kit",
  waitlistLabel: "Join the waitlist",
  cfBeaconToken: "9410894e9e6a44709dacf789117d0cad", // Cloudflare Web Analytics, one token for all of studio-pages
  dashboardUrl: "../"
};
