npx create-react-app --template typescript home-site
git config --global core.safecrlf false
git rm -r --cached home-site/node_modules
yarn add styled-components @types/styled-components
yarn add @types/react-router-dom react-router-dom react-markdown 
yarn add react-transition-group @types/react-transition-group
git log --format=%aD -- cashier.md | tail -1
<!-- order important -->
ffmpeg -hide_banner -y -ss 57.0 -i gg.mp4 -filter_complex "[0:v] fps=10,scale=200:-1,crop=in_w:in_h-150:0:100, split [a][b];[a] palettegen [p];[b][p] paletteuse" gg.gif