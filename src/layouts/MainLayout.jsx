import {NavLink, Outlet} from "react-router-dom";

import './MainLayout.css'

function MainLayout() {
    return (
        <>
            <nav className={"navbar"}>
                <ul>
                    <li>
                        <NavLink to="/">Dashboard</NavLink>
                    </li>
                    <li>
                        <NavLink to="/history">Game History</NavLink>
                    </li>
                </ul>
            </nav>
            <hr/>
            <main>
                <Outlet/>
            </main>
        </>
    )
}

export default MainLayout;