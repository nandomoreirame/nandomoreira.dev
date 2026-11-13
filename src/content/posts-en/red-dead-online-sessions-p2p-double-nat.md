---
slug: red-dead-online-sessions-p2p-double-nat
translationOf: sessoes-do-red-dead-online-p2p-relays-e-nat-duplo
title: "My study of Red Dead Online sessions: P2P, Rockstar relays and the double NAT I built myself"
seoTitle: "Red Dead Online sessions: P2P, relays and double NAT"
summary: "I spent ten days looking at my Xbox traffic to understand how a Red Dead Online session forms. I learned to tell a player from a relay in a capture, found that my gateway had dropped the NAT type to Moderate, and that hiding the home IP costs an MTU tweak."
markers:
  - networks
  - linux
  - homelab
  - xbox
extras:
  - "10 days capturing Xbox traffic"
  - "iptables · tcpdump · WireGuard"
keyPoints:
  - "The session has two layers: TCP 80 and 443 with Rockstar, and P2P on UDP 6672 and 61455 to 61458 between players."
  - "The gateway masquerade plus the modem NAT became double NAT and dropped the Xbox to Moderate."
  - "Hiding the home IP behind a VPN needs an MSS clamp: the tunnel has MTU 1280, and the large TLS packet died silently."
snapshot:
  items:
    - label: Gateway
      value: Linux
    - label: Filter
      value: iptables
    - label: Tunnel
      value: WireGuard
    - label: VPN
      value: AirVPN
    - label: Console
      value: Xbox
---

With two friends in the session, the capture returned four IPs. Two of them exchanged 1,805 and 1,664 packets with my Xbox; the other two, six and four. I expected three addresses (me plus two), and it was the fourth that made me stop treating Red Dead Online as a black box.

The tool that came out of this, rdo-solo, already has [its own post](/en/rdo-solo-alone-via-home-gateway). Here the subject is what I learned about the network along the way: how the session talks, who is who in a capture, and what my home network did to the console's NAT type when I put a Linux gateway in the middle.

## Two conversations at once

A public Red Dead Online session has two traffic layers. One is with Rockstar's servers, on TCP 80 and 443, and that is what keeps the console online. The other is direct between players, on UDP: port 6672 and the range from 61455 to 61458, which Red Dead shares with GTA Online because both use the same netcode.

The clicker (the toggle on the network cable I used) cuts both at once, for an instant. The session empties, and as I used to describe it, "we stay a few minutes in the clean session until other players start coming in". Dropping only the UDP ports on the gateway changes the picture: the other players disappeared from my session and it stayed alive, because the channel with Rockstar never fell.

The rule has to bite the ports in both directions and as source and destination at the same time, because the console uses those ports as local and the other players do too. That is four combinations per range, and the script has all four.

**A session is also not just "me and the other players".** It is a P2P mesh with a host, who is one of the players, and Rockstar relays underneath, and the host migrates from time to time. Not knowing that killed my first attempt to let only friends in, and that story is in the other post.

## Who is a player and who is Rockstar

Back to the four IPs: the two with more than sixteen hundred packets were my friends, with Brazilian residential ISP PTRs. The two with half a dozen packets were in the same `/24`, with no reverse DNS at all, in a block registered as `RSGEWR`. RSG for Rockstar Games, EWR for Newark (they name datacenters by the airport code). The next day others showed up ending in `RSGSJC`, San Jose.

Both belong to `RSONET-NA1`, the `192.81.240.0/21` range, Rockstar's North America online network. Those relays hit the console's port all the time, one to four packets per interval, so the solo-mode log was almost only Rockstar. I even asked whether I could let that range through and block the rest. I could, but the relays also carry traffic from players who could not get a direct connection, and opening the range would open exactly the door solo mode closes. I decided to keep blocking and only hide the range from the log.

The PTR heuristic worked well on that first capture and failed on the next one. With 14 players in the session (counted on the game screen), the TUI marked two as `player` and the rest as `?`. **A console player almost never has reverse DNS**, so requiring a residential-looking PTR left everyone as unknown, and the timer that should stop when the first player joins kept counting. The rule became something else: in the session list, every direct P2P peer that is not Rockstar and not a datacenter counts as a player, with a floor of five packets to ignore an isolated probe. The screen started showing 17 peers: the players, two relays and transient connections from the console itself.

And the capture catches everyone who is in the session at that moment. When I tested the posse capture, three friends came back plus two United States addresses I swore were Rockstar. They were not: one was residential broadband and the other a mobile network, two strangers who were in the same public session. That is where the button to remove one IP at a time from the saved list came from.

## The gateway that did no NAT

The initial design was simple. The Xbox got a fixed IP outside the modem's DHCP range and started using the homelab as its gateway. The homelab only forwards, with no NAT, and the return comes from the modem straight to the console. The point of not masking anything was exactly not to change the Xbox's NAT type.

That has one requirement: `send_redirects` off on the homelab. On, the kernel notices that the console and the modem are on the same network and tells the console to talk to the modem directly, and every filter rule becomes decoration with no error showing up.

