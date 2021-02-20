import styled from "styled-components"
import { Link } from 'react-router-dom'

export const Header = styled.div`
    position: relative;
    width: 100%;
    height: 20vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: skyblue;
`
export const Logo = styled.img`
    position: absolute;
    width: 10vh;
    height: 10vh;
    top: 50%;
    left: 10%;
    transform: translate(-50%, -50%);
`

export const Slogan = styled.div`
    position: absolute;
    bottom: 1em;
    right: 1em;
    font-style: italic;
    @media(max-width: 768px) {
        bottom: 0.3em;
        right: 0.5em;
    }
`
export const Container = styled.div`
    width: 100%;
    height: 80vh;
    position: relative;
    display: flex;
    align-items: center;
    background-color: rgb(184, 231, 247);
    @media(max-width: 768px) {
        padding-top: 8rem;
    }
`
export const Content = styled.div`
    padding: 1em;
    width: 80%;
    height: 100%;
    border: 2px inset;
    overflow: auto;
    @media(max-width: 768px) {
        width: 100%;
    }
`
export const Sidebar = styled.div`
    width: 20%;
    height: 100%;
    border: 0.5rem outset;
    overflow: auto;
    > * {
        &:first-child {
            text-align: center;
            margin: 1rem auto 2.5rem;
            border-bottom: 10px solid grey;
        }
    }
    @media(max-width: 768px) {
        position: absolute;
        margin: 0.3rem auto 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        height: 8rem;
        left: 0;
        top: 0;
    }
`
// flex-wrap: wrap;
// box-shadow: 50px 50px 3px #888888;
export const Item = styled.div`
    width: 100%;
    border: 3px groove;
    & + & {
        margin-top: 1rem;
    }

`
export const StyledLink = styled(Link)`
    text-decoration: none;

    &:focus, &:hover, &:visited, &:link, &:active {
        text-decoration: none;
    }
`;