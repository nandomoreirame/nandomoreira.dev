---
slug: screen-recording-to-gif-shortcut
translationOf: gravar-a-tela-e-virar-gif-com-um-atalho
title: "Screen recording to GIF with a shortcut, with a counter on the bar"
seoTitle: "Screen recording to GIF with a shortcut on Niri"
summary: "I already recorded the screen with Ctrl+Alt+1 and wanted GIF. Two new shortcuts came out, an ffmpeg script with its own palette, and a Noctalia plugin that shows REC and the recording time on the bar."
markers:
  - linux
  - niri
  - noctalia
  - shell
extras:
  - "Ctrl+Alt+5 records GIF; Ctrl+Alt+6 converts the last video"
  - "gpu-screen-recorder · ffmpeg · Noctalia · Luau"
keyPoints:
  - "ffmpeg GIF without a palette comes out washed out; palettegen and paletteuse build a palette from the video itself."
  - "The script writes one line to a file and the bar only reads that file once a second, without running any process."
  - "With the screen picker opening every time, the counter starts at the shortcut and ends a few seconds longer than the video."
snapshot:
  items:
    - label: "Recorder"
      value: "gpu-screen-recorder"
    - label: "Conversion"
      value: "ffmpeg (palettegen)"
    - label: "Default GIF"
      value: "15 fps · 960 px"
    - label: "Compositor"
      value: "Niri"
    - label: "Bar"
      value: "Noctalia v5 · recbar"
---

Since June I record the screen with `Ctrl+Alt+1`: press once, pick what to record, press again and the `.mp4` is saved. On October 27 I wanted a GIF clip and asked Claude Code, the way it came into my head: "I have a shortcut that starts screen recording, but is there some way for that recording to turn into a gif?". That same day I had two more shortcuts and a new plugin on the bar.

You can solve this by installing another recorder that already outputs GIF. I did not want to replace what worked: **I prefer my own script and a one-line state file over switching recorders just to gain a feature.** If you use Wayland with a compositor that is neither GNOME nor KDE, you probably already wired your own recorder by hand too, and the path below fits into it.

## The shortcut that already existed

