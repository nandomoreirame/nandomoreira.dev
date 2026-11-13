---
translationOf: grab-sh
summary: "Minimal screenshot script for Wayland and Hyprland that copies straight to the clipboard, without saving a file to disk. Two keyboard shortcuts: full screen or a region picked with the crosshair."
problem: |
  Screenshot tools save a file on every capture, when the destination is almost
  always pasting the image into a chat or a document. The result is a folder
  full of images nobody opens again.
decisions: |
  Compose three tools that already exist on Wayland (grim to capture, slurp to
  pick the region, wl-clipboard to copy) instead of writing a new one. Nothing
  goes to disk: each capture overwrites the clipboard. The installer creates a
  link in ~/.local/bin, and two Hyprland binds do the rest.
outcome: |
  Daily use on my desktop. One release published. It is small on purpose.
---
