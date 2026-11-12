// Datenbank-Migrationen. Werden beim ersten Datenbankzugriff automatisch (idempotent) ausgeführt.
// Neue Migrationen immer am Ende anhängen – bestehende nie nachträglich ändern.

export interface Migration {
  id: string
  sql: string
}

export const MIGRATIONS: Migration[] = [
  {
    id: "001_init",
    sql: String.raw`
-- GLANZMOBIL – Datenbankschema (PostgreSQL ≥ 14, kompatibel mit Supabase und PGlite)
-- Alle Zeitpunkte werden als timestamptz (UTC) gespeichert; die Geschäftslogik rechnet in Europe/Vienna.

-- ─── Einstellungen (Buchungsregeln, Kontaktdaten, Einsatzgebiet) ───────────────
CREATE TABLE IF NOT EXISTS settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Fahrzeugkategorien ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicle_categories (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort        integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true
);

-- ─── Leistungen / Pakete ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id                text PRIMARY KEY,               -- URL-Slug, z. B. "innenraumreinigung"
  name              text NOT NULL,
  tagline           text NOT NULL DEFAULT '',
  description       text NOT NULL DEFAULT '',
  includes          jsonb NOT NULL DEFAULT '[]'::jsonb,  -- Liste der enthaltenen Leistungen
  price_note        text NOT NULL DEFAULT '',            -- z. B. Hinweis zu möglichen Zusatzkosten
  requires_addon    boolean NOT NULL DEFAULT false,      -- "Nur Zusatzleistungen": mind. 1 Zusatzleistung nötig
  featured          boolean NOT NULL DEFAULT false,
  sort              integer NOT NULL DEFAULT 0,
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Preis- und Dauer-Matrix je Leistung × Fahrzeugkategorie.
-- price_cents = NULL bedeutet "Preis auf Anfrage".
CREATE TABLE IF NOT EXISTS service_prices (
  service_id          text NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  vehicle_category_id text NOT NULL REFERENCES vehicle_categories(id) ON DELETE CASCADE,
  price_cents         integer CHECK (price_cents IS NULL OR price_cents >= 0),
  duration_minutes    integer NOT NULL CHECK (duration_minutes >= 0 AND duration_minutes <= 1440),
  PRIMARY KEY (service_id, vehicle_category_id)
);

-- ─── Zusatzleistungen ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addons (
  id               text PRIMARY KEY,
  name             text NOT NULL,
  description      text NOT NULL DEFAULT '',
  price_cents      integer NOT NULL CHECK (price_cents >= 0),
  price_is_from    boolean NOT NULL DEFAULT false,   -- "ab"-Preis (Endpreis nach Aufwand)
  duration_minutes integer NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0 AND duration_minutes <= 1440),
  bookable_alone   boolean NOT NULL DEFAULT true,    -- auch ohne Paket buchbar
  sort             integer NOT NULL DEFAULT 0,
  active           boolean NOT NULL DEFAULT true
);

-- ─── Arbeitszeiten (ISO-Wochentag 1 = Montag … 7 = Sonntag) ───────────────────
CREATE TABLE IF NOT EXISTS working_hours (
  weekday     smallint PRIMARY KEY CHECK (weekday BETWEEN 1 AND 7),
  is_open     boolean NOT NULL DEFAULT false,
  open_time   time NOT NULL DEFAULT '08:00',
  close_time  time NOT NULL DEFAULT '18:00',
  CHECK (close_time > open_time)
);

-- ─── Gesperrte Zeiten (Urlaub, Feiertage, private Termine) ─────────────────────
CREATE TABLE IF NOT EXISTS blocked_periods (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL,
  reason      text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS blocked_periods_range_idx ON blocked_periods (starts_at, ends_at);

-- ─── Buchungen ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference              text NOT NULL UNIQUE,                 -- Buchungsnummer, z. B. GM-2611-K7Q4
  access_token_hash      text NOT NULL UNIQUE,                 -- SHA-256 des Bestätigungs-Links
  status                 text NOT NULL DEFAULT 'neu'
                         CHECK (status IN ('neu','bestaetigt','in_bearbeitung','abgeschlossen','storniert')),

  -- Momentaufnahme der gebuchten Leistung (bleibt stabil, auch wenn Preise später geändert werden)
  service_id             text,
  service_name           text NOT NULL,
  vehicle_category_id    text,
  vehicle_category_name  text NOT NULL,
  addons                 jsonb NOT NULL DEFAULT '[]'::jsonb,
  service_price_cents    integer,                              -- NULL = auf Anfrage
  total_price_cents      integer,                              -- NULL = auf Anfrage
  price_is_from          boolean NOT NULL DEFAULT false,
  duration_minutes       integer NOT NULL CHECK (duration_minutes > 0),

  -- Termin: [starts_at, ends_at) = Arbeitszeit, blocked_until = ends_at + Pufferzeit
  starts_at              timestamptz NOT NULL,
  ends_at                timestamptz NOT NULL,
  blocked_until          timestamptz NOT NULL,

  -- Kunde
  first_name             text NOT NULL,
  last_name              text NOT NULL,
  email                  text NOT NULL,
  phone                  text NOT NULL,
  street                 text NOT NULL,
  postal_code            text NOT NULL,
  city                   text NOT NULL,
  vehicle_model          text NOT NULL,
  license_plate          text,
  customer_message       text,

  privacy_accepted_at    timestamptz NOT NULL,
  terms_accepted_at      timestamptz NOT NULL,

  customer_email_status  text NOT NULL DEFAULT 'ausstehend',   -- gesendet | fehlgeschlagen | nicht_konfiguriert | ausstehend
  admin_email_status     text NOT NULL DEFAULT 'ausstehend',
  admin_note             text,
  anonymized_at          timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  CHECK (ends_at > starts_at),
  CHECK (blocked_until >= ends_at),

  -- Doppelbuchungsschutz auf Datenbankebene: Aktive Termine (inkl. Pufferzeit) dürfen sich nie überschneiden.
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    tstzrange(starts_at, blocked_until, '[)') WITH &&
  ) WHERE (status <> 'storniert')
);
CREATE INDEX IF NOT EXISTS bookings_starts_at_idx ON bookings (starts_at);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);
CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings (lower(email));

-- Verlauf je Buchung (Statusänderungen, Terminänderungen, E-Mails)
CREATE TABLE IF NOT EXISTS booking_events (
  id          bigserial PRIMARY KEY,
  booking_id  uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  type        text NOT NULL,
  message     text NOT NULL DEFAULT '',
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_events_booking_idx ON booking_events (booking_id, created_at);

-- ─── Rate-Limiting (Login-Schutz, Spam-Schutz für Buchungen) ───────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  key          text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count        integer NOT NULL
);

-- ─── Supabase-Härtung ───────────────────────────────────────────────────────────
-- Row Level Security ohne Policies: Die öffentliche Supabase-REST-API (anon/authenticated)
-- kann so keine Daten lesen oder schreiben. Der Server greift als Tabellen-Eigentümer zu.
ALTER TABLE settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_prices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours       ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_periods     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits         ENABLE ROW LEVEL SECURITY;
`,
  },
  {
    id: "002_plattform",
    sql: String.raw`
-- Erweiterung der Plattform: Aktionen/Einführungspreise, Galerie mit Upload, Kontaktanfragen,
-- Teams, Terminanfragen, Online-Stornierung, Terminerinnerungen.

-- Für das Überschneidungsverbot je Team (Gleichheit auf "team" + Überlappung des Zeitraums)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE services ADD COLUMN IF NOT EXISTS image_src text;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'buchung';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS team smallint NOT NULL DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS house_number text NOT NULL DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS location_note text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS regular_price_cents integer;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promotion_name text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promotion_percent integer;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by text;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_kind_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_kind_check CHECK (kind IN ('buchung','anfrage'));
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_team_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_team_check CHECK (team BETWEEN 1 AND 20);

-- Doppelbuchungsschutz je Team: Aktive Termine (inkl. Pufferzeit) desselben Teams dürfen sich nie überschneiden.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
  team WITH =,
  tstzrange(starts_at, blocked_until, '[)') WITH &&
) WHERE (status <> 'storniert');

-- ─── Aktionen (Einführungspreise, Rabatte) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS promotions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  service_id          text REFERENCES services(id) ON DELETE CASCADE,
  vehicle_category_id text REFERENCES vehicle_categories(id) ON DELETE CASCADE,
  discount_percent    integer CHECK (discount_percent BETWEEN 1 AND 90),
  promo_price_cents   integer CHECK (promo_price_cents >= 0),
  starts_at           timestamptz,
  ends_at             timestamptz,
  active              boolean NOT NULL DEFAULT true,
  show_strikethrough  boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CHECK ((discount_percent IS NOT NULL) <> (promo_price_cents IS NOT NULL)),
  CHECK (promo_price_cents IS NULL OR (service_id IS NOT NULL AND vehicle_category_id IS NOT NULL)),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

-- ─── Medien (hochgeladene Bilder, in der Datenbank gespeichert) ────────────────
CREATE TABLE IF NOT EXISTS media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mime        text NOT NULL,
  data        bytea NOT NULL,
  width       integer,
  height      integer,
  bytes       integer NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Galerie (Vorher/Nachher-Paare und Einzelbilder) ───────────────────────────
CREATE TABLE IF NOT EXISTS gallery_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL CHECK (kind IN ('vergleich','bild')),
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  category    text NOT NULL DEFAULT '',
  before_src  text,
  after_src   text,
  image_src   text,
  alt         text NOT NULL DEFAULT '',
  is_demo     boolean NOT NULL DEFAULT false,
  published   boolean NOT NULL DEFAULT true,
  sort        integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'vergleich' AND before_src IS NOT NULL AND after_src IS NOT NULL) OR (kind = 'bild' AND image_src IS NOT NULL))
);

-- ─── Kontaktanfragen ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inquiries (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  email                text NOT NULL,
  phone                text NOT NULL DEFAULT '',
  topic                text NOT NULL DEFAULT '',
  message              text NOT NULL,
  status               text NOT NULL DEFAULT 'neu' CHECK (status IN ('neu','erledigt')),
  privacy_accepted_at  timestamptz NOT NULL,
  admin_email_status   text NOT NULL DEFAULT 'ausstehend',
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inquiries_created_idx ON inquiries (created_at DESC);

ALTER TABLE promotions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE media          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries      ENABLE ROW LEVEL SECURITY;
`,
  },
]
