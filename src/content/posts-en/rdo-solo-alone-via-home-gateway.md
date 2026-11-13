---
slug: rdo-solo-alone-via-home-gateway
translationOf: rdo-solo-red-dead-online-sozinho-pelo-gateway
title: "rdo-solo: Red Dead Online alone through the home gateway, now open source"
seoTitle: "rdo-solo: Red Dead Online alone via the home gateway"
summary: "I open-sourced rdo-solo, the controller that lets me stay alone in a public Red Dead Online session on Xbox. The console goes through a Linux gateway, the gateway drops the game's P2P, and you can turn it on and off from the terminal, a Rust TUI, or the phone."
markers:
  - linux
  - networks
  - open source
extras:
  - "3 ways to control: shell, TUI and web"
  - "iptables · Rust · Next.js"
keyPoints:
  - "With solo mode on, the Linux gateway drops the game's UDP P2P and the console stays online."
  - "A friends-only whitelist fails: the session depends on an unknown host and on Rockstar relays."
  - "Script, TUI and web panel share the same state, so you can turn it on with one and off with another."
snapshot:
  items:
    - label: Gateway
      value: Linux
    - label: Filter
      value: iptables
    - label: TUI
      value: Rust
    - label: Panel
      value: Next.js
    - label: Console
      value: Xbox
---

