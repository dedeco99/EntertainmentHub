import React from "react";
import { Route, Redirect } from "react-router-dom";

import { validateToken } from "../../actions/auth";

const PrivateRoute = ({ component: Component, ...rest }) => {
	const user = localStorage.getItem("user");
	const token = localStorage.getItem("token");

	return (
		<Route
			{...rest}
			render={props => {
				if (user && token) {
					return <Component {...props} />;
				} else {
					return <Redirect to={{ pathname: "/login", state: { from: props.location } }} />;
				}
			}}
		/>
	)
}

export default PrivateRoute;
