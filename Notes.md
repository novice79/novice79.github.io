npx create-react-app --template typescript home-site
git config --global core.safecrlf false
git rm -r --cached home-site/node_modules
yarn add styled-components @types/styled-components
yarn add @types/react-router-dom react-router-dom react-markdown 
git log --format=%aD -- cashier.md | tail -1