import React, { Fragment } from "react";

function NotFound() {
  return (
    <Fragment>
      <h1 className="x-large text-primary">
        <i className="fas fa-exclamation-triangle" /> Page not found
      </h1>
      <p className="large">
        Sorry, the devs are a bunch of lazy good-for-nothings.
      </p>
      <p className="lead">What can we do?</p>
    </Fragment>
  );
}

export default NotFound;
