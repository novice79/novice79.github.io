#!/bin/bash
exemption=(
    Notes.md
    dist
    doc
    home-site
    img
    posts
    privacy_policy.html
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
git add .
git commit -m"publish personal site again"
git push origin master --force