#!/bin/bash
exemption=(
    404.html
    Notes.md
    dist
    doc
    home-site
    img
    posts
    privacy_policy.html
    build.sh
    pub.sh
    screenshots
    video
)
cd home-site
npm run build
cd ..
for f in *; do
    [[ ! "${exemption[@]}" =~ "$f" ]] && rm -rvf "$f"
done
mv home-site/build/* .
