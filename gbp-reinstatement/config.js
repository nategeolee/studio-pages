// One file per probe holds every external URL and token. Nothing else in the page
// changes when an account arrives. Empty = not yet; the page degrades gracefully.
window.PROBE = {
  slug: "gbp-reinstatement",
  studioName: "The Studio",
  form: {                                   // probe 1's form (studio/probes/listing-teardown/config.js), shared per Claude 10-29; split by ref: gbp-reinstatement
    action: "https://docs.google.com/forms/d/e/1FAIpQLSeg5Is7VYMFxx0avOs8JtM-OdNcFcBycQt4JIDdbY0sV8_Xmw/formResponse",
    entries: {"type": "entry.1340707020", "email": "entry.827881401", "stage": "entry.1434818323", "ref": "entry.1856666741"}
  },
  paymentLinkUrl: "",                       // Stripe Payment Link, $249 appeal packet: waitlist only until Nate's Stripe link exists
  paidLabel: "Get the $249 appeal packet",
  waitlistLabel: "Join the waitlist",
  cfBeaconToken: "9410894e9e6a44709dacf789117d0cad", // Cloudflare Web Analytics, one token for all of studio-pages
  dashboardUrl: "../",
  helpAppealsUrl: "https://support.google.com/business/answer/4569145",
  helpGuidelinesUrl: "https://support.google.com/business/answer/3038177",
  helpEligibilityUrl: "https://support.google.com/business/answer/13763036",
  helpDuplicatesUrl: "https://support.google.com/business/answer/12756178"
};