`gsr-toggle` is a script that starts and stops [gpu-screen-recorder](https://git.dec05eba.com/gpu-screen-recorder/about/), a recorder that encodes video on the GPU. On [Niri](https://github.com/YaLTeR/niri) it cannot capture the screen directly, so it asks through the [xdg-desktop-portal](https://flatpak.github.io/xdg-desktop-portal/), that window that asks whether you want to record the whole screen, a window, or a region.

The logic is a toggle with a PID file: if a recording is running, it sends `SIGINT` (so it closes the `.mp4` cleanly) and reports where it saved; if not, it starts one.

```bash
setsid gpu-screen-recorder \
  -w portal \
  -restore-portal-session no \
  -f "$fps" \
  "${audio_args[@]}" \
  -cursor yes \
  -o "$out_file" >>"$log_file" 2>&1 &

echo $! >"$pid_file"
```

The video lands in `Recordings`, inside the videos folder from `xdg-user-dir` (in my case `~/Vídeos`, with the accent), named `recording_<date>_<time>.mp4`.

## Two new shortcuts

In the first reply the options came: plain ffmpeg, [gifski](https://gif.ski), and Kooha (a GUI app that already records as GIF). I stuck with ffmpeg, which was already installed, and asked for two shortcuts:

```kdl
Ctrl+Alt+1 hotkey-overlay-title="Record video (start/stop)" { spawn-sh "~/.dotfiles/bin/utils/gsr-toggle"; }
Ctrl+Alt+5 hotkey-overlay-title="Record GIF (start/stop)" { spawn-sh "~/.dotfiles/bin/utils/gsr-toggle --gif"; }
Ctrl+Alt+6 hotkey-overlay-title="Convert last video to GIF" { spawn-sh "~/.dotfiles/bin/utils/video-to-gif"; }
```

`Ctrl+Alt+5` records without audio, at 30 fps, into a `gif_<date>.mp4` file. When I press again, it stops, hands the video to the converter and deletes the temporary `.mp4`: only the `.gif` remains. `Ctrl+Alt+6` is for when I recorded a normal video and only later decided I wanted GIF: it takes the newest `recording_*.mp4` and converts it.

Either shortcut stops any recording. The script keeps which file is being recorded, so it does not matter if I started with 1 and stopped with 5.

## The palette is what saves the GIF

An `ffmpeg -i in.mp4 out.gif` works, but comes out with that washed-out color of old GIFs. GIF only has 256 colors, and ffmpeg, without knowing which ones, uses a generic palette. The fix is to generate the palette from the video itself with [`palettegen`](https://ffmpeg.org/ffmpeg-filters.html#palettegen) and apply it with `paletteuse`, all in one filter:

```bash
ffmpeg -hide_banner -loglevel error -y -i "$input" \
  -vf "fps=${fps},scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5" \
  "$output"

wl-copy "$output" 2>/dev/null || true
```

`split` duplicates the video: one copy becomes the palette, the other is drawn with it. `stats_mode=diff` builds the palette looking at what changes between frames, which in a screen recording is what matters: the still background spends little color and the part that moves gets the rest. At the end the GIF path goes to the clipboard with `wl-copy`, ready to paste wherever I am sending it.

The default is 15 fps and 960 px wide, and you can change it without editing the script:

```bash
GIF_FPS=10 GIF_WIDTH=720 video-to-gif meu-video.mp4 saida.gif
```

For a ruler: a 2-second test video at 1280x720 became a 960x540 GIF at 721 KB. GIF grows fast, so for a long recording it is worth dropping fps or width.

## Show on the bar that it is recording

With the GIF solved, the second question came: "how do I show on the bar that something is recording? with the seconds/minutes count?".

[Noctalia](https://docs.noctalia.dev/) v5, the bar I use on Niri, has no native widget that runs something and updates on its own: the custom button and the text are static. The official recording plugin uses its own recorder and does not show the time. So it became a new plugin, [recbar](https://github.com/nandomoreirame/noctalia-recbar).

The contract between the script and the bar is a one-line file. When recording starts, `gsr-toggle` writes to `$XDG_RUNTIME_DIR/gsr-toggle.state`:

```bash
echo "$mode $(date +%s) $out_file" >"$state_file"
```

On stop, it deletes it. [`widget.luau`](https://github.com/nandomoreirame/noctalia-recbar/blob/main/widget.luau) reads that file once a second with `noctalia.readFile`, without spawning any process, and hides when it does not exist:

```lua
local function render()
	local raw = noctalia.readFile(STATE_FILE)
	local m = present.bar(present.parse(raw), nowS())
	-- ...
	barWidget.setTooltip(m.tooltip)
	barWidget.setVisible(m.visible)
end
```

The rest lives in [`lib/present.luau`](https://github.com/nandomoreirame/noctalia-recbar/blob/main/lib/present.luau), which is pure functions only: it reads the mode and the start time, picks `REC` or `GIF` and formats the time as `mm:ss`, or `h:mm:ss` after one hour. Splitting it that way lets me test the part that matters without Noctalia running. The result is a red pill with `● REC 01:28` next to the tray ([the screenshot is in the repo](https://github.com/nandomoreirame/noctalia-recbar/blob/main/screenshot.png)), and clicking it stops the recording.

An honest note for anyone picking up the plugin: the click runs `gsr-toggle` through my dotfiles path. What is worth reusing is the state file format; any script of yours that writes that line on start and deletes it on stop lights up the pill. [[PREENCHER: how to install a third-party plugin on Noctalia v5, if you want to give the step-by-step]]

## What broke along the way

### The screen picker disappeared

The first time I tried `Ctrl+Alt+5`, the portal asked which of my three monitors to record. After that, it always recorded the same one, without asking. The new shortcut was not at fault: `gsr-toggle` had been running with `-restore-portal-session yes` since June and kept the choice in a token under `~/.cache`, shared by `Ctrl+Alt+1` and `Ctrl+Alt+5`. I switched to `-restore-portal-session no`, deleted the token, and now the screen, window, or region picker opens every time.

That swap has a cost. The state file is born when I press the shortcut, not when capture actually starts, so the seconds I spend picking the screen enter the count and the bar counter ends up longer than the video. You can make the counter wait for capture to really begin; I have not touched that yet.

### The empty folder killed the script

To find the newest recording, the script takes the last item in the `recording_*.mp4` list (the name has date and time, so alphabetical order is chronological). The June version did `${files[-1]:-$out_dir}`, and with an empty array bash does not use the default value: it blows up with "bad array subscript", and the script dies before showing any notification. The fix counts before indexing, in both scripts:

```bash
shopt -s nullglob
files=("${videos_dir}/Recordings"/recording_*.mp4)
input=""
((${#files[@]})) && input="${files[-1]}"
```

### The plugin did not show up on the bar

The code was right and the tests passed. Nothing on the bar. The settings Noctalia's UI saves on its own fully replace the enabled plugins list and the bar widget order, so editing only the dotfiles files was not enough. I enabled the plugin with Noctalia's own command, put `recbar` in those settings too, and today the bar config is fully versioned in the dotfiles, with `recbar` on the right side.

### The test that never failed

The `gsr-toggle` bats tests had assertions like `! grep ...` in the middle of the test, to guarantee something did not happen. In bats, that line never fails the test. When I fixed it, one of them started failing right away: it looked for `-a` (for audio) in the whole log and matched the `-a` from `notify-send`. The script was fine; the assertion was narrowed to the recorder line.

## Where it stopped

It ended up like this: `Ctrl+Alt+1` records video with sound, `Ctrl+Alt+5` records straight to GIF, `Ctrl+Alt+6` turns the last video into GIF. The bar shows what is recording and for how long.

The recorder is the same one from June. What changed was a 44-line script, one state line in a file, and a plugin that only knows how to read that line. There are [more scripts like this](/en/automate-your-own-problems) running here, and recbar is on GitHub for anyone who wants to pick up where I left off.

`kill -SIGINT "$pid"`
