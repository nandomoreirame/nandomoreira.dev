---
slug: mute-headphones-for-78-days
translationOf: o-fone-mudo-e-o-jack-p2-no-pipewire
title: "Mute headphones for 78 days: a script that follows the P2 jack on PipeWire"
summary: "On my laptop, headphones and speakers live on different sound card profiles, and WirePlumber never switches on its own. The March fix was exactly what locked the headphones. Today a 164-line watcher listens to the connector and picks the profile for me."
markers:
  - linux
  - pipewire
  - shell
extras:
  - "78 days of mute headphones, 164 lines of watcher"
  - "PipeWire · WirePlumber · bats"
keyPoints:
  - "Headphones and speakers sit on different card profiles, and WirePlumber does not switch profiles when the jack changes."
  - "Picking the profile by hand records the choice, and WirePlumber stops switching on its own: that is what left the headphones mute."
  - "The watcher listens to alsactl monitor, compares the jack with the active profile and only switches when the two diverge."
snapshot:
  items:
    - label: "Notebook"
      value: "Dell Latitude 3450"
    - label: "Codec"
      value: "Realtek ALC3204"
    - label: "Audio"
      value: "PipeWire"
    - label: "Compositor"
      value: "Niri"
    - label: "Tests"
      value: "bats"
---

The headphones on my laptop had no sound from June 3 to August 20, 2026. That was 78 days with the P2 jack of a Dell Latitude 3450 producing no output at all, and the command that locked everything was the same one I had saved in a script, in March, to fix the audio.

The question I asked in March was how to force the speaker to play. The right question was another: who chooses the sound card profile (the set of outputs and inputs it enables at once), and at what moment. If the headphones on your Linux laptop also go mute for no clear reason, that is the question worth starting with. For me, what decides is the connector state, not [WirePlumber](https://pipewire.pages.freedesktop.org/wireplumber/). The answer became `audio-jack-autoswitch`, a 164-line script that starts with [Niri](https://github.com/YaLTeR/niri) and switches the profile when I plug or unplug the headphones.

## Headphones and speakers do not fit the same profile

You would expect headphones and speakers to be two ports of the same audio output, and plugging the headphones to only switch the port. On this laptop, no. The UCM of `sof-hda-dsp` (Realtek ALC3204, Raptor Lake), the file that tells ALSA what the card can do, declares Speaker and Headphones as conflicting, because both share the same DAC on the codec. [PipeWire](https://pipewire.org) then exposes them as separate card profiles:

```text
HiFi (HDMI1, HDMI2, HDMI3, Headphones, Headset, Mic1)
HiFi (HDMI1, HDMI2, HDMI3, Headset, Mic1, Speaker)
```

The second problem is that all four HiFi profiles always answer `available: yes`. Real availability lives on the ports, not the profiles. WirePlumber looks at priority, picks the profile with Headphones (10400, against 10300 for Speaker) and reevaluates nothing when the connector changes state. Either the headphones never play, or the speaker has no output at all.

## The March fix locked the headphones

In March I wrote `fix-audio-speaker`: switch the card to the profile with Speaker, find the sink id via `wpctl status`, set it as default and put the volume at 80%.

The problem was the side effect: `pactl set-card-profile` records the choice in `~/.local/state/wireplumber/default-profile`. **After the profile is chosen by hand, WirePlumber respects that choice and stops switching on its own.** With the Speaker profile pinned, the P2 jack had no output, no sound and no microphone. Both the script and the desktop sound panel do that write, and that is the state the laptop stayed in from June 3 to August 20.

`fix-audio-speaker` is still in `~/.dotfiles`, but with a warning at the top: running it is the deliberate decision to force the speaker now, not a fix.

## A watcher instead of a button

The new script listens to the connector instead of waiting for me to remember to press something. It reads card events through `alsactl monitor`, with no polling, and on each event compares the jack state with the active profile:

```bash
sync_once() {
    local desired current

    jack_is_plugged
    case $? in
        0) desired="$PROFILE_PLUGGED" ;;
        1) desired="$PROFILE_UNPLUGGED" ;;
        *) return 0 ;;   # jack ilegível: registra e não mexe em nada (trecho resumido)
    esac

    current="$(active_profile)"
    [ -z "$current" ] && return 0            # placa ainda não chegou no PipeWire
    [ "$current" = "$desired" ] && return 0  # idempotente

    pactl set-card-profile "$PW_CARD" "$desired"
}
```

A single plug fires several events, including the ones the profile switch itself generates, and `set-card-profile` only runs when the active profile diverges from the desired one. Without that, each switch would trigger another.

The monitor runs in a `coproc`, not a pipe, so `read` can have a timeout. That timeout is a 30-second heartbeat. It exists because a WirePlumber restart (or boot itself) picks the profile again by priority, with no jack event at all, and the speaker would stay mute until the next plug. The `coproc` also lets the script notice when the monitor dies: it waits 5 seconds and starts another.

In Niri, it comes in like any other session service:

```kdl
spawn-at-startup "sh" "-c" "~/.dotfiles/bin/utils/audio-jack-autoswitch"
```

## The details that make the script lie if you get them wrong

The card is addressed by name, `sofhdadsp`, never by index. Plug in a USB audio adapter and it takes index 0 and pushes the internal card to 1.

The jack control is queried with `iface=CARD`. `amixer cget` uses `iface=MIXER` by default, where jack controls do not exist, and answers `Cannot find the given element`. It is easy to swallow that answer as "nothing connected". That is why the function that reads the jack returns 0 for connected, 1 for disconnected and 2 for "I do not know", and the watcher logs the "I do not know" once per transition instead of acting on it. In the same function, the test looks for `values=on`, because the type line from `amixer` also carries a `values=1`.

And there can be only one watcher running. A second one, started by hand on top of the session one, would fight the first for the profile. The lock is a `flock` on a file in `$XDG_RUNTIME_DIR`, not a `pgrep -f`, which inside a script finds itself and says another one is already running.

The eight `bats` tests cover exactly these points, with fake `amixer` and `pactl` on `PATH`: plugging switches to Headphones, unplugging returns to Speaker, a profile already correct does not switch, the card is addressed by name, a missing card never switches the profile, the query uses `iface=CARD` and an unreadable jack is logged instead of swallowed.

## The price I accepted

Any manual profile choice in the sound panel is undone on the next event or the next heartbeat, within 30 seconds. That was on purpose: the manual choice is exactly what created the pin and killed the other side. To force the speaker for a moment, the path is `fix-audio-speaker`, knowing the watcher undoes it soon after.

The script is also for this laptop. The ALSA and PipeWire card names and the jack control name ship with the Latitude 3450 values and can be overridden by environment variable (`AUDIO_JACK_ALSA_CARD`, `AUDIO_JACK_PW_CARD`, `AUDIO_JACK_CONTROL`). The two profiles are written in the code, because they come from this card's UCM. On another machine, the first step is to look at its `pactl list cards`.

The card profile now follows the connector state, and picking the profile by hand became an exception that lasts until the next event.

`kill "$MONITOR_PID"`
