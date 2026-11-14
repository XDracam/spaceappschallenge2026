// Shell-only labels for the four stations (lobby, seat picker, switcher).
import type { StationId } from '../core/model';

export const STATION_INFO: Record<StationId, { label: string; short: string; blurb: string; color: string }> = {
  planner: {
    label: 'Mission Planner',
    short: 'Plan',
    blurb: 'Designs the spacecraft, the trajectory and the launch date.',
    color: '#3fc7ff',
  },
  procurement: {
    label: 'Procurement',
    short: 'Proc',
    blurb: 'Buys the parts: compares offers, signs contracts, watches deliveries.',
    color: '#ffaa5c',
  },
  science: {
    label: 'Science',
    short: 'Sci',
    blurb: 'Runs research projects that unlock better technology.',
    color: '#3fe0a0',
  },
  comms: {
    label: 'Communications',
    short: 'Comms',
    blurb: 'Talks to politicians, press and partners — and keeps the budget coming.',
    color: '#b98cff',
  },
};
