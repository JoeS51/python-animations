#!/usr/bin/env bash
# Composites Subway Surfers gameplay into the bottom-right corner of the
# finished ASM render. The ASM frame is never scaled or covered: the corner
# (x >= 1376, y >= 640) is empty for the whole video, measured from a
# max-brightness map over every frame.
#
# usage: scripts/subway-gag.sh <gameplay.mp4> [asm.mp4] [out.mp4]
set -euo pipefail

GAMEPLAY=${1:?usage: $0 <gameplay.mp4> [asm.mp4] [out.mp4]}
ASM=${2:-out/assembly-intro-full.mp4}
OUT=${3:-out/assembly-intro-subway.mp4}

GAME_START=20   # skip the channel intro, start mid-run
W=480 H=270     # 16:9 picture-in-picture
X=1416 Y=786    # 24px from the right and bottom edges
R=14            # corner radius
B=2             # border width, matches LINE (#333333) in AssemblyIntro
VOL=0.55

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$ASM")
FADE_OUT=$(awk "BEGIN{print $DUR - 1.5}")

# rounded-rect alpha: 255 inside, 0 outside the corner arcs
round() { # w h r
  echo "if(gt(abs(X-($1-1)/2),($1-1)/2-$3)*gt(abs(Y-($2-1)/2),($2-1)/2-$3),if(lte(hypot(abs(X-($1-1)/2)-(($1-1)/2-$3),abs(Y-($2-1)/2)-(($2-1)/2-$3)),$3),255,0),255)"
}

ffmpeg -v warning -stats -y \
  -i "$ASM" \
  -ss "$GAME_START" -t "$DUR" -i "$GAMEPLAY" \
  -filter_complex "
    [1:v]fps=30,scale=$W:$H:flags=lanczos:out_range=full,format=yuva444p,
         geq=lum='p(X,Y)':cb='p(X,Y)':cr='p(X,Y)':a='$(round $W $H $((R - B)))',
         fade=t=in:st=0.3:d=0.6:alpha=1,fade=t=out:st=$FADE_OUT:d=1:alpha=1[game];
    color=c=0x333333:s=$((W + 2 * B))x$((H + 2 * B)):r=30:d=$DUR,format=yuva444p,
         geq=lum='p(X,Y)':cb='p(X,Y)':cr='p(X,Y)':a='$(round $((W + 2 * B)) $((H + 2 * B)) $R)',
         fade=t=in:st=0.3:d=0.6:alpha=1,fade=t=out:st=$FADE_OUT:d=1:alpha=1[frame];
    [0:v][frame]overlay=$((X - B)):$((Y - B)):format=yuv444[bg];
    [bg][game]overlay=$X:$Y:format=yuv444,format=yuvj420p[v];
    [1:a]volume=$VOL,afade=t=in:st=0.3:d=0.8,afade=t=out:st=$FADE_OUT:d=1.5[a]
  " \
  -map "[v]" -map "[a]" -t "$DUR" \
  -c:v libx264 -preset slow -crf 14 -tune animation \
  -color_range pc -colorspace bt470bg -color_primaries bt470bg \
  -c:a aac -b:a 192k -movflags +faststart \
  "$OUT"

echo "wrote $OUT"
