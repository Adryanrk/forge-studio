import {
  ClockIcon,
  EnvelopeSimpleIcon,
  FacebookLogoIcon,
  InstagramLogoIcon,
  MapPinIcon,
  PhoneIcon,
} from "@phosphor-icons/react/dist/ssr";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "./contact-form";

const OPENING_HOURS = [
  { day: "Monday–Friday", hours: "06:00–22:00" },
  { day: "Saturday–Sunday", hours: "08:00–18:00" },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com", icon: InstagramLogoIcon },
  { label: "Facebook", href: "https://facebook.com", icon: FacebookLogoIcon },
];

export default function KontaktPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(200px,25%)_1fr] lg:gap-16">
            <Reveal>
              <p className="text-xs font-medium tracking-[0.3em] text-accent uppercase">Contact</p>
              <h1 className="mt-3 font-heading text-4xl text-foreground sm:text-5xl">
                Find us, reach out
              </h1>
            </Reveal>

            <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
              <Reveal delay={0.1} className="space-y-10">
                <div className="flex gap-4">
                  <MapPinIcon size={22} weight="light" className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <h2 className="font-heading text-lg text-foreground">Address</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Smedjegatan 12
                      <br />
                      112 34 Stockholm
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <ClockIcon size={22} weight="light" className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <h2 className="font-heading text-lg text-foreground">Opening hours</h2>
                    <dl className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                      {OPENING_HOURS.map((row) => (
                        <div key={row.day} className="flex justify-between gap-6">
                          <dt>{row.day}</dt>
                          <dd>{row.hours}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                <div className="flex gap-4">
                  <PhoneIcon size={22} weight="light" className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <h2 className="font-heading text-lg text-foreground">Phone</h2>
                    <p className="mt-1 text-sm text-muted-foreground">08-123 456 78</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <EnvelopeSimpleIcon size={22} weight="light" className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <h2 className="font-heading text-lg text-foreground">Email</h2>
                    <p className="mt-1 text-sm text-muted-foreground">hej@forgestudio.se</p>
                  </div>
                </div>

                <div className="flex gap-5 pt-2">
                  {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex size-10 items-center justify-center border border-border/70 text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                    >
                      <Icon size={18} weight="light" />
                    </a>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="border border-border/70 bg-card p-8">
                  <h2 className="font-heading text-2xl text-foreground">Send a message</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We usually reply within one business day.
                  </p>
                  <div className="mt-6">
                    <ContactForm />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
