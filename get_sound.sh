#!/bin/bash
# ./get_sound.sh URL
URL=$1
yt-dlp -x --audio-format wav " $URL" -o "alert.wav"
echo "Done! alert.wav is ready for BackSight."