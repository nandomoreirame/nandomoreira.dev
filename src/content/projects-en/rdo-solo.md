---
translationOf: rdo-solo
summary: "Solo session controller for Red Dead Online and GTA Online that blocks the game's peer-to-peer traffic on the Linux gateway the console goes through. It started as an iptables script and gained a Rust TUI, with players in the session and GeoIP, and a web panel to turn solo mode on and off from the phone."
problem: |
  Staying alone in a public game session depended on the "cable pull",
  unplugging and plugging the network cable back in at the right moment, which
  is manual, imprecise and has to be repeated every session.
decisions: |
  The block happens on the gateway, not on the console or a PC: all console
  traffic goes through there, so dropping the P2P UDP ports (6672 and
  61455-61458) is enough, and private posse missions keep working. The value
  is in the topology, not in the binary. The Rust TUI is statically compiled
  (musl) and sent over SSH; the Next.js web panel uses a PIN and a signed
  session and was designed for the local network or Tailscale, never for the
  open internet.
outcome: |
  Personal tool extracted from a private dotfiles repo and published as-is,
  under the MIT license. The README itself warns that blocking the game's
  traffic may violate Rockstar and Take-Two's terms of service.
---