> **Warning**
>
> Blocking the game's P2P traffic messes with your connection to the servers and to other players. **This may violate Rockstar/Take-Two's Terms of Service and, in theory, lead to account penalties (including a ban).** Use at your own risk, for personal/educational purposes; read the "Terms of use" section in `homelab/rdo-solo.md`. This is a personal tool, extracted from a private dotfiles repo and shared as-is, **with no warranty**.
>
> The `web/` panel protects access with a PIN + signed session, but it was designed for a **local network / [Tailscale](https://tailscale.com)**, not for direct exposure on the internet.

[rdo-solo](https://github.com/nandomoreirame/rdo-solo) is open on GitHub, under the MIT license since October 8. It is what I use to stay alone in a public Red Dead Online session on Xbox: the console sits wired behind a Linux gateway, and with solo mode on the gateway drops the game's peer-to-peer UDP ports (6672 and 61455 to 61458). Traffic with Rockstar's servers keeps flowing, so the session stays alive, only nobody can open a direct connection to me. It works the same on GTA Online, which uses the same netcode.

It is for anyone whose console goes through a Linux machine they control: a homelab, a mini-PC, a Raspberry Pi. It does not have to be a server: a Linux laptop, with the Xbox plugged into it by cable, also works, as long as the laptop shares its own internet (over Wi-Fi, for example) with the console. On any PC that is not in the path of the console's traffic it does nothing, because **the value is in the topology, and the binary is secondary**.

## From the clicker to the gateway

It all started with a clicker I built from a switch, a network cable and a toggle. The clicker is the known way to empty a session: one click cuts the network, and the session empties. Only it is a pulse, and in a few minutes it fills up again. That is where the script idea came from: leave the block on the gateway, on for as long as I want, instead of clicking the switch over and over.

The right use is exactly that, staying alone on the hunting and collecting grind with nobody getting in the way. To play with a posse I turn the filter off: missions, series and confrontations already run in a private posse instance, and the filter on is exactly what drops those activities with a "network failure".

On the risk in the warning above: what the community reports is low, never zero. On Rockstar's side, blocked P2P is indistinguishable from a restricted NAT or bad internet, and what gets accounts punished is messing with game state (item dupe, a mod injecting content). Inside the solo session nobody else is hurt. Using a network cut in PvP to stay invulnerable while killing others is a different conversation, and there the harm is to third parties.

## How to try it

You need a Linux gateway the console routes through (forwarding and NAT), root on it, `iptables` and `iproute2`. The TUI needs `tcpdump`; `whois` and a MaxMind GeoLite2 City database are optional and only enrich the IPs.

The simplest path is the shell script, straight on the gateway:

```bash
git clone https://github.com/nandomoreirame/rdo-solo.git
cd rdo-solo
sudo ./homelab/rdo-solo on      # liga o bloqueio P2P
./homelab/rdo-solo status       # estado (o único que não pede senha)
sudo ./homelab/rdo-solo off     # desliga
```

The console IP and the outbound interface live in `/etc/rdo-solo.conf` (`CONSOLE_IP`, `WAN_IF`). And it has to be right, because the filter only bites the IP that is written there. If the console falls back to DHCP, every rule loads, nothing is blocked and status cheerfully answers `ON`. That is why `on` refuses to run when the two IPs do not match.

## What comes in the package

There are three ways to touch the same filter, and they share state under `/var/lib/rdo-solo/`, so `rdo-solo on` and `rdo-solo-tui on` are interchangeable.

| Piece | What it does |
|---|---|
| `homelab/rdo-solo` | The original shell script, which touches iptables and routing |
| `tui/` | A 1:1 Rust port with [ratatui](https://ratatui.rs), statically compiled with musl and sent over SSH, so it does not depend on the gateway's glibc |
| `web/` | A Next.js panel to turn it on and off from the phone, over the local network or Tailscale |

In the TUI, with solo off, the players-in-session tab lists the P2P peers the console is talking to, with city (GeoIP), type (player, datacenter or Rockstar), provider and time in the session. With solo on, the same tab becomes a table of who tried to join, ordered by threat. There is history that persists across sessions (answers "who hit me yesterday"), a warning when the Xbox has IPv6, which punches through a filter that only sees IPv4, and in the footer a `Tempo sozinho na sessão:` timer that freezes the moment the first player joins.

I almost always play in the office, on the gaming monitor (the MSI G272 in my [setup](/en/setup)), with rdo-solo running on the laptop next to it. The web panel exists for when I play from the couch, on the TV, and the laptop is far away. It runs on a custom Node server with WebSocket on the same port, since the App Router does not do WebSocket on its own, and it never touches the network directly: the server runs unprivileged and calls the gateway binary through a restricted sudo. Access is by constant-time PIN comparison, an HMAC-signed session and a attempt limit. It also notices when the game drops me: while connected, the console talks nonstop with Rockstar's service network (RSONET), and when that traffic disappears the panel warns "SESSÃO CAIU" and turns solo off by itself, because with the filter on reconnection does not get through. It is a heuristic, a good signal and nothing infallible. And it was designed for the local network and Tailscale, never to sit exposed on the internet.

## What I got wrong along the way

The script had a whitelist to let friends into a solo session. It looked like it worked: friends joined, the mission started, and a few minutes later the game showed "You changed sessions due to a network failure" and threw me alone into a new session, with the posse mission dead.

A Red Dead Online session is a P2P mesh with a host, who is one of the players, and Rockstar relays underneath. The game requires a connection to the host and to that backbone, not only to friends. The whitelist blocked everything but friends, so it dropped the host (almost always a stranger) and the relays. The mesh held until the next host migration to a blocked peer, and then it broke. I had not seen it before because the capture found the friends' IPs, but never the host or the relays. On September 28 the whitelist left the script.

Another one that got me was the console losing internet with the code `0x50060190`, which looks exactly like a Rockstar problem. It was Tailscale's table 52, leftover from an exit-node attempt, swallowing the Xbox's forwarded traffic. The fix is a route rule that `install` and boot apply, and the TUI shows route health in the header so it does not come back hidden.

## What comes next

The next step is to rebuild posse mode the right way, which is already in the code and on the panel as "SESSÃO EM BANDO": one button captures the peers of the current session, and when the mode turns on the gateway drops every P2P outside that list, **always letting Rockstar relays through**. The bet is that I become the host of a clean session. That mode has not been fully tested yet. I tested as far as the capture, which isolates the posse session IPs; what is left to test is turning the mode on for real, with the gateway blocking every external IP that is not on that list. The spec only treats it as done after a real session with a friend surviving activation and a host migration. Until then, the README only talks about solo mode. Further down the wishlist is a block list to ban only the IP of whoever is attacking, without emptying the session.

The code is at [github.com/nandomoreirame/rdo-solo](https://github.com/nandomoreirame/rdo-solo) and the project summary at [/en/lab/rdo-solo](/en/lab/rdo-solo). Personal tool, extracted from my dotfiles and shared as-is, with no warranty.

`rdo-solo off`