It worked until the night of September 29, when I rebooted the homelab, the modem and the Deco. The Xbox had no internet. The iptables counters told the story: the console sent more than 200 thousand packets out and received zero. After the reboots, the Vivo modem started dropping packets with the console's IP leaving through the homelab's MAC, an address it had never handed out over DHCP. The fix was a `MASQUERADE` only for the console, which I left persistent on boot.

The next day my friends started complaining that they could not join my session. Connection error even with solo mode off, and not every time: sometimes I connected normally. I tried the obvious path, drop the masquerade and go back to pure forwarding. The Xbox internet went bad immediately and Discord disconnected, so the masquerade came back right away.

That is when I connected the dots: the problem had started overnight, exactly the night of the masquerade. The Xbox network test closed the diagnosis with **Moderate NAT**. The homelab masquerade plus the modem NAT is double NAT, and the console dropped a category. With Moderate I connect with almost everyone and fail with whoever is on Strict NAT, which is exactly the intermittent pattern the friends were seeing. Until the VPN, the choice was one I did not want to have to make:

| Xbox gateway | Solo mode | Playing with friends |
|---|---|---|
| homelab | works | unstable (double NAT, Moderate) |
| modem | has no effect | works (simple NAT) |

The real fix would be on the modem: bind the console's IP to the homelab's MAC, or find and turn off the protection (probably anti-spoofing) that the reboots turned back on. I never got to it, because the VPN in the next section changed the console's path: once the Xbox leaves through the tunnel, posse play became stable. The Moderate that remains is from the VPN without port forwarding, no longer from the modem.

## Hiding the home IP costs MTU

P2P has a side effect I discovered when I heard about the "panels": everyone in the session sees everyone else's home IP, and there are people who grab that IP and DDoS the player. The defense is for the game traffic to leave through an IP that is not mine, on infrastructure that can take the flood.

The first attempt, on September 25, was to route the Xbox through a [Tailscale](https://tailscale.com) exit node on a free Oracle VPS. The tunnel has MTU 1280 and the home network, 1500. Without MSS clamping, the TLS handshake opens (small packet) and the large certificate packet dies in silence. The symptom is confusing: games with a warning icon in the library, Discord that will not connect, browsing half online. A `ping -M do -s` from the router failed above 1240 bytes, and the clamp at 1240 (1280 minus 40 of IP and TCP header) fixed it. It worked, and even so I gave up and undid everything the same night ("I thought it would be easier and it does not look like it is going to be that easy"). What remained from that attempt was the Tailscale route table that later swallowed the console's traffic.

On October 3 the subject stopped being theoretical. I started getting threats from players saying they would take my internet down, and then it was clear that isolating the posse sessions was not enough. The filter decides who enters the session, but it does not erase the IP someone already saw in a public session, and a DDoS does not need the game to reach the modem. What happened with the threats is for another piece.

This time I went with a commercial VPN (AirVPN, over [WireGuard](https://www.wireguard.com)) coming up on the homelab and a route rule that sends only the Xbox IP into the tunnel. The Xbox got the VPN IP, the network test gave Moderate NAT and every service available. Then I opened Red Dead and it stuck on the loading screen.

The first diagnosis, from Claude, who followed me through this whole investigation, was that Red Dead and Xbox Live do not mix with a datacenter VPN, and the recommendation was to take the VPN off the console. I did not accept that, because I had signed up for the VPN exactly for this. The real cause was the same as the first attempt: the MSS clamp was missing, now on a tunnel with MTU 1320. With the two `TCPMSS --clamp-mss-to-pmtu` rules in `PostUp`, the game opened fast and I went to play with the posse.

From October 4 the exit stopped being São Paulo and started rotating between the United States and Canada, switching every day at 5am. I chose the early morning because switching servers restarts the tunnel, the exit IP changes and the P2P session drops with it. NAT stays Moderate; the next step to improve it is to open the game's UDP ports on the VPN panel and DNAT them to the console, and I have not done that yet.

## The IPv6 blind spot

The whole filter is IPv4. The Xbox Series picks up IPv6 from the modem by router advertisement, and that traffic never goes through the homelab. The Vivo modem's customer login does not expose IPv6 controls, and the Xbox Series removed the option the Xbox One had. The visible consequence is that the console resolves DNS through the modem over IPv6, bypassing [Pi-hole](https://pi-hole.net): I opened the Xbox browser and the page came full of ads that Pi-hole blocks on every other device in the house.

When I looked, the console was not using IPv6 for the game's P2P, and the rdo-solo TUI warns in the header if that changes. I left it as is, knowing it is a hole, because closing it for real depends on asking the ISP or putting the console on its own network segment.

## What was decided

- Solo mode on to stay alone, off to play with a posse. Missions, series and confrontations are already instanced for the posse only.
- Rockstar relays stay blocked in solo mode; they only disappear from the log.
- The Xbox leaves through the VPN, not the modem, so double NAT stopped getting in the posse's way. The modem fix was left undone.
- The VPN carries only the Xbox, always with an MSS clamp, and switches country in the early morning.

`0 packets dropped by kernel`
